# Sales Module

## Entities

- Customers
- Dealers
- Addresses
- Contacts
- Quotes
- Quote Revisions
- Quote (Revision) Items
- Options
- Option Rules
- Configurations

## Questions

- Should a quote be able to NOT have customer/dealer ids? (drafts)
- Should each customer have a single journey that can be referenced in multiple quotes?

```typescript
function isJourneyReadyForQuoteProcessing(journey: Journey): boolean {
  return (
    journey.customerId !== null && // Journey MUST have a customer
    journey.customer?.status === 'ACTIVE' // AND that customer must be ACTIVE (not STAGING)
  ) &&
  // other required Journey data checks
}

// When creating a blank quote
const stagingCompany = await prisma.company.create({
  data: {
    name: `Draft Customer - ${new Date().toISOString()}`, // or some identifier
    status: 'STAGING',
    // minimal required fields
  }
});

const journey = await prisma.journey.create({
  data: {
    customerId: stagingCompany.id, // Always has a customer
    createdById: salesPersonId,
  }
});

// On processing
await prisma.company.update({
  where: { id: stagingCompany.id },
  data: {
    status: 'PROCESSED',
    // Maybe add processedAt timestamp, replacedByCompanyId
  }
});

// Delete STAGING companies older than X days where no quotes are SENT/ACCEPTED
await prisma.company.deleteMany({
  where: {
    status: 'STAGING',
    createdAt: { lt: thirtyDaysAgo },
    customerJourneys: {
      every: {
        quotes: {
          every: {
            status: 'DRAFT' // Only delete if all quotes still draft
          }
        }
      }
    }
  }
});

// User clicks "New Quote"
// Show modal/form: "Create quote for existing customer or create draft?"

// Option 1: Existing Customer
const journey = await prisma.journey.create({
  data: {
    customerId: selectedExistingCustomer.id, // Real customer
    createdById: userId
  }
});

// Option 2: Draft Quote
const stagingCompany = await prisma.company.create({
  data: {
    name: "Draft Customer", // User can edit this
    status: 'STAGING'
  }
});

const journey = await prisma.journey.create({
  data: {
    customerId: stagingCompany.id, // Staging customer
    createdById: userId
  }
});

// Either way:
const quote = await prisma.quote.create({
  data: {
    journeyId: journey.id,
    status: 'DRAFT', // Always starts as DRAFT
    // ... other fields
  }
});

// All quotes where Alice is the RSM
const myPipeline = await prisma.employee.findUnique({
  where: { id: aliceId },
  include: { rsmQuotes: true },
});

// All revisions Bob approved
const approvals = await prisma.employee.findUnique({
  where: { id: bobId },
  include: { approvedRevisions: true },
});
```
