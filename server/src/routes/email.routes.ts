import { emailController } from "@/controllers";
import { Router } from "express";

const router = Router();

// Template management
router.get("/templates", emailController.getTemplates);
router.get("/templates/:slug", emailController.getTemplate);
router.post("/templates", emailController.saveTemplate);
router.delete("/templates/:slug", emailController.deleteTemplate);

// Template rendering and preview
router.post("/templates/:slug/preview", emailController.previewTemplate);
router.post("/templates/:slug/pdf", emailController.generatePDF);

// Email sending
router.post("/send", emailController.sendEmail);
router.post("/send-with-pdf", emailController.sendEmailWithPDF);

// Invoice-specific endpoints
router.post("/invoice/send", emailController.sendInvoiceEmail);
router.post("/invoice/pdf", emailController.generateInvoicePDF);

// Development helpers
router.post("/setup-invoice-template", emailController.setupInvoiceTemplate);

export default router;
