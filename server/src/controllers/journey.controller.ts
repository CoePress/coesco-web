import { journeyService } from "@/services";
import { BaseController } from "./_";
import { Journey } from "@prisma/client";

export class JourneyController extends BaseController<Journey> {
  protected service = journeyService;
  protected entityName = "Journey";
}
