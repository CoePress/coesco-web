/* eslint-disable node/prefer-global/process */
/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function backfillQuoteRevisionFields() {
  console.log("Starting backfill of quote revision fields...");

  const quotes = await prisma.quote.findMany({
    include: {
      revisions: {
        orderBy: { revision: "desc" },
        take: 1,
      },
    },
  });

  console.log(`Found ${quotes.length} quotes to process`);

  let updated = 0;
  let skipped = 0;

  for (const quote of quotes) {
    const latestRevision = quote.revisions[0];

    if (!latestRevision) {
      console.log(`⚠️  Quote ${quote.id} has no revisions, skipping`);
      skipped++;
      continue;
    }

    await prisma.quote.update({
      where: { id: quote.id },
      data: {
        latestRevision: latestRevision.revision,
        latestRevisionStatus: latestRevision.status,
        latestRevisionTotalAmount: 0, // You'll need to calculate this from items if needed
      },
    });

    updated++;
    if (updated % 10 === 0) {
      console.log(`✓ Processed ${updated} quotes...`);
    }
  }

  console.log("\n✅ Backfill complete!");
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
}

backfillQuoteRevisionFields()
  .then(() => {
    console.log("\nDone!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error during backfill:", error);
    process.exit(1);
  });
