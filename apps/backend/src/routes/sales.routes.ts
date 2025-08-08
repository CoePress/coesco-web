import { Router } from "express";

const router = Router();

// Companies
router.post("/companies", () => { });
router.get("/companies", () => { });
router.get("/companies/:companyId", () => { });
router.patch("/companies/:companyId", () => { });
router.delete("/companies/:companyId", () => { });

// Addresses
router.post("/companies/:companyId/addresses", () => { });
router.get("/companies/:companyId/addresses", () => { });
router.get("/addresses", () => { });
router.get("/addresses/:addressId", () => { });
router.patch("/addresses/:addressId", () => { });
router.delete("/addresses/:addressId", () => { });

// Contacts
router.post("/companies/:companyId/contacts", () => { });
router.get("/companies/:companyId/contacts", () => { });
router.get("/contacts", () => { });
router.get("/contacts/:contactId", () => { });
router.patch("/contacts/:contactId", () => { });
router.delete("/contacts/:contactId", () => { });

// Quotes
router.post("/companies/:companyId/quotes", () => { });
router.get("/companies/:companyId/quotes", () => { });
router.get("/quotes", () => { });
router.get("/quotes/:quoteId", () => { });
router.patch("/quotes/:quoteId", () => { });
router.delete("/quotes/:quoteId", () => { });

export default router;
