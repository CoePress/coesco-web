import { ICustomer } from "@/types/schema.types";
import { customerService } from "@/services";
import { BaseController } from "./_";

export class CustomerController extends BaseController<ICustomer> {
  protected service = customerService;
  protected entityName = "Customer";
}
