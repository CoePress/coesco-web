import { Router } from "express";

import { crmController } from "@/controllers";

const router = Router();

// Companies
router.post("/companies", crmController.createCompany);
router.get("/companies", crmController.getCompanies);
router.get("/companies/:id", crmController.getCompany);
router.patch("/companies/:id", crmController.updateCompany);
router.delete("/companies/:id", crmController.deleteCompany);

// Addresses
router.post("/addresses", crmController.createAddress);
router.get("/addresses", crmController.getAddresses);
router.get("/addresses/:id", crmController.getAddress);
router.patch("/addresses/:id", crmController.updateAddress);
router.delete("/addresses/:id", crmController.deleteAddress);

// Contacts
router.post("/contacts", crmController.createContact);
router.get("/contacts", crmController.getContacts);
router.get("/contacts/:id", crmController.getContact);
router.patch("/contacts/:id", crmController.updateContact);
router.delete("/contacts/:id", crmController.deleteContact);

// Journeys
router.post("/journeys", crmController.createJourney);
router.get("/journeys", crmController.getJourneys);
router.get("/journeys/:id", crmController.getJourney);
router.patch("/journeys/:id", crmController.updateJourney);
router.delete("/journeys/:id", crmController.deleteJourney);

export default router;
