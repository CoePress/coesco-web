import type { Transporter } from "nodemailer";

import { EmailStatus } from "@prisma/client";
import ejs from "ejs";
import nodemailer from "nodemailer";

import { EmailService } from "../email.service";

jest.mock("nodemailer");
jest.mock("ejs");
const mockEmailLogService = {
  createEmailLog: jest.fn(),
  updateEmailLog: jest.fn(),
};

jest.mock("@/services", () => ({
  emailLogService: mockEmailLogService,
}));

const emailLogService = mockEmailLogService;

describe("emailService", () => {
  let emailService: EmailService;
  let mockTransporter: jest.Mocked<Transporter>;

  beforeEach(() => {
    mockTransporter = {
      sendMail: jest.fn(),
    } as any;

    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

    emailService = new EmailService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create nodemailer transporter with correct config", () => {
      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: expect.any(String),
          port: expect.any(Number),
          secure: expect.any(Boolean),
        }),
      );
    });
  });

  describe("sendEmail", () => {
    const emailOptions = {
      to: "test@example.com",
      from: "sender@example.com",
      subject: "Test Subject",
      html: "<p>Test HTML</p>",
      text: "Test text",
    };

    beforeEach(() => {
      emailLogService.createEmailLog.mockResolvedValue({
        data: { id: 1 },
      });
      emailLogService.updateEmailLog.mockResolvedValue({});
    });

    it("should send email successfully", async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: "msg-123" });

      const result = await emailService.sendEmail(emailOptions);

      expect(emailLogService.createEmailLog).toHaveBeenCalledWith({
        to: emailOptions.to,
        subject: emailOptions.subject,
        status: EmailStatus.PENDING,
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: emailOptions.from,
        to: emailOptions.to,
        subject: emailOptions.subject,
        html: emailOptions.html,
        text: emailOptions.text,
      });

      expect(emailLogService.updateEmailLog).toHaveBeenCalledWith(1, {
        status: EmailStatus.SENT,
        sentAt: expect.any(Date),
      });

      expect(result).toEqual({ success: true, messageId: "msg-123" });
    });

    it("should update log to FAILED and throw error when sendMail fails", async () => {
      const error = new Error("SMTP connection failed");
      mockTransporter.sendMail.mockRejectedValue(error);

      await expect(emailService.sendEmail(emailOptions)).rejects.toThrow(
        "Failed to send email: SMTP connection failed",
      );

      expect(emailLogService.updateEmailLog).toHaveBeenCalledWith(1, {
        status: EmailStatus.FAILED,
        error: "SMTP connection failed",
      });
    });
  });

  describe("sendTemplateEmail", () => {
    const templateOptions = {
      to: "test@example.com",
      from: "sender@example.com",
      subject: "Template Test",
      templateName: "test-template",
      variables: { name: "John" },
    };

    beforeEach(() => {
      emailLogService.createEmailLog.mockResolvedValue({
        data: { id: 1 },
      });
      emailLogService.updateEmailLog.mockResolvedValue({});
    });

    it("should send template email successfully", async () => {
      const renderedHtml = "<p>Hello John</p>";
      (ejs.renderFile as jest.Mock).mockResolvedValue(renderedHtml);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "msg-456" });

      const result = await emailService.sendTemplateEmail(templateOptions);

      expect(ejs.renderFile).toHaveBeenCalledWith(
        expect.stringContaining("test-template.ejs"),
        templateOptions.variables,
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: renderedHtml,
        }),
      );

      expect(result).toEqual({ success: true, messageId: "msg-456" });
    });

    it("should throw error when template fails to load", async () => {
      (ejs.renderFile as jest.Mock).mockRejectedValue(new Error("Template not found"));

      await expect(emailService.sendTemplateEmail(templateOptions)).rejects.toThrow(
        "Failed to send template email",
      );
    });

    it("should throw error when template renders but send fails", async () => {
      (ejs.renderFile as jest.Mock).mockResolvedValue("<p>HTML</p>");
      mockTransporter.sendMail.mockRejectedValue(new Error("Send failed"));

      await expect(emailService.sendTemplateEmail(templateOptions)).rejects.toThrow(
        "Failed to send template email",
      );
    });
  });

  describe("sendProductionReport", () => {
    beforeEach(() => {
      emailLogService.createEmailLog.mockResolvedValue({
        data: { id: 1 },
      });
      emailLogService.updateEmailLog.mockResolvedValue({});
      (ejs.renderFile as jest.Mock).mockResolvedValue("<p>Production Report</p>");
      mockTransporter.sendMail.mockResolvedValue({ messageId: "msg-789" });
    });

    it("should send production report with correct data", async () => {
      const result = await emailService.sendProductionReport("manager@example.com");

      expect(ejs.renderFile).toHaveBeenCalledWith(
        expect.stringContaining("production.ejs"),
        expect.objectContaining({
          week: expect.any(String),
          machineUptime: expect.any(String),
          productionOrders: expect.any(Array),
          criticalIssues: expect.any(Array),
        }),
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "manager@example.com",
          from: "production@cpec.com",
          subject: "Weekly Production Overview Report - Coe Press Equipment",
        }),
      );

      expect(result).toEqual({ success: true, messageId: "msg-789" });
    });
  });

  describe("sendPasswordReset", () => {
    const resetOptions = {
      to: "user@example.com",
      resetToken: "reset-token-123",
      firstName: "Jane",
    };

    beforeEach(() => {
      emailLogService.createEmailLog.mockResolvedValue({
        data: { id: 1 },
      });
      emailLogService.updateEmailLog.mockResolvedValue({});
      mockTransporter.sendMail.mockResolvedValue({ messageId: "msg-reset" });
    });

    it("should send password reset email with correct content", async () => {
      const result = await emailService.sendPasswordReset(resetOptions);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: resetOptions.to,
          from: "noreply@cpec.com",
          subject: "Password Reset Request - Coe Press Equipment",
          html: expect.stringContaining(resetOptions.firstName),
        }),
      );

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain(resetOptions.resetToken);
      expect(callArgs.html).toContain("Reset Password");

      expect(result).toEqual({ success: true, messageId: "msg-reset" });
    });

    it("should include reset URL in email", async () => {
      await emailService.sendPasswordReset(resetOptions);

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain(`token=${resetOptions.resetToken}`);
    });

    it("should handle sendMail failure", async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error("SMTP error"));

      await expect(emailService.sendPasswordReset(resetOptions)).rejects.toThrow(
        "Failed to send email",
      );

      expect(emailLogService.updateEmailLog).toHaveBeenCalledWith(1, {
        status: EmailStatus.FAILED,
        error: "SMTP error",
      });
    });
  });
});
