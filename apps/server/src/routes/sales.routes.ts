import { customerController, journeyController, quoteController } from "@/controllers";
import { Router } from "express";

const router = Router()

// Companies
router.post("/companies", customerController.createCompany);
router.get("/companies", customerController.getCompanies);
router.get("/companies/:companyId", customerController.getCompany);
router.patch("/companies/:companyId", customerController.updateCompany);
router.delete("/companies/:companyId", customerController.deleteCompany);

// Addresses
router.post("/addresses", customerController.createAddress);
router.get("/addresses", customerController.getAddresses);
router.get("/addresses/:addressId", customerController.getAddress);
router.patch("/addresses/:addressId", customerController.updateAddress);
router.delete("/addresses/:addressId", customerController.deleteAddress);

// Contacts
router.post("/contacts", customerController.createContact);
router.get("/contacts", customerController.getContacts);
router.get("/contacts/:contactId", customerController.getContact);
router.patch("/contacts/:contactId", customerController.updateContact);
router.delete("/contacts/:contactId", customerController.deleteContact);

// Journeys
router.post("/journeys", journeyController.createJourney);
router.get("/journeys", journeyController.getJourneys);
router.get("/journeys/:journeyId", journeyController.getJourney);
router.patch("/journeys/:journeyId", journeyController.updateJourney);
router.delete("/journeys/:journeyId", journeyController.deleteJourney);

// Metrics
router.get("/quotes/metrics", quoteController.getMetrics);

// Quotes
router.post("/quotes/", quoteController.createQuote);
router.get("/quotes/", quoteController.getQuotes);
router.get("/quotes/:id", quoteController.getQuote);
router.patch("/quotes/:id", quoteController.updateQuote);
router.delete("/quotes/:id", quoteController.deleteQuote);

// Revisions
router.post("/quotes/:id/revisions", quoteController.createRevision);
router.get("/quotes/:id/revisions", quoteController.getRevisions);
router.get("/quotes/:id/revisions/:revisionId", quoteController.getRevision);

// Actions
router.post("/quotes/:id/approve", quoteController.approveQuote);
router.post("/quotes/:id/revise", quoteController.reviseQuote);
router.post("/quotes/:id/accept", quoteController.acceptQuote);
router.post("/quotes/:id/reject", quoteController.rejectQuote);
router.post("/quotes/:id/send", quoteController.sendQuote);
router.get("/quotes/:id/export/pdf", quoteController.exportPDF);

export default router