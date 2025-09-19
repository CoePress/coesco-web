import { Router } from "express";

import { postalCodeController } from "@/controllers";

const router = Router();

// Get coordinates by postal code
router.get("/coordinates/:countryCode/:postalCode", postalCodeController.getCoordinatesByPostalCode);

// Search postal codes
router.get("/search", postalCodeController.searchPostalCodes);

export default router;
