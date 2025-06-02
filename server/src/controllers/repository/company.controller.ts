import { companyService } from "@/services";
import { BaseController } from "./_";
import { Company } from "@prisma/client";

export class CompanyController extends BaseController<Company> {
  protected service = companyService;
  protected entityName = "Company";
}
