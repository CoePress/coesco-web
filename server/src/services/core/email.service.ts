import { IEmailTemplate, ISendEmailOptions } from "@/types/schema.types";
import path from "path";
import fs from "fs";
import ejs from "ejs";
import nodemailer from "nodemailer";
import puppeteer from "puppeteer";
import { config } from "@/config/config";
import juice from "juice";
import { IQueryParams } from "@/types/api.types";
import { machineDataService } from "@/services";
import handlebars from "handlebars";
import HTMLtoDOCX from "html-to-docx";

export function getLastMonday(): Date {
  const today = new Date();
  const dayOfWeek = today.getDay();

  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek + 6;

  const lastMonday = new Date(today);
  lastMonday.setDate(today.getDate() - daysToSubtract);

  lastMonday.setHours(0, 0, 0, 0);

  return lastMonday;
}

export class EmailService {
  private templatesPath = path.join(__dirname, "..", "templates");
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      tls: { rejectUnauthorized: true },
    });
  }

  async renderTemplate(
    slug: string,
    data: any,
    inlineStyles: boolean = false
  ): Promise<string> {
    const template = await this.getTemplate(slug);

    try {
      let html = ejs.render(template.html, data);

      if (inlineStyles) {
        html = juice(html);
      }

      return html;
    } catch (error: any) {
      console.error(`Error rendering template ${slug}:`, error);
      throw new Error(`Failed to render template: ${error.message}`);
    }
  }

  async generatePDF(
    slug: string,
    data: any,
    outputPath?: string
  ): Promise<Buffer | string> {
    const html = await this.renderTemplate(slug, data);

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();

      await page.setContent(html, { waitUntil: "networkidle0" });

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

  async sendEmail(options: ISendEmailOptions): Promise<boolean> {
    try {
      const { template, data, to, subject, from, cc, bcc, attachments } =
        options;

      const html = await this.renderTemplate(template, data, true);

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

  async sendEmailWithPDF(
    options: ISendEmailOptions,
    pdfFilename: string
  ): Promise<boolean> {
    try {
      const { template, data } = options;

      const pdfBuffer = (await this.generatePDF(template, data)) as Buffer;

      const attachments = options.attachments || [];
      attachments.push({
        filename: pdfFilename,
        content: pdfBuffer,
        contentType: "application/pdf",
      });

      return this.sendEmail({
        ...options,
        attachments,
      });
    } catch (error) {
      console.error("Failed to send email with PDF:", error);
      return false;
    }
  }

  async sendInvoiceEmail(
    to: string,
    invoiceData: any,
    options: Partial<ISendEmailOptions> = {}
  ): Promise<boolean> {
    try {
      const invoiceNumber = invoiceData.invoiceNumber || "unknown";
      const pdfFilename = `Invoice-${invoiceNumber}.pdf`;

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

  async sendProductionReport(to: string): Promise<boolean> {
    const startDate = getLastMonday();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    const report = await machineDataService.getMachineOverview(
      startDate.toISOString(),
      endDate.toISOString()
    );

    const data = {
      startDate,
      endDate,
      utilization: 85,
      averageRuntime: 120,
      totalProduction: 1000,
      totalDowntime: 100,
      totalAlarms: 10,
      totalSetupChanges: 5,
      totalPartsProduced: 1000,
    };

    const subject = `Production Report - ${startDate.toISOString()} to ${endDate.toISOString()}`;

    const pdfBuffer = await this.generatePDF("production-report", data);

    return this.sendEmail({
      template: "production-report",
      to,
      data,
      subject,
      attachments: [
        {
          filename: "production-report.pdf",
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });
  }

  async sendQuoteEmail(
    to: string,
    quoteData: any,
    options: Partial<ISendEmailOptions> = {}
  ): Promise<boolean> {
    try {
      const quoteNumber = quoteData.quoteNumber || "unknown";

      // Read the template directly
      const templatePath = path.join(this.templatesPath, "quote-template.hbs");
      const templateContent = fs.readFileSync(templatePath, "utf-8");
      const compiled = handlebars.compile(templateContent);
      const html = compiled(quoteData);

      // Convert to DOCX with proper styling
      const docxBuffer = await HTMLtoDOCX(html, null, {
        table: { row: { cantSplit: true } },
        footer: true,
        pageNumber: true,
        margins: {
          top: 1440,
          right: 1440,
          bottom: 1440,
          left: 1440,
          header: 720,
          gutter: 0,
        },
      });

      return this.sendEmail({
        template: "quote-template",
        data: quoteData,
        to,
        subject: `Quote ${quoteNumber} from ${quoteData.companyName}`,
        ...options,
        attachments: [
          {
            filename: `Quote-${quoteNumber}.docx`,
            content: Buffer.from(docxBuffer as ArrayBuffer),
            contentType:
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          },
        ],
      });
    } catch (error) {
      console.error("Failed to send quote email:", error);
      return false;
    }
  }

  // Templates
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

  async getTemplate(slug: string): Promise<IEmailTemplate> {
    const templatePath = path.join(this.templatesPath, `${slug}.hbs`);

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

  // Sent email records
  async getSentEmails(params: IQueryParams<any>): Promise<any[]> {
    return [];
  }

  async createSentEmail(email: any): Promise<any> {
    return null;
  }

  async renderHandlebarsTemplate(slug: string, data: any): Promise<string> {
    const template = await this.getTemplate(slug);
    const templateContent = template.html;
    const compiled = handlebars.compile(templateContent);
    return compiled(data);
  }

  private async convertToDocx(html: string): Promise<Buffer> {
    try {
      const buffer = await HTMLtoDOCX(html, null, {
        table: { row: { cantSplit: true } },
        footer: true,
        pageNumber: true,
        margins: {
          top: 1440,
          right: 1440,
          bottom: 1440,
          left: 1440,
          header: 720,
          gutter: 0,
        },
      });

      return Buffer.from(buffer as ArrayBuffer);
    } catch (error) {
      console.error("Failed to convert HTML to DOCX:", error);
      throw error;
    }
  }
}
