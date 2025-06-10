import * as fs from "fs";
import * as path from "path";

// Read the schema file
const schemaPath = path.join(__dirname, "../../prisma/schema.prisma");
const schemaContent = fs.readFileSync(schemaPath, "utf-8");

// First pass - collect all model names
const allModelNames = new Set<string>();
const modelRegex = /model\s+(\w+)\s+{/g;
let match;

while ((match = modelRegex.exec(schemaContent)) !== null) {
  allModelNames.add(match[1]);
}

console.log("Found models:", Array.from(allModelNames));

// Second pass - collect fields
const models: {
  name: string;
  fields: {
    name: string;
    type: string;
    isOptional: boolean;
    isForeignKey?: boolean;
    relatedService?: string;
  }[];
}[] = [];

// Reset regex
modelRegex.lastIndex = 0;

while ((match = modelRegex.exec(schemaContent)) !== null) {
  const modelName = match[1];
  const modelStart = match.index;
  const modelEnd = schemaContent.indexOf("}", modelStart);
  const modelContent = schemaContent.slice(modelStart, modelEnd);

  console.log(`\nProcessing model: ${modelName}`);
  console.log("Model content:", modelContent);

  const fields: {
    name: string;
    type: string;
    isOptional: boolean;
    isForeignKey?: boolean;
    relatedService?: string;
  }[] = [];

  // Split content into lines and process each line
  const lines = modelContent.split("\n");
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (
      trimmedLine &&
      !trimmedLine.startsWith("model") &&
      !trimmedLine.startsWith("@@")
    ) {
      // Extract field name and type
      const fieldMatch = trimmedLine.match(/^\s*(\w+)\s+(\w+)(\[\])?(\?)?/);
      if (fieldMatch) {
        const fieldName = fieldMatch[1];
        const fieldType = fieldMatch[2];
        const isArray = !!fieldMatch[3];
        const isOptional = !!fieldMatch[4];
        const isRelation = trimmedLine.includes("@relation");

        console.log(
          `Found field: ${fieldName} (${fieldType}) - Optional: ${isOptional}, Array: ${isArray}, Relation: ${isRelation}`
        );

        if (
          !["id", "createdAt", "updatedAt", "createdBy", "updatedBy"].includes(
            fieldName
          ) &&
          !isRelation &&
          !isArray
        ) {
          // Check if this is a foreign key field
          const isForeignKey = fieldName.endsWith("Id");
          let relatedService: string | undefined;

          if (isForeignKey) {
            // Remove 'Id' and capitalize first letter
            const relatedModel =
              fieldName.slice(0, -2).charAt(0).toUpperCase() +
              fieldName.slice(0, -2).slice(1);
            if (allModelNames.has(relatedModel)) {
              relatedService = relatedModel;
              console.log(`Found foreign key: ${fieldName} -> ${relatedModel}`);
            }
          }

          fields.push({
            name: fieldName,
            type: fieldType,
            isOptional,
            isForeignKey,
            relatedService,
          });
        }
      }
    }
  }

  console.log(`Fields for ${modelName}:`, fields);
  models.push({ name: modelName, fields });
}

// Convert PascalCase to kebab-case for filenames
function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

// Convert PascalCase to camelCase for Prisma model names
function toCamelCase(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

// Create sample directory if it doesn't exist
const sampleDir = path.join(__dirname, "../services/repository");
if (!fs.existsSync(sampleDir)) {
  fs.mkdirSync(sampleDir, { recursive: true });
}

// Clean up existing files except _.ts
if (fs.existsSync(sampleDir)) {
  const files = fs.readdirSync(sampleDir);
  for (const file of files) {
    if (file !== "_.ts") {
      fs.unlinkSync(path.join(sampleDir, file));
    }
  }
}

// Generate service files
models.forEach(({ name: model, fields }) => {
  const fileName = `${toKebabCase(model)}.service.ts`;
  const filePath = path.join(sampleDir, fileName);
  const camelCaseModel = toCamelCase(model);

  // Generate validation code for required fields
  const requiredFields = fields.filter((f) => !f.isOptional);
  const validationCode = requiredFields
    .map((f) => {
      if (f.isForeignKey && f.relatedService) {
        const serviceName = toCamelCase(f.relatedService);
        return `    if (!data.${f.name}) {
      throw new BadRequestError("${f.name} is required");
    }

    const ${serviceName} = await ${serviceName}Service.getById(data.${f.name});
    if (!${serviceName}.success || !${serviceName}.data) {
      throw new BadRequestError("${f.relatedService} not found");
    }`;
      }
      return `    if (!data.${f.name}) {
      throw new BadRequestError("${f.name} is required");
    }`;
    })
    .join("\n\n");

  const serviceContent = `import { ${model} } from "@prisma/client";
import { prisma } from "@/utils/prisma";
import { BaseService } from "../repository/_";
import { BadRequestError } from "@/middleware/error.middleware";
${fields
  .filter((f) => f.isForeignKey && f.relatedService)
  .map((f) => `import { ${toCamelCase(f.relatedService!)}Service } from '.';`)
  .join("\n")}

type ${model}Attributes = Omit<${model}, "id" | "createdAt" | "updatedAt">;

export class ${model}Service extends BaseService<${model}> {
  protected model = prisma.${camelCaseModel};
  protected entityName = "${model}";
  protected modelName = "${camelCaseModel}";

  protected getOrganizationFilter(organizationId: string) {
    return { organizationId };
  }

  protected async validate(data: ${model}Attributes): Promise<void> {
${validationCode}
  }
}
`;

  fs.writeFileSync(filePath, serviceContent);
  console.log(`Created ${fileName}`);
});

// Generate index.ts
const indexContent = models
  .map((model) => {
    const camelCaseModel = toCamelCase(model.name);
    return `import { ${model.name}Service } from './${toKebabCase(
      model.name
    )}.service';\nexport const ${camelCaseModel}Service = new ${
      model.name
    }Service();`;
  })
  .join("\n\n");

fs.writeFileSync(path.join(sampleDir, "index.ts"), indexContent);
console.log("Created index.ts");
