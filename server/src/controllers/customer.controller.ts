import { customerService } from "@/services";
import { BaseController } from "./_";
import { Customer } from "@prisma/client";

export class CustomerController extends BaseController<Customer> {
  protected service = customerService;
  protected entityName = "Customer";
}
