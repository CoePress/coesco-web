import fs from "node:fs";
import swaggerAutogen from "swagger-autogen";

import { logger } from "./logger";

const doc = {
  info: {
    title: "Coesco API",
    description: "Description",
  },
  host: "localhost:8080",
  tags: [
    { name: "Admin", description: "" },
    { name: "Auth", description: "" },
    { name: "Catalog", description: "" },
    { name: "Chat", description: "" },
    { name: "CRM", description: "" },
    { name: "Legacy", description: "" },
    { name: "Production", description: "" },
    { name: "Performance", description: "" },
    { name: "Quotes", description: "" },
    { name: "System", description: "" },
  ],
};

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
    });
  });

  fs.writeFileSync(outputFile, JSON.stringify(swaggerDoc, null, 2));
  logger.info("Swagger tags added successfully!");
});
