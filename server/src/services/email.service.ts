import { IEmailTemplate, ISendEmailOptions } from "@/types/schema.types";
import { IEmailService } from "@/types/service.types";

export class EmailService implements IEmailService {
  // returns metadata for the templates
  async getTemplates(): Promise<IEmailTemplate[]> {
    return [];
  }

  async getTemplate(id: string): Promise<IEmailTemplate> {
    return {} as IEmailTemplate;
  }

  async saveTemplate(template: IEmailTemplate): Promise<IEmailTemplate> {
    return {} as IEmailTemplate;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    return false;
  }

  async sendEmail(options: ISendEmailOptions): Promise<boolean> {
    return false;
  }
}
