/* eslint-disable no-console */
import fs from "node:fs";
import path from "node:path";

const schemaDir = path.resolve(__dirname, "../../prisma/schema");

const files = fs.readdirSync(schemaDir)
  .filter(f => f.endsWith(".prisma"))
  .sort((a, b) => {
    if (a === "schema.prisma")
      return -1;
    if (b === "schema.prisma")
      return 1;
    return a.localeCompare(b);
  });

const merged = files
  .map(file => fs.readFileSync(path.join(schemaDir, file), "utf8"))
  .join("\n");

const outputPath = path.resolve(__dirname, "../../prisma/_merged-schema.prisma");
fs.writeFileSync(outputPath, merged);

console.log(`✅ Merged schema written to ${outputPath}`);
