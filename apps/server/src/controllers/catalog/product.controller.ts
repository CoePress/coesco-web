import type { Item, ProductClass } from "@prisma/client";
import type { Request, Response } from "express";

import { z } from "zod";

import { productService } from "@/services";
import { asyncWrapper, buildQueryParams } from "@/utils";
import { HTTP_STATUS } from "@/utils/constants";

const CreateItemSchema = z.object({
  productClassId: z.string().uuid("Invalid product class ID").optional(),
  modelNumber: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  legacy: z.record(z.any()).optional(),
});

const UpdateItemSchema = CreateItemSchema.partial();

const CreateProductClassSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  parentId: z.string().uuid("Invalid parent ID").optional(),
  legacy: z.record(z.any()).optional(),
});

const UpdateProductClassSchema = CreateProductClassSchema.partial();

export class ProductController {
  createItem = asyncWrapper(async (req: Request, res: Response) => {
    const validData = CreateItemSchema.parse(req.body);
    const result = await productService.createItem(validData);
    res.status(HTTP_STATUS.CREATED).json(result);
  });

  getItems = asyncWrapper(async (req: Request, res: Response) => {
    const params = buildQueryParams<Item>(req.query);
    const result = await productService.getAllItems(params);
    res.status(HTTP_STATUS.OK).json(result);
  });

  getItem = asyncWrapper(async (req: Request, res: Response) => {
    const result = await productService.getItemById(req.params.itemId);
    res.status(HTTP_STATUS.OK).json(result);
  });

  updateItem = asyncWrapper(async (req: Request, res: Response) => {
    const validData = UpdateItemSchema.parse(req.body);
    const result = await productService.updateItem(req.params.itemId, validData);
    res.status(HTTP_STATUS.OK).json(result);
  });

  deleteItem = asyncWrapper(async (req: Request, res: Response) => {
    await productService.deleteItem(req.params.itemId);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  });

  createProductClass = asyncWrapper(async (req: Request, res: Response) => {
    const validData = CreateProductClassSchema.parse(req.body);
    const result = await productService.createProductClass(validData);
    res.status(HTTP_STATUS.CREATED).json(result);
  });

  getProductClasses = asyncWrapper(async (req: Request, res: Response) => {
    const params = buildQueryParams<ProductClass>(req.query);
    const result = await productService.getAllProductClasses(params);
    res.status(HTTP_STATUS.OK).json(result);
  });

  getProductClass = asyncWrapper(async (req: Request, res: Response) => {
    const result = await productService.getProductClassById(req.params.productClassId);
    res.status(HTTP_STATUS.OK).json(result);
  });

  updateProductClass = asyncWrapper(async (req: Request, res: Response) => {
    const validData = UpdateProductClassSchema.parse(req.body);
    const result = await productService.updateProductClass(req.params.productClassId, validData);
    res.status(HTTP_STATUS.OK).json(result);
  });

  deleteProductClass = asyncWrapper(async (req: Request, res: Response) => {
    await productService.deleteProductClass(req.params.productClassId);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  });
}
