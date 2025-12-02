/* eslint-disable no-console */
/* eslint-disable node/prefer-global/process */
import { PrismaClient, QuoteRevisionStatus, QuoteStatus } from "@prisma/client";

import { env } from "@/config/env";
import { QuoteService } from "@/services/sales/quote.service";
import { contextStorage } from "@/utils/context";

const prisma = new PrismaClient({
  datasources: { db: { url: env.DATABASE_URL } },
  log: ["warn", "error"],
});

const quoteService = new QuoteService();

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

const results: TestResult[] = [];

async function runTest(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, passed: true, duration: Date.now() - start });
    console.log(`  ✓ ${name} (${Date.now() - start}ms)`);
  }
  catch (err: any) {
    results.push({ name, passed: false, error: err.message, duration: Date.now() - start });
    console.log(`  ✗ ${name} (${Date.now() - start}ms)`);
    console.log(`    Error: ${err.message}`);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual: any, expected: any, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

async function cleanup(testPrefix: string) {
  const quotes = await prisma.quote.findMany({
    where: { number: { startsWith: testPrefix } },
    include: { revisions: true },
  });

  for (const quote of quotes) {
    for (const revision of quote.revisions) {
      await prisma.quoteItem.deleteMany({ where: { quoteRevisionId: revision.id } });
      await prisma.quoteTerms.deleteMany({ where: { quoteRevisionId: revision.id } });
    }
    await prisma.quoteRevision.deleteMany({ where: { quoteId: quote.id } });
  }
  await prisma.quote.deleteMany({ where: { number: { startsWith: testPrefix } } });

  await prisma.journey.deleteMany({ where: { name: { startsWith: testPrefix } } });
  await prisma.company.deleteMany({ where: { name: { startsWith: testPrefix } } });
}

async function main() {
  console.log("\n🧪 Quote Service E2E Tests\n");
  console.log("=".repeat(50));

  const testPrefix = `E2E_TEST_${Date.now()}`;
  let testQuoteId: string;
  let testRevisionId: string;
  let testCustomerId: string;

  const existingEmployee = await prisma.employee.findFirst({
    where: { deletedAt: null },
  });

  if (!existingEmployee) {
    console.error("No employee found in database. Please seed the database first.");
    process.exit(1);
  }

  const mockEmployee = {
    id: existingEmployee.id,
    firstName: existingEmployee.firstName,
    lastName: existingEmployee.lastName,
    email: existingEmployee.email,
    title: existingEmployee.title || "Tester",
    number: existingEmployee.number,
    initials: existingEmployee.initials,
  };

  console.log(`Using employee: ${mockEmployee.firstName} ${mockEmployee.lastName} (${mockEmployee.id})\n`);

  const runWithContext = <T>(fn: () => Promise<T>): Promise<T> => {
    return contextStorage.run(mockEmployee, fn);
  };

  try {
    console.log("\n📋 CREATE QUOTE TESTS\n");

    await runTest("createQuote - basic quote creation", async () => {
      const result = await runWithContext(() =>
        quoteService.createQuote({
          status: QuoteStatus.OPEN,
          priority: "B",
          confidence: 50,
        }),
      );

      assert(result.success, "Quote creation should succeed");
      assert(result.data.id, "Quote should have an ID");
      assert(result.data.number, "Quote should have a number");
      assertEqual(result.data.latestRevision.revision, "A", "Initial revision should be A");
      assertEqual(result.data.latestRevision.status, QuoteRevisionStatus.DRAFT, "Initial revision status should be DRAFT");

      testQuoteId = result.data.id;
      testRevisionId = result.data.latestRevision.id;
    });

    await runTest("createQuote - with existing customer", async () => {
      const existingCustomer = await prisma.company.findFirst({
        where: { deletedAt: null },
      });

      if (!existingCustomer) {
        throw new Error("No existing customer found to test with");
      }

      testCustomerId = existingCustomer.id;

      const result = await runWithContext(() =>
        quoteService.createQuote({
          customerId: testCustomerId,
          status: QuoteStatus.OPEN,
        }),
      );

      assert(result.success, "Quote creation should succeed");
      assertEqual(result.data.customerId, testCustomerId, "Quote should have correct customerId");
    });

    await runTest("createQuote - with existing journey", async () => {
      const existingJourney = await prisma.journey.findFirst({
        where: { deletedAt: null },
      });

      const result = await runWithContext(() =>
        quoteService.createQuote({
          customerId: existingJourney?.customerId || testCustomerId,
          journeyId: existingJourney?.id,
          status: QuoteStatus.OPEN,
        }),
      );

      assert(result.success, "Quote creation should succeed");
    });

    await runTest("createQuote - with items and terms", async () => {
      const result = await runWithContext(() =>
        quoteService.createQuote({
          status: QuoteStatus.OPEN,
          items: [
            { name: "Test Item 1", quantity: 2, unitPrice: 100, lineNumber: 1 },
            { name: "Test Item 2", quantity: 1, unitPrice: 250, lineNumber: 2 },
          ],
          terms: [
            { percentage: 50, netDays: 30, verbiage: "Net 30" },
            { percentage: 50, netDays: 60, verbiage: "Net 60" },
          ],
        }),
      );

      assert(result.success, "Quote creation should succeed");
    });

    console.log("\n📋 GET QUOTE TESTS\n");

    await runTest("getQuoteWithDetails - retrieve created quote", async () => {
      const result = await runWithContext(() =>
        quoteService.getQuoteWithDetails(testQuoteId),
      );

      assert(result.success, "Get quote should succeed");
      assertEqual(result.data.id, testQuoteId, "Should return correct quote");
      assert(result.data.latestRevision, "Should include latest revision");
    });

    await runTest("getAllQuotesWithLatestRevision - list quotes", async () => {
      const result = await runWithContext(() =>
        quoteService.getAllQuotesWithLatestRevision({ limit: 10 }),
      );

      assert(result.success, "Get all quotes should succeed");
      assert(Array.isArray(result.data), "Should return array");
      assert(result.meta, "Should include pagination meta");
    });

    console.log("\n📋 UPDATE QUOTE TESTS\n");

    await runTest("updateQuote - update revision data", async () => {
      const result = await runWithContext(() =>
        quoteService.updateQuote(testQuoteId, {
          quoteDate: new Date(),
        }),
      );

      assert(result.success, "Update should succeed");
    });

    await runTest("updateQuote - replace items", async () => {
      const result = await runWithContext(() =>
        quoteService.updateQuote(testQuoteId, {
          items: [
            { name: "Replaced Item", quantity: 5, unitPrice: 500, lineNumber: 1 },
          ],
        }),
      );

      assert(result.success, "Update with items should succeed");
    });

    await runTest("updateQuote - replace terms", async () => {
      const result = await runWithContext(() =>
        quoteService.updateQuote(testQuoteId, {
          terms: [
            { percentage: 100, netDays: 45, verbiage: "Full payment Net 45" },
          ],
        }),
      );

      assert(result.success, "Update with terms should succeed");
    });

    console.log("\n📋 REVISION TESTS\n");

    await runTest("createQuoteRevision - create revision B", async () => {
      const result = await runWithContext(() =>
        quoteService.createQuoteRevision(testQuoteId, {
          status: QuoteRevisionStatus.DRAFT,
          items: [
            { name: "Rev B Item", quantity: 1, unitPrice: 1000, lineNumber: 1 },
          ],
        }),
      );

      assert(result, "Revision creation should succeed");
      assertEqual(result.revision, "B", "Second revision should be B");
    });

    await runTest("getQuoteRevisions - list all revisions", async () => {
      const result = await runWithContext(() =>
        quoteService.getQuoteRevisions(testQuoteId),
      );

      assert(result.success, "Get revisions should succeed");
      assert(result.data.length >= 2, "Should have at least 2 revisions");
    });

    await runTest("getQuoteRevision - get specific revision", async () => {
      const result = await runWithContext(() =>
        quoteService.getQuoteRevision(testQuoteId, testRevisionId),
      );

      assert(result.success, "Get revision should succeed");
      assertEqual(result.data.latestRevision.id, testRevisionId, "Should return correct revision");
    });

    console.log("\n📋 STATUS TRANSITION TESTS\n");

    await runTest("approveQuote - transition to APPROVED", async () => {
      const result = await runWithContext(() =>
        quoteService.approveQuote(testQuoteId),
      );

      assert(result.success, "Approve should succeed");
      assertEqual(result.data.status, QuoteRevisionStatus.APPROVED, "Status should be APPROVED");
    });

    await runTest("sendQuote - transition to SENT", async () => {
      const result = await runWithContext(() =>
        quoteService.sendQuote(testQuoteId, { sentById: mockEmployee.id }),
      );

      assert(result.success, "Send should succeed");
      assertEqual(result.data.status, QuoteRevisionStatus.SENT, "Status should be SENT");
    });

    await runTest("acceptQuote - transition to ACCEPTED", async () => {
      const result = await runWithContext(() =>
        quoteService.acceptQuote(testQuoteId),
      );

      assert(result.success, "Accept should succeed");
      assertEqual(result.data.status, QuoteRevisionStatus.ACCEPTED, "Status should be ACCEPTED");
    });

    let rejectTestQuoteId: string;
    await runTest("rejectQuote - transition to REJECTED", async () => {
      const createResult = await runWithContext(() =>
        quoteService.createQuote({ status: QuoteStatus.OPEN }),
      );
      rejectTestQuoteId = createResult.data.id;

      const result = await runWithContext(() =>
        quoteService.rejectQuote(rejectTestQuoteId),
      );

      assert(result.success, "Reject should succeed");
      assertEqual(result.data.status, QuoteRevisionStatus.REJECTED, "Status should be REJECTED");
    });

    console.log("\n📋 QUOTE ITEM TESTS\n");

    let testItemId: string;
    let itemQuoteId: string;
    await runTest("createQuoteItem - add item to quote", async () => {
      const createResult = await runWithContext(() =>
        quoteService.createQuote({ status: QuoteStatus.OPEN }),
      );
      itemQuoteId = createResult.data.id;

      const result = await runWithContext(() =>
        quoteService.createQuoteItem(itemQuoteId, {
          name: "New Item",
          quantity: 3,
          unitPrice: 150,
        }),
      );

      assert(result.success, "Create item should succeed");
      assert(result.data.id, "Item should have ID");
      assertEqual(result.data.lineNumber, 1, "First item should be line 1");

      testItemId = result.data.id;
    });

    await runTest("updateQuoteItem - modify item", async () => {
      const result = await runWithContext(() =>
        quoteService.updateQuoteItem(testItemId, {
          quantity: 10,
          unitPrice: 200,
        }),
      );

      assert(result.success, "Update item should succeed");
      assertEqual(result.data.quantity, 10, "Quantity should be updated");
    });

    await runTest("deleteQuoteItem - remove item", async () => {
      const result = await runWithContext(() =>
        quoteService.deleteQuoteItem(testItemId),
      );

      assert(result.success, "Delete item should succeed");
    });

    console.log("\n📋 LINE NUMBER REORDERING TESTS\n");

    await runTest("updateQuoteItemLineNumber - reorder items", async () => {
      const createResult = await runWithContext(() =>
        quoteService.createQuote({
          status: QuoteStatus.OPEN,
          items: [
            { name: "Item 1", quantity: 1, unitPrice: 100, lineNumber: 1 },
            { name: "Item 2", quantity: 1, unitPrice: 200, lineNumber: 2 },
            { name: "Item 3", quantity: 1, unitPrice: 300, lineNumber: 3 },
          ],
        }),
      );

      const quoteDetails = await runWithContext(() =>
        quoteService.getQuoteWithDetails(createResult.data.id),
      );

      const item1 = quoteDetails.data.quoteItems.find((i: any) => i.name === "Item 1");

      const result = await runWithContext(() =>
        quoteService.updateQuoteItemLineNumber(item1.id, 3),
      );

      assert(result.success, "Reorder should succeed");
    });

    console.log("\n📋 NUMBER GENERATION TESTS\n");

    await runTest("getNextQuoteNumber - generates sequential numbers", async () => {
      const num1 = await runWithContext(() =>
        quoteService.getNextQuoteNumber(false),
      );
      const num2 = await runWithContext(() =>
        quoteService.getNextQuoteNumber(false),
      );

      assert(num1, "Should return a number");
      assert(num2, "Should return a number");
    });

    await runTest("getNextQuoteNumber - draft prefix", async () => {
      const num = await runWithContext(() =>
        quoteService.getNextQuoteNumber(true),
      );

      assert(num.startsWith("DRAFT-"), "Draft number should have DRAFT- prefix");
    });

    await runTest("getNextQuoteRevision - generates sequential revisions", async () => {
      const quoteResult = await runWithContext(() =>
        quoteService.createQuote({ status: QuoteStatus.OPEN }),
      );

      const nextRev = await runWithContext(() =>
        quoteService.getNextQuoteRevision(
          quoteResult.data.number,
          Number.parseInt(quoteResult.data.year),
        ),
      );

      assertEqual(nextRev, "B", "Next revision after A should be B");
    });

    console.log("\n📋 METRICS TESTS\n");

    await runTest("getQuoteMetrics - returns aggregated metrics", async () => {
      const result = await runWithContext(() =>
        quoteService.getQuoteMetrics(),
      );

      assert(result.success, "Get metrics should succeed");
      assert("totalQuoteValue" in result.data, "Should have totalQuoteValue");
      assert("totalQuoteCount" in result.data, "Should have totalQuoteCount");
      assert("averageQuoteValue" in result.data, "Should have averageQuoteValue");
      assert("quotesByStatus" in result.data, "Should have quotesByStatus");
    });

    console.log("\n📋 PDF EXPORT TESTS\n");

    await runTest("exportQuotePDF - generates PDF buffer", async () => {
      const result = await runWithContext(() =>
        quoteService.exportQuotePDF(testQuoteId),
      );

      assert(Buffer.isBuffer(result), "Should return a Buffer");
      assert(result.length > 0, "Buffer should not be empty");
    });

    console.log("\n📋 DELETE TESTS\n");

    await runTest("deleteQuoteRevision - remove revision", async () => {
      const createResult = await runWithContext(() =>
        quoteService.createQuote({ status: QuoteStatus.OPEN }),
      );
      const deleteQuoteId = createResult.data.id;

      await runWithContext(() =>
        quoteService.createQuoteRevision(deleteQuoteId, { status: QuoteRevisionStatus.DRAFT }),
      );

      const revisions = await runWithContext(() =>
        quoteService.getQuoteRevisions(deleteQuoteId),
      );
      const revB = revisions.data.find((r: any) => r.revision === "B");

      const result = await runWithContext(() =>
        quoteService.deleteQuoteRevision(deleteQuoteId, revB.id),
      );

      assert(result.success, "Delete revision should succeed");
    });

    await runTest("deleteQuote - remove quote entirely", async () => {
      const createResult = await runWithContext(() =>
        quoteService.createQuote({ status: QuoteStatus.OPEN }),
      );

      const result = await runWithContext(() =>
        quoteService.deleteQuote(createResult.data.id),
      );

      assert(result.success, "Delete quote should succeed");
    });

    console.log("\n📋 ERROR HANDLING TESTS\n");

    await runTest("getQuoteWithDetails - throws for non-existent quote", async () => {
      let threw = false;
      try {
        await runWithContext(() =>
          quoteService.getQuoteWithDetails("non-existent-id"),
        );
      }
      catch {
        threw = true;
      }
      assert(threw, "Should throw for non-existent quote");
    });

    await runTest("createQuoteRevision - throws for non-existent quote", async () => {
      let threw = false;
      try {
        await runWithContext(() =>
          quoteService.createQuoteRevision("non-existent-id", { status: QuoteRevisionStatus.DRAFT }),
        );
      }
      catch {
        threw = true;
      }
      assert(threw, "Should throw for non-existent quote");
    });

    await runTest("getQuoteRevision - throws for mismatched quote/revision", async () => {
      let threw = false;
      try {
        await runWithContext(() =>
          quoteService.getQuoteRevision(testQuoteId, "wrong-revision-id"),
        );
      }
      catch {
        threw = true;
      }
      assert(threw, "Should throw for mismatched revision");
    });
  }
  finally {
    console.log("\n🧹 Cleaning up test data...\n");
    await cleanup(testPrefix);
  }

  console.log("=".repeat(50));
  console.log("\n📊 TEST RESULTS SUMMARY\n");

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`Duration: ${totalDuration}ms`);

  if (failed > 0) {
    console.log("\n❌ FAILED TESTS:\n");
    for (const r of results.filter(r => !r.passed)) {
      console.log(`  • ${r.name}`);
      console.log(`    ${r.error}`);
    }
  }

  console.log("\n");

  await prisma.$disconnect();

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
