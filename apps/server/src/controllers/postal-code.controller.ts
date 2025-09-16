import type { NextFunction, Request, Response } from "express";

import { postalCodeService } from "@/services/repository";

export class PostalCodeController {
  async getCoordinatesByPostalCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { countryCode, postalCode } = req.params;
      const result = await postalCodeService.getCoordinatesByPostalCode(countryCode, postalCode);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async searchPostalCodes(req: Request, res: Response, next: NextFunction) {
    try {
      const { countryCode, postalCode, limit } = req.query;
      const result = await postalCodeService.searchPostalCodes({
        countryCode: countryCode as string,
        postalCode: postalCode as string,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }
}