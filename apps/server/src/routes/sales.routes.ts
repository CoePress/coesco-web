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
router.get("/quotes/:quoteId", quoteController.getQuote);
router.patch("/quotes/:quoteId", quoteController.updateQuote);
router.delete("/quotes/:quoteId", quoteController.deleteQuote);

// Revisions
router.post("/quotes/:quoteId/revisions", quoteController.createRevision);
router.get("/quotes/:quoteId/revisions", quoteController.getRevisions);
router.get("/quotes/:quoteId/revisions/:revisionId", quoteController.getRevision);
router.patch("/quotes/:quoteId/revisions/:revisionId", quoteController.updateRevision);
router.delete("/quotes/:quoteId/revisions/:revisionId", quoteController.deleteRevision);

// Actions
router.post("/quotes/:quoteId/approve", quoteController.approveQuote);
router.post("/quotes/:quoteId/revise", quoteController.reviseQuote);
router.post("/quotes/:quoteId/accept", quoteController.acceptQuote);
router.post("/quotes/:quoteId/reject", quoteController.rejectQuote);
router.post("/quotes/:quoteId/send", quoteController.sendQuote);
router.get("/quotes/:quoteId/export/pdf", quoteController.exportPDF);

export default router