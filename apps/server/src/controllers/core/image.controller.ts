import type { NextFunction, Request, Response } from "express";

import { imageService } from "@/services";

export class ImageController {
  async uploadImages(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file && (!req.files || (req.files as Express.Multer.File[]).length === 0)) {
        return res.status(400).json({ error: "No image files provided" });
      }

      if (req.file) {
        const result = await imageService.uploadImage(req.file);
        return res.status(200).json(result);
      }

      if (req.files) {
        const result = await imageService.uploadImages(req.files as Express.Multer.File[]);
        return res.status(200).json(result);
      }
    }
    catch (error) {
      next(error);
    }
  }

  async getAllImages(req: Request, res: Response, next: NextFunction) {
    try {
      const images = await imageService.getAllImages();
      res.status(200).json(images);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteImage(req: Request, res: Response, next: NextFunction) {
    try {
      const imageId = Number.parseInt(req.params.id);
      if (Number.isNaN(imageId)) {
        return res.status(400).json({ error: "Invalid image ID" });
      }

      await imageService.deleteImage(imageId);
      res.status(200).json({ message: "Image deleted successfully" });
    }
    catch (error) {
      next(error);
    }
  }
}
