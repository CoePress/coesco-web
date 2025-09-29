import type { PrismaClient } from "@prisma/client";

interface FormTemplate {
  title: string;
  conditionalRules?: ConditionalRuleTemplate[];
  pages: PageTemplate[];
}

interface ConditionalRuleTemplate {
  name: string;
  targetType: "PAGE" | "SECTION" | "FIELD";
  targetSequence?: number;
  targetId?: string;
  action: "SHOW" | "HIDE" | "ENABLE" | "DISABLE" | "REQUIRE" | "OPTIONAL";
  conditions: ConditionTemplate[];
  operator: "AND" | "OR";
  priority: number;
}

interface ConditionTemplate {
  fieldVariable: string;
  operator: string;
  value: any;
}

interface PageTemplate {
  sequence: number;
  label: string;
  sections: SectionTemplate[];
}

interface SectionTemplate {
  sequence: number;
  label: string;
  fields: FieldTemplate[];
}

interface FieldTemplate {
  sequence: number;
  label: string;
  variable: string;
  dataType: string;
  controlType: string;
  isRequired: boolean;
  isReadOnly: boolean;
  isHiddenOnDevice: boolean;
  isHiddenOnReport: boolean;
  options?: any[];
}

export async function seedFormFromTemplate(
  prisma: PrismaClient,
  template: FormTemplate,
  createdById: string,
): Promise<string> {
  // Create the form
  const form = await prisma.form.create({
    data: {
      name: template.title,
      description: `Generated from template: ${template.title}`,
      status: "published",
      createdById,
      updatedById: createdById,
    },
  });

  // Create pages, sections, and fields
  const pageIdMap = new Map<number, string>();
  const fieldVariableMap = new Map<string, string>();

  for (const pageTemplate of template.pages) {
    const page = await prisma.formPage.create({
      data: {
        formId: form.id,
        title: pageTemplate.label,
        sequence: pageTemplate.sequence,
        createdById,
        updatedById: createdById,
      },
    });

    pageIdMap.set(pageTemplate.sequence, page.id);

    for (const sectionTemplate of pageTemplate.sections) {
      const section = await prisma.formSection.create({
        data: {
          pageId: page.id,
          title: sectionTemplate.label,
          sequence: sectionTemplate.sequence,
          createdById,
          updatedById: createdById,
        },
      });

      for (const fieldTemplate of sectionTemplate.fields) {
        const field = await prisma.formField.create({
          data: {
            sectionId: section.id,
            label: fieldTemplate.label,
            variable: fieldTemplate.variable,
            controlType: fieldTemplate.controlType as any,
            dataType: fieldTemplate.dataType as any,
            options: fieldTemplate.options || {},
            isRequired: fieldTemplate.isRequired,
            isReadOnly: fieldTemplate.isReadOnly,
            isHiddenOnDevice: fieldTemplate.isHiddenOnDevice,
            isHiddenOnReport: fieldTemplate.isHiddenOnReport,
            sequence: fieldTemplate.sequence,
            createdById,
            updatedById: createdById,
          },
        });

        fieldVariableMap.set(fieldTemplate.variable, field.id);
      }
    }
  }

  // Create conditional rules
  if (template.conditionalRules) {
    for (const ruleTemplate of template.conditionalRules) {
      let targetId: string;

      if (ruleTemplate.targetType === "PAGE" && ruleTemplate.targetSequence) {
        targetId = pageIdMap.get(ruleTemplate.targetSequence)!;
      }
      else if (ruleTemplate.targetId) {
        targetId = ruleTemplate.targetId;
      }
      else {
        continue; // Skip if we can't determine target
      }

      await prisma.formConditionalRule.create({
        data: {
          formId: form.id,
          name: ruleTemplate.name,
          targetType: ruleTemplate.targetType as any,
          targetId,
          action: ruleTemplate.action as any,
          conditions: ruleTemplate.conditions,
          operator: ruleTemplate.operator as any,
          priority: ruleTemplate.priority,
          createdById,
          updatedById: createdById,
        },
      });
    }
  }

  return form.id;
}

// Usage example:
// const template = JSON.parse(fs.readFileSync('service-tech-daily-with-rules.json', 'utf8'));
// await seedFormFromTemplate(prisma, template, 'user-id');
