import { Router } from "express";

import { crmController } from "@/controllers";

const router = Router();

// Companies
router.post("/companies", crmController.createCompany);
router.get("/companies", crmController.getCompanies);
router.get("/companies/:companyId", crmController.getCompany);
router.patch("/companies/:companyId", crmController.updateCompany);
router.delete("/companies/:companyId", crmController.deleteCompany);

// Addresses
router.post("/addresses", crmController.createAddress);
router.get("/addresses", crmController.getAddresses);
router.get("/addresses/:addressId", crmController.getAddress);
router.patch("/addresses/:addressId", crmController.updateAddress);
router.delete("/addresses/:addressId", crmController.deleteAddress);

// Contacts
router.post("/contacts", crmController.createContact);
router.get("/contacts", crmController.getContacts);
router.get("/contacts/:contactId", crmController.getContact);
router.patch("/contacts/:contactId", crmController.updateContact);
router.delete("/contacts/:contactId", crmController.deleteContact);

// Journeys
router.post("/journeys", crmController.createJourney);
router.get("/journeys", crmController.getJourneys);
router.get("/journeys/:journeyId", crmController.getJourney);
router.patch("/journeys/:journeyId", crmController.updateJourney);
router.delete("/journeys/:journeyId", crmController.deleteJourney);

export default router;
