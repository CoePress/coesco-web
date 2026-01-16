/* eslint-disable no-console */

/**
 * EXAMPLE POST-MIGRATION SCRIPT - REFERENCE ONLY
 *
 * Copy this file into your migration folder (e.g., prisma/migrations/20241021_my_migration/post-migration.js)
 * and modify it to perform data migrations after the schema migration runs.
 *
 * This script receives a Prisma client instance and can perform any database operations.
 */

module.exports = async function (prisma) {
  console.log("Running post-migration script...");

  // Example 1: Update existing records with new default values
  await prisma.user.updateMany({
    where: { status: null },
    data: { status: "active" },
  });

  // Example 2: Create default/seed records
  await prisma.setting.createMany({
    data: [
      { key: "feature_flag_1", value: "true" },
      { key: "max_upload_size", value: "10485760" },
    ],
    skipDuplicates: true,
  });

  // Example 3: Complex data transformation with transaction
  await prisma.$transaction(async (tx) => {
    const orders = await tx.order.findMany({
      where: { total: 0 },
    });

    for (const order of orders) {
      const itemsTotal = await tx.orderItem.aggregate({
        where: { orderId: order.id },
        _sum: { price: true },
      });

      await tx.order.update({
        where: { id: order.id },
        data: { total: itemsTotal._sum.price || 0 },
      });
    }
  });

  // Example 4: Raw SQL for complex operations
  await prisma.$executeRaw`
    UPDATE "Product"
    SET "searchVector" = to_tsvector('english', "name" || ' ' || COALESCE("description", ''))
    WHERE "searchVector" IS NULL
  `;

  // Example 5: Conditional logic based on existing data
  const adminRole = await prisma.role.findFirst({
    where: { name: "Admin" },
  });

  if (adminRole) {
    await prisma.employee.updateMany({
      where: {
        department: "IT",
        roleId: null,
      },
      data: { roleId: adminRole.id },
    });
  }

  console.log("Post-migration script completed successfully!");
};
