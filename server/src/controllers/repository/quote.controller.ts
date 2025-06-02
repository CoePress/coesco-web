import { Quote } from "@prisma/client";
import { quoteService } from "@/services";
import { BaseController } from "./_";

export class QuoteController extends BaseController<Quote> {
  protected service = quoteService;
  protected entityName = "Quote";
}
