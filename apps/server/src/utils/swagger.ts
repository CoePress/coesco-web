import fs from "node:fs";
import swaggerAutogen from "swagger-autogen";

import { logger } from "./logger";

const doc = {
  info: {
    title: "Coesco API",
    description: "Description",
  },
  host: "localhost:8080/api",
  tags: [
    { name: "Admin", description: "" },
    { name: "Auth", description: "" },
    { name: "Catalog", description: "" },
    { name: "Chat", description: "" },
    { name: "CRM", description: "" },
    { name: "Employees", description: "" },
    { name: "Legacy", description: "" },
    { name: "Production", description: "" },
    { name: "Performance", description: "" },
    { name: "Quotes", description: "" },
    { name: "System", description: "" },
  ],
};

const commonQueryParams = [
  { name: "page", in: "query", type: "integer", description: "Page number (default: 1)" },
  { name: "limit", in: "query", type: "integer", description: "Items per page" },
  { name: "search", in: "query", type: "string", description: "Search term" },
  { name: "filter", in: "query", type: "string", description: "JSON filter object" },
  { name: "sort", in: "query", type: "string", description: "Sort field (default: createdAt)" },
  { name: "order", in: "query", type: "string", description: "Sort order (default: desc)", enum: ["asc", "desc"] },
  { name: "dateFrom", in: "query", type: "string", description: "Filter from date (ISO format)" },
  { name: "dateTo", in: "query", type: "string", description: "Filter to date (ISO format)" },
  { name: "select", in: "query", type: "string", description: "JSON array of fields to select" },
  { name: "fields", in: "query", type: "array", items: { type: "string" }, description: "Array of fields to select" },
  { name: "include", in: "query", type: "string", description: "JSON array of relations to include" },
];

const outputFile = "./src/config/swagger-output.json";
const routes = ["./src/routes/index.ts"];

swaggerAutogen()(outputFile, routes, doc).then(() => {
  const swaggerDoc = JSON.parse(fs.readFileSync(outputFile, "utf8"));

  Object.keys(swaggerDoc.paths).forEach((path) => {
    Object.keys(swaggerDoc.paths[path]).forEach((method) => {
      if (path.startsWith("/admin/")) {
        swaggerDoc.paths[path][method].tags = ["Admin"];
      }
      else if (path.startsWith("/auth/")) {
        swaggerDoc.paths[path][method].tags = ["Auth"];
      }
      else if (path.startsWith("/catalog/")) {
        swaggerDoc.paths[path][method].tags = ["Catalog"];
      }
      else if (path.startsWith("/chat/")) {
        swaggerDoc.paths[path][method].tags = ["Chat"];
      }
      else if (path.startsWith("/crm/")) {
        swaggerDoc.paths[path][method].tags = ["CRM"];
      }
      else if (path.startsWith("/employees/")) {
        swaggerDoc.paths[path][method].tags = ["Employees"];
      }
      else if (path.startsWith("/legacy/")) {
        swaggerDoc.paths[path][method].tags = ["Legacy"];
      }
      else if (path.startsWith("/production/")) {
        swaggerDoc.paths[path][method].tags = ["Production"];
      }
      else if (path.startsWith("/performance/")) {
        swaggerDoc.paths[path][method].tags = ["Performance"];
      }
      else if (path.startsWith("/quotes/")) {
        swaggerDoc.paths[path][method].tags = ["Quotes"];
      }
      else if (path.startsWith("/system/")) {
        swaggerDoc.paths[path][method].tags = ["System"];
      }

      if (method === "get" && !path.includes("{")) {
        swaggerDoc.paths[path][method].parameters = [
          ...(swaggerDoc.paths[path][method].parameters || []),
          ...commonQueryParams,
        ];
      }
    });
  });

  fs.writeFileSync(outputFile, JSON.stringify(swaggerDoc, null, 2));
  logger.info("Swagger tags added successfully!");
});
