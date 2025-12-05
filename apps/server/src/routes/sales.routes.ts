import type { JourneyContact } from "@prisma/client";

import { Router } from "express";

import { performanceController, quoteController } from "@/controllers";
import { createCrudEntity } from "@/factories";
import {
  addressRepository,
  companyRelationshipRepository,
  companyRepository,
  contactRepository,
  journeyRepository,
} from "@/repositories";
import {
  CreateAddressSchema,
  CreateCompanyRelationshipSchema,
  CreateCompanySchema,
  CreateContactSchema,
  CreateJourneyContactSchema,
  UpdateAddressSchema,
  UpdateCompanyRelationshipSchema,
  UpdateCompanySchema,
  UpdateContactSchema,
  UpdateJourneyContactSchema,
} from "@/schemas";
import { journeyContactService } from "@/services";
import { asyncWrapper, buildQueryParams } from "@/utils";
import { HTTP_STATUS } from "@/utils/constants";

const router = Router();

// Journeys - using CRUD factory
createCrudEntity(router, {
  repository: journeyRepository,
  entityName: "Journey",
  basePath: "/journeys",
  idParam: "journeyId",
});

// Companies - using CRUD factory with validation
createCrudEntity(router, {
  repository: companyRepository,
  entityName: "Company",
  basePath: "/companies",
  idParam: "companyId",
  createSchema: CreateCompanySchema,
  updateSchema: UpdateCompanySchema,
});

// Addresses - using CRUD factory with validation
createCrudEntity(router, {
  repository: addressRepository,
  entityName: "Address",
  basePath: "/addresses",
  idParam: "addressId",
  createSchema: CreateAddressSchema,
  updateSchema: UpdateAddressSchema,
});

// Contacts - using CRUD factory with validation and default include
createCrudEntity(router, {
  repository: contactRepository,
  entityName: "Contact",
  basePath: "/contacts",
  idParam: "contactId",
  createSchema: CreateContactSchema,
  updateSchema: UpdateContactSchema,
  defaultInclude: { image: true },
});

// Company Relationships - using CRUD factory with validation
createCrudEntity(router, {
  repository: companyRelationshipRepository,
  entityName: "CompanyRelationship",
  basePath: "/company-relationships",
  idParam: "relationshipId",
  createSchema: CreateCompanyRelationshipSchema,
  updateSchema: UpdateCompanyRelationshipSchema,
});

// Journey Contacts - has business logic (primary contact handling)
router.post("/journey-contacts", asyncWrapper(async (req, res) => {
  const validData = CreateJourneyContactSchema.parse(req.body);
  const result = await journeyContactService.createJourneyContact(validData);
  res.status(HTTP_STATUS.CREATED).json(result);
}));
router.get("/journey-contacts", asyncWrapper(async (req, res) => {
  const params = buildQueryParams<JourneyContact>(req.query);
  const result = await journeyContactService.getAllJourneyContacts(params);
  res.status(HTTP_STATUS.OK).json(result);
}));
router.get("/journey-contacts/:journeyContactId", asyncWrapper(async (req, res) => {
  const result = await journeyContactService.getJourneyContactById(req.params.journeyContactId);
  res.status(HTTP_STATUS.OK).json(result);
}));
router.patch("/journey-contacts/:journeyContactId", asyncWrapper(async (req, res) => {
  const validData = UpdateJourneyContactSchema.parse(req.body);
  const result = await journeyContactService.updateJourneyContact(req.params.journeyContactId, validData);
  res.status(HTTP_STATUS.OK).json(result);
}));
router.delete("/journey-contacts/:journeyContactId", asyncWrapper(async (req, res) => {
  await journeyContactService.deleteJourneyContact(req.params.journeyContactId);
  res.status(HTTP_STATUS.NO_CONTENT).send();
}));

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
