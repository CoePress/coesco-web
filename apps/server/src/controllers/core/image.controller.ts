import type { Request, Response } from "express";

import { imageService } from "@/services";
import { asyncWrapper } from "@/utils";
import { HTTP_STATUS } from "@/utils/constants";

export class ImageController {
  uploadImages = asyncWrapper(async (req: Request, res: Response) => {
    if (!req.file && (!req.files || (req.files as Express.Multer.File[]).length === 0)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "No image files provided" });
    }

    if (req.file) {
      const result = await imageService.uploadImage(req.file);
      return res.status(HTTP_STATUS.OK).json(result);
    }

    if (req.files) {
      const result = await imageService.uploadImages(req.files as Express.Multer.File[]);
      return res.status(HTTP_STATUS.OK).json(result);
    }
  });

  getAllImages = asyncWrapper(async (_req: Request, res: Response) => {
    const images = await imageService.getAllImages();
    res.status(HTTP_STATUS.OK).json(images);
  });

  deleteImage = asyncWrapper(async (req: Request, res: Response) => {
    const imageId = Number.parseInt(req.params.id);
    if (Number.isNaN(imageId)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "Invalid image ID" });
    }

    await imageService.deleteImage(imageId);
    res.status(HTTP_STATUS.OK).json({ message: "Image deleted successfully" });
  });
}
