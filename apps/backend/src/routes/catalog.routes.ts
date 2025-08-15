import { Router } from "express";

const router = Router();

// Items
router.post("/items", () => { });
router.get("/items", () => { });
router.get("/items/:itemId", () => { });
router.patch("/items/:itemId", () => { });
router.delete("/items/:itemId", () => { });

// Product Classes
router.post("/product-classes", () => { });
router.get("/product-classes", () => { });
router.get("/product-classes/:productClassId", () => { });
router.patch("/product-classes/:productClassId", () => { });
router.delete("/product-classes/:productClassId", () => { });

// Option Categories
router.post("/option-categories", () => { });
router.get("/option-categories", () => { });
router.get("/option-categories/:categoryId", () => { });
router.patch("/option-categories/:categoryId", () => { });
router.delete("/option-categories/:categoryId", () => { });

// Product Class → Option Category mapping
router.post("/product-classes/:productClassId/option-categories", () => { });
router.get("/product-classes/:productClassId/option-categories", () => { });
router.patch("/product-classes/:productClassId/option-categories/:categoryId", () => { });
router.delete("/product-classes/:productClassId/option-categories/:categoryId", () => { });

// Options (Option Headers)
router.post("/options", () => { });
router.get("/options", () => { });
router.get("/options/:optionId", () => { });
router.patch("/options/:optionId", () => { });
router.delete("/options/:optionId", () => { });

// Product Class Options (Option Details)
router.post("/product-classes/:productClassId/options", () => { });
router.get("/product-classes/:productClassId/options", () => { });
router.get("/product-classes/:productClassId/options/:optionId", () => { });
router.patch("/product-classes/:productClassId/options/:optionId", () => { });
router.delete("/product-classes/:productClassId/options/:optionId", () => { });

// Option Rules
router.post("/option-rules", () => { });
router.get("/option-rules", () => { });
router.get("/option-rules/:ruleId", () => { });
router.patch("/option-rules/:ruleId", () => { });
router.delete("/option-rules/:ruleId", () => { });

// Option Rule Triggers
router.post("/option-rules/:ruleId/triggers", () => { });
router.get("/option-rules/:ruleId/triggers", () => { });
router.delete("/option-rules/:ruleId/triggers/:optionId", () => { });

// Option Rule Targets
router.post("/option-rules/:ruleId/targets", () => { });
router.get("/option-rules/:ruleId/targets", () => { });
router.delete("/option-rules/:ruleId/targets/:optionId", () => { });

// Configurations
router.post("/configurations", () => { });
router.get("/configurations", () => { });
router.get("/configurations/:configurationId", () => { });
router.patch("/configurations/:configurationId", () => { });
router.delete("/configurations/:configurationId", () => { });

// Configuration Selected Options
router.post("/configurations/:configurationId/options", () => { });
router.get("/configurations/:configurationId/options", () => { });
router.delete("/configurations/:configurationId/options/:optionId", () => { });

export default router;
