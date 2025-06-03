import { emailController } from "@/controllers";
import { emailService } from "@/services";
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

router.post("/quote/send", async (req, res) => {
  try {
    const quoteData = {
      quoteNumber: "Q-2024-001",
      companyName: "CPEC Industries",
      companyAddress: "123 Industrial Way, Manufacturing City, MC 12345",
      companyPhone: "(555) 123-4567",
      companyEmail: "sales@cpec.com",
      customer: {
        name: "Acme Manufacturing",
        address: "456 Production Ave, Factory Town, FT 67890",
        phone: "(555) 987-6543",
        email: "jar@cpec.com",
      },
      items: [
        {
          name: "Enterprise Core Platform",
          description: "Core platform license for up to 500 users",
          quantity: 1,
          unitPrice: 250000,
          total: 250000,
        },
        {
          name: "Advanced Analytics Module",
          description:
            "Business intelligence and advanced reporting capabilities",
          quantity: 1,
          unitPrice: 75000,
          total: 75000,
        },
        {
          name: "Premium Support Package",
          description: "24/7 priority support with 2-hour response time",
          quantity: 1,
          unitPrice: 50000,
          total: 50000,
        },
      ],
      subtotal: 375000,
      taxRate: 8.5,
      tax: 31875,
      total: 406875,
      terms:
        "Payment due within 30 days. All prices in USD. Valid for 90 days from quote date.",
    };

    const result = await emailService.sendQuoteEmail("jar@cpec.com", quoteData);
    res.json({ success: result });
  } catch (error) {
    console.error("Failed to send quote:", error);
    res.status(500).json({ error: "Failed to send quote" });
  }
});

export default router;
