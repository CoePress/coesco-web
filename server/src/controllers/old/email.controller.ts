import { emailService } from "@/services";
import { Request, Response, NextFunction } from "express";
import { ISendEmailOptions, IInvoiceData } from "@/types/schema.types";
import path from "path";
import fs from "fs";

export class EmailController {
  getTemplates = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const templates = await emailService.getTemplates();
      res.status(200).json({
        success: true,
        data: templates,
      });
    } catch (error) {
      next(error);
    }
  };

  getTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { slug } = req.params;
      const template = await emailService.getTemplate(slug);
      res.status(200).json({
        success: true,
        data: template,
      });
    } catch (error) {
      next(error);
    }
  };

  saveTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const template = await emailService.saveTemplate(req.body);
      res.status(201).json({
        success: true,
        data: template,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { slug } = req.params;
      const result = await emailService.deleteTemplate(slug);
      res.status(200).json({
        success: result,
        message: result
          ? "Template deleted successfully"
          : "Failed to delete template",
      });
    } catch (error) {
      next(error);
    }
  };

  previewTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { slug } = req.params;
      const { data } = req.body;

      const html = await emailService.renderTemplate(slug, data);

      res.setHeader("Content-Type", "text/html");
      res.send(html);
    } catch (error) {
      next(error);
    }
  };

  generatePDF = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { slug } = req.params;
      const { data, filename } = req.body;

      // Generate PDF as buffer
      const pdfBuffer = (await emailService.generatePDF(slug, data)) as Buffer;

      // Set headers for PDF download
      const downloadFilename = filename || `${slug}.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${downloadFilename}"`
      );
      res.setHeader("Content-Length", pdfBuffer.length);

      // Send the PDF buffer
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Send an email using a template
   */
  sendEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const options = req.body as ISendEmailOptions;
      const result = await emailService.sendEmail(options);

      res.status(200).json({
        success: result,
        message: result ? "Email sent successfully" : "Failed to send email",
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Send an email with PDF attachment
   */
  sendEmailWithPDF = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { options, pdfFilename } = req.body;
      const result = await emailService.sendEmailWithPDF(options, pdfFilename);

      res.status(200).json({
        success: result,
        message: result
          ? "Email with PDF sent successfully"
          : "Failed to send email with PDF",
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Send an invoice email
   */
  sendInvoiceEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { to, invoiceData, options } = req.body;

      if (!to || !invoiceData) {
        res.status(400).json({
          success: false,
          message: "Missing required parameters: to and invoiceData",
        });
        return;
      }

      const result = await emailService.sendInvoiceEmail(
        to,
        invoiceData,
        options
      );

      res.status(200).json({
        success: result,
        message: result
          ? "Invoice email sent successfully"
          : "Failed to send invoice email",
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Generate invoice PDF
   */
  generateInvoicePDF = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { invoiceData } = req.body;

      if (!invoiceData) {
        res.status(400).json({
          success: false,
          message: "Missing required parameter: invoiceData",
        });
        return;
      }

      // Generate filename
      const invoiceNumber = invoiceData.invoiceNumber || "unknown";
      const downloadFilename = `Invoice-${invoiceNumber}.pdf`;

      // Generate PDF as buffer
      const pdfBuffer = (await emailService.generatePDF(
        "invoice",
        invoiceData
      )) as Buffer;

      // Set headers for PDF download
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${downloadFilename}"`
      );
      res.setHeader("Content-Length", pdfBuffer.length);

      // Send the PDF buffer
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Store a sample invoice template (for development use)
   */
  setupInvoiceTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Read sample invoice template
      const templatePath = path.join(
        __dirname,
        "..",
        "assets",
        "invoice-template.ejs"
      );

      if (!fs.existsSync(templatePath)) {
        res.status(404).json({
          success: false,
          message: "Sample invoice template not found",
        });
        return;
      }

      const templateContent = fs.readFileSync(templatePath, "utf-8");

      // Save the template
      const template = await emailService.saveTemplate({
        slug: "invoice",
        name: "Invoice Template",
        description:
          "Template for sending invoice emails with dark mode support",
        subject: "Invoice from {companyName}",
        html: templateContent,
      });

      res.status(201).json({
        success: true,
        message: "Invoice template setup successfully",
        data: template,
      });
    } catch (error) {
      next(error);
    }
  };
}
