import fetch from "node-fetch";

import { FileStoreService } from "../services/core/file-store.service";

interface SampleFile {
  url: string;
  name: string;
  category: string;
  tags: string[];
}

const sampleFiles: SampleFile[] = [
  // PDFs
  {
    url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    name: "Sample Document.pdf",
    category: "documents",
    tags: ["pdf", "sample", "document"],
  },
  {
    url: "https://www.africau.edu/images/default/sample.pdf",
    name: "Project Proposal.pdf",
    category: "documents",
    tags: ["pdf", "project", "proposal"],
  },

  // Images
  {
    url: "https://picsum.photos/800/600",
    name: "Landscape Photo.jpg",
    category: "images",
    tags: ["image", "photo", "landscape"],
  },
  {
    url: "https://picsum.photos/600/800",
    name: "Portrait Photo.jpg",
    category: "images",
    tags: ["image", "photo", "portrait"],
  },
  {
    url: "https://picsum.photos/1200/800",
    name: "Banner Image.jpg",
    category: "images",
    tags: ["image", "banner", "header"],
  },
  {
    url: "https://via.placeholder.com/400x400/FF5733/FFFFFF?text=Design+Mockup",
    name: "Design Mockup.png",
    category: "images",
    tags: ["image", "design", "mockup"],
  },
  {
    url: "https://via.placeholder.com/300x300/3498DB/FFFFFF?text=Logo",
    name: "Company Logo.png",
    category: "images",
    tags: ["image", "logo", "branding"],
  },

  // JSON files
  {
    url: "https://jsonplaceholder.typicode.com/posts/1",
    name: "API Response Sample.json",
    category: "data",
    tags: ["json", "api", "data"],
  },
  {
    url: "https://jsonplaceholder.typicode.com/users",
    name: "User Data Export.json",
    category: "data",
    tags: ["json", "users", "export"],
  },

  // Text/Markdown
  {
    url: "https://raw.githubusercontent.com/microsoft/TypeScript/main/README.md",
    name: "TypeScript Documentation.md",
    category: "documents",
    tags: ["markdown", "documentation", "typescript"],
  },
  {
    url: "https://raw.githubusercontent.com/facebook/react/main/README.md",
    name: "React Framework Guide.md",
    category: "documents",
    tags: ["markdown", "react", "guide"],
  },

  // CSV
  {
    url: "https://people.sc.fsu.edu/~jburkardt/data/csv/addresses.csv",
    name: "Customer Addresses.csv",
    category: "data",
    tags: ["csv", "data", "addresses"],
  },
  {
    url: "https://people.sc.fsu.edu/~jburkardt/data/csv/airtravel.csv",
    name: "Air Travel Statistics.csv",
    category: "data",
    tags: ["csv", "statistics", "travel"],
  },
];

async function downloadFile(url: string): Promise<Buffer | null> {
  try {
    console.log(`Downloading from ${url}...`);
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Failed to download ${url}: ${response.statusText}`);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    console.log(`Downloaded ${buffer.length} bytes`);
    return buffer;
  }
  catch (error) {
    console.error(`Error downloading ${url}:`, error);
    return null;
  }
}

function getMimeType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();

  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    json: "application/json",
    csv: "text/csv",
    txt: "text/plain",
    md: "text/markdown",
    html: "text/html",
    xml: "application/xml",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };

  return mimeTypes[ext || ""] || "application/octet-stream";
}

async function seedFiles() {
  console.log("Starting file seeding process...\n");

  const fileStoreService = new FileStoreService();
  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;

  // Load existing files once at the start
  console.log("Loading existing files...");
  const existingFiles = await fileStoreService.listFiles();
  const existingFileNames = new Set(existingFiles.map(f => f.originalName));
  console.log(`Found ${existingFiles.length} existing files\n`);

  for (const file of sampleFiles) {
    console.log(`\nProcessing: ${file.name}`);

    try {
      // Check if file already exists by original name
      if (existingFileNames.has(file.name)) {
        console.log(`⚠ Skipping ${file.name} - already exists`);
        skippedCount++;
        continue;
      }

      // Download the file
      const buffer = await downloadFile(file.url);

      if (!buffer) {
        console.error(`Skipping ${file.name} - download failed`);
        failCount++;
        continue;
      }

      // Store the file
      const mimeType = getMimeType(file.name);
      const metadata = await fileStoreService.storeFile(
        buffer,
        file.name,
        mimeType,
        {
          category: file.category,
          tags: file.tags,
          uploadedBy: "seed-script",
          preserveOriginalName: true,
        },
      );

      // Add to our local set to avoid duplicate checks
      existingFileNames.add(file.name);

      console.log(`✓ Stored ${file.name} with ID: ${metadata.id}`);
      console.log(`  Size: ${(metadata.size / 1024).toFixed(2)} KB`);
      console.log(`  Type: ${metadata.mimeType}`);
      console.log(`  Tags: ${metadata.tags?.join(", ")}`);

      successCount++;

      // Add a small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    catch (error) {
      console.error(`✗ Failed to process ${file.name}:`, error);
      failCount++;
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log("Seeding Complete!");
  console.log(`✓ Successfully seeded: ${successCount} files`);
  if (skippedCount > 0) {
    console.log(`⚠ Skipped (already exists): ${skippedCount} files`);
  }
  if (failCount > 0) {
    console.log(`✗ Failed: ${failCount} files`);
  }
  console.log("=".repeat(50));

  // Display storage info
  try {
    const storageInfo = await fileStoreService.getStorageInfo();
    console.log("\nStorage Information:");
    console.log(`Total Files: ${storageInfo.totalFiles}`);
    console.log(`Total Size: ${(storageInfo.totalSize / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`Categories: ${storageInfo.categories.join(", ")}`);
  }
  catch (error) {
    console.error("Could not fetch storage info:", error);
  }
}

// Run the seeding script
if (require.main === module) {
  seedFiles()
    .then(() => {
      console.log("\nSeeding script completed.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

export { seedFiles };
