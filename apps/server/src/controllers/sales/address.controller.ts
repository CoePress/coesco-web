import type { NextFunction, Request, Response } from "express";

export class AdressController {
  async getCoordinatesByPostalCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { countryCode, postalCode } = req.params;
      const result = await locationService.getCoordinatesByPostalCode(countryCode, postalCode);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async searchPostalCodes(req: Request, res: Response, next: NextFunction) {
    try {
      const { countryCode, postalCode, limit } = req.query;
      const result = await locationService.searchPostalCodes({
        countryCode: countryCode as string,
        postalCode: postalCode as string,
        limit: limit ? Number.parseInt(limit as string) : undefined,
      });
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }
}
