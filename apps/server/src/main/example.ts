import { GenericService } from "./_generic";
import { contextStorage, SYSTEM_CONTEXT } from "./context";
import { prisma } from "@/utils/prisma";
import { Machine } from "@prisma/client";

export class ExampleService extends GenericService<Machine> {
  constructor() {
    super();
    contextStorage.enterWith(SYSTEM_CONTEXT);
    this.model = prisma.machine;
    this.modelName = "machine";
  }
}
