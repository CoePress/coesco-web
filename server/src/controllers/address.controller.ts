import { Address } from "@prisma/client";
import { addressService } from "@/services";
import { BaseController } from "./_";

export class AddressController extends BaseController<Address> {
  protected service = addressService;
  protected entityName = "Address";
}
