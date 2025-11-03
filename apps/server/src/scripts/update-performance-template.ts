import { prisma } from "@/utils/prisma";
import {
  RFQ_PERFORMANCE_SHEET_SEED,
  MATERIAL_SPECS_PERFORMANCE_SHEET_SEED,
  TDDBHD_PERFORMANCE_SHEET_SEED,
  REEL_DRIVE_PERFORMANCE_SHEET_SEED,
  STR_UTILITY_PERFORMANCE_SHEET_SEED,
  ROLL_STR_BACKBEND_PERFORMANCE_SHEET_SEED,
  FEED_PERFORMANCE_SHEET_SEED,
  SHEAR_PERFORMANCE_SHEET_SEED,
  SUMMARY_REPORT_PERFORMANCE_SHEET_SEED,
} from "@/templates/performance-sheet";

const FULL_TEMPLATE_SECTIONS = [
  RFQ_PERFORMANCE_SHEET_SEED,
  MATERIAL_SPECS_PERFORMANCE_SHEET_SEED,
  TDDBHD_PERFORMANCE_SHEET_SEED,
  REEL_DRIVE_PERFORMANCE_SHEET_SEED,
  STR_UTILITY_PERFORMANCE_SHEET_SEED,
  ROLL_STR_BACKBEND_PERFORMANCE_SHEET_SEED,
  FEED_PERFORMANCE_SHEET_SEED,
  SHEAR_PERFORMANCE_SHEET_SEED,
  SUMMARY_REPORT_PERFORMANCE_SHEET_SEED,
];

async function updatePerformanceSheetTemplate() {
  console.log("🔄 Updating performance sheet template...");

  try {
    // Find all versions
    const versions = await prisma.performanceSheetVersion.findMany();

    if (versions.length === 0) {
      console.log("❌ No performance sheet versions found in database");
      console.log("💡 You may need to create a version first");
      return;
    }

    console.log(`📋 Found ${versions.length} version(s) in database`);

    // Update each version
    for (const version of versions) {
      console.log(`\n📝 Updating version: ${version.id}`);

      await prisma.performanceSheetVersion.update({
        where: { id: version.id },
        data: {
          sections: FULL_TEMPLATE_SECTIONS as any,
        },
      });

      console.log(`✅ Version ${version.id} updated successfully!`);
    }

    console.log("\n🎉 All performance sheet versions updated!");
    console.log("🔄 Please refresh your browser to see the changes");
  } catch (error) {
    console.error("❌ Error updating template:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updatePerformanceSheetTemplate();
