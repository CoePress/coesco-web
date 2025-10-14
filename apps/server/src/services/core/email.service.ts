import type { Transporter } from "nodemailer";

import { EmailStatus } from "@prisma/client";
import ejs from "ejs";
import path from "node:path";
import nodemailer from "nodemailer";

import { env } from "@/config/env";
import { emailLogService } from "@/services";

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
    const { data: log } = await emailLogService.createEmailLog({
      to: options.to,
      subject: options.subject,
      status: EmailStatus.PENDING,
    });

    try {
      const mailOptions = {
        from: options.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const result = await this.transporter.sendMail(mailOptions);

      await emailLogService.updateEmailLog(log.id, {
        status: EmailStatus.SENT,
        sentAt: new Date(),
      });

      return { success: true, messageId: result.messageId };
    }
    catch (error) {
      await emailLogService.updateEmailLog(log.id, {
        status: EmailStatus.FAILED,
        error: (error as Error).message,
      });

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

  async sendPasswordReset(options: {
    to: string;
    resetToken: string;
    firstName: string;
  }): Promise<EmailResult> {
    const { to, resetToken, firstName } = options;
    const resetUrl = `${env.CLIENT_URL}/settings/reset-password?token=${resetToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #e8a80c; padding-bottom: 10px;">Password Reset Request</h2>

        <div style="margin: 20px 0;">
          <p>Hi ${firstName},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
        </div>

        <div style="margin: 30px 0; text-align: center;">
          <a href="${resetUrl}" style="background-color: #e8a80c; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
            Reset Password
          </a>
        </div>

        <div style="margin: 20px 0;">
          <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px; font-size: 12px;">${resetUrl}</p>
        </div>

        <div style="margin: 30px 0; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
          <p style="margin: 0; color: #856404; font-size: 14px;">
            <strong>Security Notice:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
          </p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
          <p>Email sent on ${new Date().toLocaleString()}</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      from: "noreply@cpec.com",
      to,
      subject: "Password Reset Request - Coe Press Equipment",
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
