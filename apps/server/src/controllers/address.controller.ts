import { Address } from "@prisma/client";
import { addressService } from "@/services";
import { BaseController } from "./_base.controller";

export class AddressController extends BaseController<Address> {
  protected service = addressService;
  protected entityName = "Address";
}
