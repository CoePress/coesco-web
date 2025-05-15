import { IEmailTemplate, ISendEmailOptions } from "@/types/schema.types";
import { IEmailService } from "@/types/service.types";
import path from "path";
import fs from "fs";

export class EmailService implements IEmailService {
  private templatesPath = path.join(__dirname, "..", "templates", "emails");

  async getTemplates(): Promise<any[]> {
    const templates = fs.readdirSync(this.templatesPath);
    return templates.map((template) => {
      // TODO: get name, description & subject from the template file
      return {
        slug: template.replace(".html", ""),
        name: template.replace(".html", ""),
      };
    });
  }

  async getTemplate(slug: string): Promise<IEmailTemplate> {
    const templatePath = path.join(this.templatesPath, `${slug}.html`);

    if (!fs.existsSync(templatePath)) {
      throw new Error("Template not found");
    }

    const template = fs.readFileSync(templatePath, "utf-8");

    // TODO: get name, description & subject from the template file
    return {
      slug,
      name: slug,
      html: template,
      subject: "",
    };
  }

  async saveTemplate(template: IEmailTemplate): Promise<IEmailTemplate> {
    return {} as IEmailTemplate;
  }

  async deleteTemplate(slug: string): Promise<boolean> {
    return false;
  }

  async sendEmail(options: ISendEmailOptions): Promise<boolean> {
    return false;
  }
}
