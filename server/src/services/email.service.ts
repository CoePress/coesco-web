import { IEmailTemplate, ISendEmailOptions } from "@/types/schema.types";
import { IEmailService } from "@/types/service.types";
import path from "path";
import fs from "fs";
import ejs from "ejs";
import nodemailer from "nodemailer";
import puppeteer from "puppeteer";
import { config } from "@/config/config";

export class EmailService implements IEmailService {
  private templatesPath = path.join(__dirname, "..", "templates", "emails");
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      tls: { rejectUnauthorized: true },
    });
  }

  /**
   * Format currency helper function for templates
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }

  /**
   * Get all available email templates
   */
  async getTemplates(): Promise<IEmailTemplate[]> {
    const templateFiles = fs
      .readdirSync(this.templatesPath)
      .filter((file) => file.endsWith(".ejs"));

    const templates: IEmailTemplate[] = [];

    for (const file of templateFiles) {
      const slug = file.replace(".ejs", "");
      try {
        const template = await this.getTemplate(slug);
        templates.push(template);
      } catch (error) {
        console.error(`Error loading template ${slug}:`, error);
      }
    }

    return templates;
  }

  /**
   * Get a specific email template by slug
   */
  async getTemplate(slug: string): Promise<IEmailTemplate> {
    const templatePath = path.join(this.templatesPath, `${slug}.ejs`);

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template '${slug}' not found`);
    }

    const templateContent = fs.readFileSync(templatePath, "utf-8");

    // Extract metadata from template comments if available
    const metaMatch = templateContent.match(/<!--\s*META\s*([\s\S]*?)\s*-->/i);
    let name = slug;
    let description = "";
    let subject = "";

    if (metaMatch && metaMatch[1]) {
      try {
        const meta = JSON.parse(metaMatch[1]);
        name = meta.name || slug;
        description = meta.description || "";
        subject = meta.subject || "";
      } catch (error) {
        console.warn(`Invalid metadata in template ${slug}`);
      }
    }

    return {
      slug,
      name,
      description,
      subject,
      html: templateContent,
    };
  }

  /**
   * Save an email template
   */
  async saveTemplate(template: IEmailTemplate): Promise<IEmailTemplate> {
    if (!template.slug) {
      throw new Error("Template slug is required");
    }

    // Create metadata comment
    const meta = {
      name: template.name || template.slug,
      description: template.description || "",
      subject: template.subject || "",
    };

    const metaComment = `<!-- META ${JSON.stringify(meta, null, 2)} -->`;
    let content = template.html || "";

    // Replace existing metadata or add new metadata
    if (content.match(/<!--\s*META\s*[\s\S]*?\s*-->/i)) {
      content = content.replace(/<!--\s*META\s*[\s\S]*?\s*-->/i, metaComment);
    } else {
      content = `${metaComment}\n${content}`;
    }

    // Ensure templates directory exists
    if (!fs.existsSync(this.templatesPath)) {
      fs.mkdirSync(this.templatesPath, { recursive: true });
    }

    // Save the template file
    const templatePath = path.join(this.templatesPath, `${template.slug}.ejs`);
    fs.writeFileSync(templatePath, content, "utf-8");

    return this.getTemplate(template.slug);
  }

  /**
   * Delete an email template
   */
  async deleteTemplate(slug: string): Promise<boolean> {
    const templatePath = path.join(this.templatesPath, `${slug}.ejs`);

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template '${slug}' not found`);
    }

    try {
      fs.unlinkSync(templatePath);
      return true;
    } catch (error) {
      console.error(`Error deleting template ${slug}:`, error);
      return false;
    }
  }

  /**
   * Render an email template with data
   */
  async renderTemplate(slug: string, data: any): Promise<string> {
    const template = await this.getTemplate(slug);

    // Add helper functions to the data
    const templateData = {
      ...data,
      formatCurrency: this.formatCurrency,
    };

    try {
      // Render the template with EJS
      return ejs.render(template.html, templateData);
    } catch (error: any) {
      console.error(`Error rendering template ${slug}:`, error);
      throw new Error(`Failed to render template: ${error.message}`);
    }
  }

  /**
   * Generate a PDF from an email template
   */
  async generatePDF(
    slug: string,
    data: any,
    outputPath?: string
  ): Promise<Buffer | string> {
    const html = await this.renderTemplate(slug, data);

    // Launch browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();

      // Set content
      await page.setContent(html, { waitUntil: "networkidle0" });

      // If outputPath is provided, save PDF to file
      if (outputPath) {
        await page.pdf({
          path: outputPath,
          format: "A4",
          printBackground: true,
          margin: {
            top: "10mm",
            right: "10mm",
            bottom: "10mm",
            left: "10mm",
          },
        });

        return outputPath;
      }

      // Otherwise return PDF as buffer
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "10mm",
          right: "10mm",
          bottom: "10mm",
          left: "10mm",
        },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  /**
   * Send an email using a template
   */
  async sendEmail(options: ISendEmailOptions): Promise<boolean> {
    try {
      const { template, data, to, subject, from, cc, bcc, attachments } =
        options;

      // Render the template
      const html = await this.renderTemplate(template, data);

      // Send email
      const result = await this.transporter.sendMail({
        from: from || process.env.EMAIL_FROM,
        to,
        cc,
        bcc,
        subject: subject || (await this.getTemplate(template)).subject,
        html,
        attachments,
      });

      console.log(`Email sent: ${result.messageId}`);
      return true;
    } catch (error) {
      console.error("Failed to send email:", error);
      return false;
    }
  }

  /**
   * Send an email with a PDF attachment generated from the same template
   */
  async sendEmailWithPDF(
    options: ISendEmailOptions,
    pdfFilename: string
  ): Promise<boolean> {
    try {
      const { template, data } = options;

      // Generate PDF
      const pdfBuffer = (await this.generatePDF(template, data)) as Buffer;

      // Add PDF as attachment
      const attachments = options.attachments || [];
      attachments.push({
        filename: pdfFilename,
        content: pdfBuffer,
        contentType: "application/pdf",
      });

      // Send email with attachment
      return this.sendEmail({
        ...options,
        attachments,
      });
    } catch (error) {
      console.error("Failed to send email with PDF:", error);
      return false;
    }
  }

  /**
   * Example method to send an invoice email with PDF attachment
   */
  async sendInvoiceEmail(
    to: string,
    invoiceData: any,
    options: Partial<ISendEmailOptions> = {}
  ): Promise<boolean> {
    try {
      // Generate invoice number for filename
      const invoiceNumber = invoiceData.invoiceNumber || "unknown";
      const pdfFilename = `Invoice-${invoiceNumber}.pdf`;

      // Send email with invoice PDF
      return this.sendEmailWithPDF(
        {
          template: "invoice",
          data: invoiceData,
          to,
          subject: `Invoice ${invoiceNumber} from ${invoiceData.companyName}`,
          ...options,
        },
        pdfFilename
      );
    } catch (error) {
      console.error("Failed to send invoice email:", error);
      return false;
    }
  }
}
