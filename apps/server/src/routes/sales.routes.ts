import { Router } from "express";

import { customerController, journeyController, performanceController, quoteController } from "@/controllers";

const router = Router();

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

// Journey Contacts
router.post("/journey-contacts", customerController.createJourneyContact);
router.get("/journey-contacts", customerController.getJourneyContacts);
router.get("/journey-contacts/:journeyContactId", customerController.getJourneyContact);
router.patch("/journey-contacts/:journeyContactId", customerController.updateJourneyContact);
router.delete("/journey-contacts/:journeyContactId", customerController.deleteJourneyContact);

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

// Quote Items
router.post("/quotes/:quoteId/items", quoteController.createQuoteItem);
router.patch("/quotes/items/:itemId", quoteController.updateQuoteItem);
router.patch("/quotes/items/:itemId/line-number", quoteController.updateQuoteItemLineNumber);
router.delete("/quotes/items/:itemId", quoteController.deleteQuoteItem);

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

// Performance Versions
router.post("/performance-versions", performanceController.createPerformanceSheetVersion);
router.get("/performance-versions", performanceController.getPerformanceSheetVersions);
router.get("/performance-versions/:versionId", performanceController.getPerformanceSheetVersion);
router.patch("/performance-versions/:versionId", performanceController.updatePerformanceSheetVersion);
router.delete("/performance-versions/:versionId", performanceController.deletePerformanceSheetVersion);

// Performance Sheets
router.post("/performance-sheets", performanceController.createPerformanceSheet);
router.get("/performance-sheets", performanceController.getPerformanceSheets);
router.get("/performance-sheets/:sheetId", performanceController.getPerformanceSheet);
router.patch("/performance-sheets/:sheetId", performanceController.updatePerformanceSheet);
router.delete("/performance-sheets/:sheetId", performanceController.deletePerformanceSheet);

// Performance Links
router.post("/performance-links", performanceController.createPerformanceSheetLink);
router.get("/performance-links", performanceController.getPerformanceSheetLinks);
router.get("/performance-links/:linkId", performanceController.getPerformanceSheetLink);
router.patch("/performance-links/:linkId", performanceController.updatePerformanceSheetLink);
router.delete("/performance-links/:linkId", performanceController.deletePerformanceSheetLink);

export default router;
