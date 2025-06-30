import { companyService, salesService } from "@/services";
import { BaseController } from "./_base.controller";
import { Company } from "@prisma/client";
import { NextFunction, Request, Response } from "express";

export class CompanyController extends BaseController<Company> {
  protected service = companyService;
  protected entityName = "Company";

  public async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await salesService.getCompanyOverview(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
