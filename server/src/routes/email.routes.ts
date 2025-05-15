import { emailController } from "@/controllers";
import { Router } from "express";

const router = Router();

router.get("/templates", emailController.getTemplates);
router.get("/templates/:slug", emailController.getTemplate);
router.post("/templates", emailController.saveTemplate);
router.delete("/templates/:slug", emailController.deleteTemplate);

router.post("/templates/:slug/preview", emailController.previewTemplate);
router.post("/templates/:slug/pdf", emailController.generatePDF);

router.post("/send", emailController.sendEmail);
router.post("/send-with-pdf", emailController.sendEmailWithPDF);

router.post("/invoice/send", emailController.sendInvoiceEmail);
router.post("/invoice/pdf", emailController.generateInvoicePDF);

router.post("/setup-invoice-template", emailController.setupInvoiceTemplate);

export default router;
