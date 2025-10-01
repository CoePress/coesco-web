/* eslint-disable no-console */

import { getDMMF } from "@prisma/sdk";
import fs from "node:fs";
import path from "node:path";

async function getRelationships(models: any) {
  const modelNames = new Set(models.map((m: any) => m.name));
  const relationships: any[] = [];

  models.forEach((model: any) => {
    model.fields.forEach((field: any) => {
      if (field.name.endsWith("Id")) {
        const targetName = field.name.slice(0, -2);
        const guessedTarget = [...modelNames].find(
          (name: any) => name.toLowerCase() === targetName.toLowerCase(),
        );
        if (guessedTarget) {
          relationships.push({
            model: model.name,
            field: field.name,
            target: guessedTarget,
          });
        }
      }
    });
  });

  return relationships;
}

export async function getModels() {
  const schemaPath = path.resolve(__dirname, "../../prisma/schema.prisma");

  if (!fs.existsSync(schemaPath)) {
    throw new Error(`schema.prisma not found at: ${schemaPath}`);
  }

  const datamodel = fs.readFileSync(schemaPath, "utf-8");
  const dmmf = await getDMMF({ datamodel });

  // Manually parse annotations from schema file
  const models = dmmf.datamodel.models.map((model: any) => {
    const annotations = extractAnnotationsFromSchema(datamodel, model.name);
    return { ...model, customAnnotations: annotations };
  });

  return models;
}

function extractAnnotationsFromSchema(schemaContent: string, modelName: string) {
  const modelRegex = new RegExp(`model\\s+${modelName}\\s*\\{[\\s\\S]*?\\n\\}`, "m");
  const modelMatch = schemaContent.match(modelRegex);

  if (!modelMatch)
    return null;

  const modelBlock = modelMatch[0];
  const lines = modelBlock.split("\n");

  // Find all /// comments within the model block
  const comments = lines
    .filter(line => line.trim().startsWith("///"))
    .map(line => line.trim().substring(3).trim())
    .join(" ");

  return comments || null;
}

export async function getEnums() {
  const schemaPath = path.resolve(__dirname, "../../prisma/schema.prisma");

  if (!fs.existsSync(schemaPath)) {
    throw new Error(`schema.prisma not found at: ${schemaPath}`);
  }

  const datamodel = fs.readFileSync(schemaPath, "utf-8");
  const dmmf = await getDMMF({ datamodel });
  return dmmf.datamodel.enums;
}

function parseAnnotations(model: any) {
  const annotations: any = {};

  // Use custom annotations from manual parsing, fallback to documentation
  const docSource = model.customAnnotations || model.documentation || "";

  if (docSource) {
    // Parse @transform
    const transformMatch = docSource.match(/@transform\(([^)]+)\)/);
    if (transformMatch) {
      const transforms = transformMatch[1].split(",").map((t: string) => t.trim());
      annotations.transforms = {};
      transforms.forEach((transform: string) => {
        const colonIndex = transform.indexOf(":");
        if (colonIndex > 0) {
          const name = transform.substring(0, colonIndex).trim();
          const sql = transform.substring(colonIndex + 1).trim();
          annotations.transforms[name] = sql;
        }
      });
    }

    // Parse @searchFields
    const searchFieldsMatch = docSource.match(/@searchFields\(([^)]+)\)/);
    if (searchFieldsMatch) {
      const fields = searchFieldsMatch[1].split(",").map((f: string) => f.trim());
      annotations.searchFields = fields.map((field: string) => {
        const [name, weight] = field.split(":").map((s: string) => s.trim());
        return { field: name, weight: Number.parseInt(weight, 10) };
      });
    }

    // Parse @sortFields
    const sortFieldsMatch = docSource.match(/@sortFields\(([^)]+)\)/);
    if (sortFieldsMatch) {
      const fields = sortFieldsMatch[1].split(",").map((f: string) => f.trim());
      annotations.sortFields = {};
      fields.forEach((field: string) => {
        const match = field.match(/(\w+):\s*\[([^\]]+)\]/);
        if (match) {
          const [, name, fieldsStr] = match;
          annotations.sortFields[name] = fieldsStr.split(",").map((s: string) => s.trim());
        }
      });
    }
  }

  return annotations;
}

async function generateValidations(model: any) {
  const lines: string[] = [];

  model.fields.forEach((field: any) => {
    if (
      field.kind === "scalar"
      && field.isRequired
      && !field.isId
      && field.name !== "createdAt"
      && field.name !== "updatedAt"
    ) {
      lines.push(
        `if (!entity.${field.name}) throw new BadRequestError("${field.name} is required");`,
      );
    }
  });

  return lines.map(line => `\t\t${line}`).join("\n");
}

async function generateSearchFields(model: any) {
  const annotations = parseAnnotations(model);

  if (!annotations.searchFields || annotations.searchFields.length === 0) {
    return "";
  }

  const fields = annotations.searchFields
    .map((sf: any) => `{ field: "${sf.field}", weight: ${sf.weight} }`)
    .join(", ");

  return `\tprotected getSearchFields(): (string | { field: string; weight: number })[] {
\t\treturn [${fields}];
\t}
`;
}

async function generateTransforms(model: any) {
  const annotations = parseAnnotations(model);

  if (!annotations.transforms || Object.keys(annotations.transforms).length === 0) {
    return "";
  }

  const entries = Object.entries(annotations.transforms)
    .map(([name, sql]: [string, any]) => `\t\t${name}: "${sql}"`)
    .join(",\n");

  return `\tprotected getTransforms(): Record<string, string> {
\t\treturn {
${entries}
\t\t};
\t}
`;
}

async function generateTransformSort(model: any) {
  const annotations = parseAnnotations(model);

  if (!annotations.sortFields || Object.keys(annotations.sortFields).length === 0) {
    return "";
  }

  const cases = Object.entries(annotations.sortFields)
    .map(([name, fields]: [string, any]) => {
      const orderByFields = fields
        .map((field: string) => `{ ${field}: order || "asc" }`)
        .join(", ");
      return `\t\tif (sort === "${name}") {
\t\t\treturn [${orderByFields}];
\t\t}`;
    })
    .join("\n");

  return `\tprotected transformSort(sort?: string, order?: "asc" | "desc"): any {
${cases}
\t\treturn super.transformSort(sort, order);
\t}
`;
}

function getTimestampComment(): string {
  return `// This file was generated by generate-services.ts`;
}

function extractCommentAndBody(content: string) {
  const lines = content.split("\n");
  if (
    lines[0]?.startsWith(
      "// This file was generated by generate-services.ts",
    )
  ) {
    return {
      comment: lines[0],
      body: lines.slice(1).join("\n").trim(),
    };
  }
  return {
    comment: null,
    body: content.trim(),
  };
}

function toKebabCase(str: string) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

async function generateServiceFiles(models: any, relationships: any) {
  const directory = path.resolve(__dirname, "../services/repository");
  fs.mkdirSync(directory, { recursive: true });

  for (const model of models) {
    const kebabName = toKebabCase(model.name);
    const serviceFile = path.resolve(directory, `${kebabName}.service.ts`);
    const validations = await generateValidations(model);
    const transforms = await generateTransforms(model);
    const searchFields = await generateSearchFields(model);
    const transformSort = await generateTransformSort(model);

    const methods = [transforms, transformSort, searchFields].filter(m => m).join("\n");

    const newBody = `import { ${model.name} } from "@prisma/client";
import { BaseService } from "./_base.service";
import { prisma } from "@/utils/prisma";
import { BadRequestError } from "@/middleware/error.middleware";

type ${model.name}Attributes = Omit<${model.name}, "id" | "createdAt" | "updatedAt">;

export class ${model.name}Service extends BaseService<${model.name}> {
\tprotected model = prisma.${model.name.charAt(0).toLowerCase() + model.name.slice(1)};
\tprotected entityName = "${model.name}";
\tprotected modelName = "${model.name.charAt(0).toLowerCase() + model.name.slice(1)}";

\tprotected async validate(entity: ${model.name}Attributes): Promise<void> {
${validations}
\t}

${methods}}`.trim();

    if (fs.existsSync(serviceFile)) {
      const existing = fs.readFileSync(serviceFile, "utf-8");
      const { body } = extractCommentAndBody(existing);

      if (body === newBody) {
        console.log(`No changes: ${model.name}`);
        continue;
      }
    }

    const fullContent = `${getTimestampComment()}\n${newBody}`;
    fs.writeFileSync(serviceFile, fullContent);
    console.log(
      `${fs.existsSync(serviceFile) ? "Updated" : "Created"}: ${model.name}`,
    );

    relationships
      .filter((r: any) => r.model === model.name)
      .forEach((r: any) => console.log(r));
  }
}

async function generateIndexFile(models: any) {
  const directory = path.resolve(__dirname, "../services/repository");
  const indexFile = path.resolve(directory, "index.ts");

  const imports: string[] = [];
  const exports: string[] = [];
  const instances: string[] = [];

  models
    .sort((a: any, b: any) => a.name.localeCompare(b.name))
    .forEach((model: any) => {
      const kebabName = toKebabCase(model.name);
      const modelNameLower
        = model.name.charAt(0).toLowerCase() + model.name.slice(1);

      imports.push(
        `import { ${model.name}Service } from "./${kebabName}.service";`,
      );
      exports.push(`export { ${model.name}Service };`);
      instances.push(
        `export const ${modelNameLower}Service = new ${model.name}Service();`,
      );
    });

  const newBody = `${imports.join("\n")}

${exports.join("\n")}

${instances.join("\n")}`.trim();

  let existingBody = null;
  if (fs.existsSync(indexFile)) {
    const existing = fs.readFileSync(indexFile, "utf-8");
    const { body } = extractCommentAndBody(existing);
    existingBody = body;
    if (existingBody === newBody) {
      console.log("No changes to index file");
      return;
    }
  }

  const fullContent = `${getTimestampComment()}\n${newBody}`;
  fs.writeFileSync(indexFile, fullContent);
  console.log("Updated index file");
}

async function updateMCPConfig(models: any) {
  const mcpConfigFile = path.resolve(__dirname, "../config/mcp-config.ts");

  if (!fs.existsSync(mcpConfigFile)) {
    console.log("MCP config file does not exist, skipping update");
    return;
  }

  const serviceImports: string[] = [];
  const serviceMapEntries: string[] = [];
  const schemaEntries: string[] = [];

  models
    .sort((a: any, b: any) => a.name.localeCompare(b.name))
    .forEach((model: any) => {
      const kebabName = toKebabCase(model.name);
      const modelNameLower = model.name.charAt(0).toLowerCase() + model.name.slice(1);

      serviceImports.push(`  ${modelNameLower}Service,`);
      serviceMapEntries.push(`  "${kebabName}": ${modelNameLower}Service,`);

      const fields = model.fields.reduce((acc: any, field: any) => {
        if (field.kind === "scalar" || field.kind === "enum") {
          acc[field.name] = {
            type: field.type.toLowerCase(),
            required: field.isRequired,
            ...(field.isList && { isList: true }),
            ...(field.hasDefaultValue && { hasDefault: true }),
          };
        }
        return acc;
      }, {});

      const schemaString = JSON.stringify(fields, null, 2)
        .split("\n")
        .map((line, i) => i === 0 ? line : `    ${line}`)
        .join("\n");

      schemaEntries.push(`  { 
    name: "${kebabName}", 
    description: "Schema for ${model.name} entity",
    schema: ${schemaString}
  },`);
    });

  let content = fs.readFileSync(mcpConfigFile, "utf-8");

  const newImport = `import {
${serviceImports.join("\n")}
} from "../services/repository";`;

  content = content.replace(
    /import\s*\{[\s\S]*?\}\s*from\s*"\.\.\/services\/repository";/,
    newImport,
  );

  const newServiceMap = `const serviceMap: Record<string, any> = {
${serviceMapEntries.join("\n")}
};`;

  content = content.replace(
    /const serviceMap: Record<string, any> = \{[\s\S]*?\};/,
    newServiceMap,
  );

  const newSchemas = `export const SCHEMAS: ISchema[] = [
${schemaEntries.join("\n")}
];`;

  content = content.replace(
    /export const SCHEMAS: ISchema\[\] = \[[\s\S]*?\];/,
    newSchemas,
  );

  fs.writeFileSync(mcpConfigFile, content);
  console.log("Updated MCP config service map and schemas");
}

async function generateSharedTypes(models: any) {
  const packagesDir = path.resolve(__dirname, "../../../../packages/types");
  const srcDir = path.resolve(packagesDir, "src");

  fs.mkdirSync(srcDir, { recursive: true });

  const modelExports: string[] = [];

  // Generate enums first
  const enums = await getEnums();
  for (const enumDef of enums) {
    const kebabName = toKebabCase(enumDef.name);
    const enumFile = path.resolve(srcDir, `${kebabName}.ts`);

    const enumValues = enumDef.values.map((value: any) => `  ${value.name} = "${value.name}",`).join("\n");

    const enumContent = `// Auto-generated from Prisma schema
export enum ${enumDef.name} {
${enumValues}
}
`;

    fs.writeFileSync(enumFile, enumContent);
    modelExports.push(`export * from './${kebabName}';`);
    console.log(`Generated enum: ${enumDef.name}`);
  }

  for (const model of models) {
    const kebabName = toKebabCase(model.name);
    const typeFile = path.resolve(srcDir, `${kebabName}.ts`);

    const fields: string[] = [];
    const enumImports: Set<string> = new Set();

    model.fields.forEach((field: any) => {
      let fieldType = "";

      switch (field.type) {
        case "String":
          fieldType = "string";
          break;
        case "Int":
        case "Float":
        case "BigInt":
        case "Decimal":
          fieldType = "number";
          break;
        case "Boolean":
          fieldType = "boolean";
          break;
        case "DateTime":
          fieldType = "Date | string";
          break;
        case "Json":
          fieldType = "any";
          break;
        default:
          if (field.kind === "enum") {
            fieldType = field.type;
            enumImports.add(field.type);
          }
          else if (field.kind === "object") {
            fieldType = field.type;
            if (field.isList) {
              fieldType = `${fieldType}[]`;
            }
          }
          else {
            fieldType = "any";
          }
      }

      if (field.isList && field.kind === "scalar") {
        fieldType = `${fieldType}[]`;
      }

      const optional = !field.isRequired || field.hasDefaultValue ? "?" : "";
      const fieldName = field.name;

      if (field.kind === "scalar" || field.kind === "enum") {
        fields.push(`  ${fieldName}${optional}: ${fieldType};`);
      }
    });

    const importStatements = Array.from(enumImports)
      .map(enumName => `import { ${enumName} } from './${toKebabCase(enumName)}';`)
      .join("\n");

    const typeContent = `// Auto-generated from Prisma schema
${importStatements ? `${importStatements}\n\n` : ""}export interface ${model.name} {
${fields.join("\n")}
}

export type Create${model.name}Input = Omit<${model.name}, "id" | "createdAt" | "updatedAt">;
export type Update${model.name}Input = Partial<Create${model.name}Input>;
`;

    fs.writeFileSync(typeFile, typeContent);
    modelExports.push(`export * from './${kebabName}';`);
    console.log(`Generated type: ${model.name}`);
  }

  // Generate auto-generated index
  const autoGenIndexFile = path.resolve(srcDir, "_auto-generated.ts");
  fs.writeFileSync(autoGenIndexFile, `// Auto-generated database types - DO NOT EDIT\n${modelExports.join("\n")}\n`);

  // Update main index file to export from both auto-generated and custom
  const indexFile = path.resolve(srcDir, "index.ts");
  const indexContent = `// Main types index
// This file exports both auto-generated types and custom types

// Auto-generated types from Prisma schema
export * from './_auto-generated';

// Custom static types (add your custom type exports below)
export * from './custom';
`;

  // Only create index.ts if it doesn't exist, to avoid overwriting custom exports
  if (!fs.existsSync(indexFile)) {
    fs.writeFileSync(indexFile, indexContent);
    console.log("Created main index file");
  }
}

async function main() {
  const models = await getModels();
  const relationships = await getRelationships(models);
  await generateServiceFiles(models, relationships);
  await generateIndexFile(models);
  await updateMCPConfig(models);
  await generateSharedTypes(models);
}

main();
