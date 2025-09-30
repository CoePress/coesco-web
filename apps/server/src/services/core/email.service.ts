import type { Transporter } from "nodemailer";

import ejs from "ejs";
import path from "node:path";
import nodemailer from "nodemailer";

import { env } from "@/config/env";

interface EmailOptions {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

interface TemplateEmailOptions {
  to: string;
  from: string;
  subject: string;
  templateName: string;
  variables?: Record<string, any>;
}

interface EmailResult {
  success: boolean;
  messageId: string;
}

export class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
    } as nodemailer.TransportOptions);
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      const mailOptions = {
        from: options.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    }
    catch (error) {
      throw new Error(`Failed to send email: ${(error as Error).message}`);
    }
  }

  async sendTemplateEmail(options: TemplateEmailOptions): Promise<EmailResult> {
    try {
      const html = await this.loadTemplate(options.templateName, options.variables);

      return this.sendEmail({
        from: options.from,
        to: options.to,
        subject: options.subject,
        html,
      });
    }
    catch (error) {
      throw new Error(`Failed to send template email: ${(error as Error).message}`);
    }
  }

  async sendProductionReport(to: string): Promise<EmailResult> {
    const mockData = {
      week: "Week 48, 2024",
      dateRange: "Nov 25 - Dec 1, 2024",
      machineUptime: "97.8%",
      firstPassYield: "98.5%",
      toolLifeEfficiency: "94%",
      activeSetups: 22,
      partsMachined: 5280,
      machineHours: 348,
      toolChanges: 3,
      completedJobs: 12,
      productionOrders: [
        {
          jobNumber: "J-2024-112",
          partName: "Main Drive Shaft",
          machine: "CNC-05",
          status: "running",
          statusText: "Running",
          progress: "82%",
          dueDate: "Dec 5, 2024",
        },
        {
          jobNumber: "J-2024-113",
          partName: "Bearing Housing",
          machine: "CNC-03",
          status: "completed",
          statusText: "Completed",
          progress: "100%",
          dueDate: "Nov 30, 2024",
        },
        {
          jobNumber: "J-2024-114",
          partName: "Gear Assembly",
          machine: "CNC-07",
          status: "delayed",
          statusText: "Tool Change",
          progress: "55%",
          dueDate: "Dec 8, 2024",
        },
        {
          jobNumber: "J-2024-115",
          partName: "Hydraulic Block",
          machine: "CNC-02",
          status: "blocked",
          statusText: "Maintenance",
          progress: "40%",
          dueDate: "Dec 10, 2024",
        },
      ],
      criticalIssues: [
        "Tool Life Alert: Face mill #FM-7823 approaching replacement threshold on CNC-05",
        "Machine Maintenance: CNC-09 requires unscheduled bearing replacement",
        "Material Alert: Steel 4140 stock critically low for upcoming orders",
      ],
    };

    return this.sendTemplateEmail({
      to,
      from: "production@cpec.com",
      subject: "Weekly Production Overview Report - Coe Press Equipment",
      templateName: "production",
      variables: mockData,
    });
  }

  async sendBugReport(options: {
    title: string;
    description: string;
    userEmail?: string;
    screenshot?: string;
    url?: string;
    userAgent?: string;
  }): Promise<EmailResult> {
    const { title, description, userEmail, screenshot, url, userAgent } = options;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #333; padding-bottom: 10px;">Bug Report</h2>

        <div style="margin: 20px 0;">
          <h3 style="color: #333; margin-bottom: 5px;">Title</h3>
          <p style="margin: 0; padding: 10px; background: #f5f5f5; border-radius: 4px;">${title}</p>
        </div>

        <div style="margin: 20px 0;">
          <h3 style="color: #333; margin-bottom: 5px;">Description</h3>
          <p style="margin: 0; padding: 10px; background: #f5f5f5; border-radius: 4px; white-space: pre-wrap;">${description}</p>
        </div>

        ${userEmail ? `
        <div style="margin: 20px 0;">
          <h3 style="color: #333; margin-bottom: 5px;">Reported By</h3>
          <p style="margin: 0; padding: 10px; background: #f5f5f5; border-radius: 4px;">${userEmail}</p>
        </div>
        ` : ''}

        ${url ? `
        <div style="margin: 20px 0;">
          <h3 style="color: #333; margin-bottom: 5px;">Page URL</h3>
          <p style="margin: 0; padding: 10px; background: #f5f5f5; border-radius: 4px; word-break: break-all;">${url}</p>
        </div>
        ` : ''}

        ${userAgent ? `
        <div style="margin: 20px 0;">
          <h3 style="color: #333; margin-bottom: 5px;">Browser</h3>
          <p style="margin: 0; padding: 10px; background: #f5f5f5; border-radius: 4px; font-size: 12px;">${userAgent}</p>
        </div>
        ` : ''}

        ${screenshot ? `
        <div style="margin: 20px 0;">
          <h3 style="color: #333; margin-bottom: 5px;">Screenshot</h3>
          <img src="${screenshot}" alt="Bug Screenshot" style="max-width: 100%; border: 1px solid #ddd; border-radius: 4px;" />
        </div>
        ` : ''}

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
          <p>Report submitted on ${new Date().toLocaleString()}</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      from: "noreply@cpec.com",
      to: "jar@cpec.com",
      subject: `Bug Report: ${title}`,
      html,
    });
  }

  private async loadTemplate(templateName: string, variables: Record<string, any> = {}): Promise<string> {
    try {
      const templatePath = path.join(__dirname, "..", "..", "templates", `${templateName}.ejs`);
      const html = await ejs.renderFile(templatePath, variables);
      return html;
    }
    catch (error) {
      throw new Error(`Template ${templateName} not found or failed to render: ${(error as Error).message}`);
    }
  }
}
