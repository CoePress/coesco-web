import type { Quote, QuoteItem, QuoteRevision, QuoteTerms } from "@prisma/client";

import { Prisma } from "@prisma/client";

import { quoteItemRepository, quoteRepository, quoteRevisionRepository, quoteTermsRepository } from "@/repositories";

import { QuoteService } from "../quote.service";

jest.mock("@/repositories", () => ({
  quoteRepository: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getAll: jest.fn(),
    getById: jest.fn(),
  },
  quoteRevisionRepository: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getAll: jest.fn(),
    getById: jest.fn(),
  },
  quoteItemRepository: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getAll: jest.fn(),
    getById: jest.fn(),
  },
  quoteTermsRepository: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getAll: jest.fn(),
    getById: jest.fn(),
  },
}));

describe("quoteService", () => {
  let service: QuoteService;

  beforeEach(() => {
    service = new QuoteService();
    jest.clearAllMocks();
  });

  describe("createQuote", () => {
    it("should create a quote with revision successfully", async () => {
      const quoteData = {
        customerId: "customer-123",
        status: "DRAFT",
        priority: "B",
        confidence: 50,
        items: [
          {
            description: "Test Item",
            quantity: 2,
            unitPrice: 100,
          },
        ],
        terms: [
          {
            verbiage: "Payment Terms",
          },
        ],
      };

      const mockQuote: Quote = {
        id: "quote-123",
        journeyId: null,
        customerId: "customer-123",
        customerContactId: null,
        customerAddressId: null,
        dealerId: null,
        dealerContactId: null,
        dealerAddressId: null,
        rsmId: null,
        year: "2025",
        number: "20250001",
        priority: "B",
        confidence: 50,
        status: "OPEN",
        legacy: {},
        createdById: "user-123",
        updatedById: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const mockRevision: QuoteRevision = {
        id: "revision-123",
        quoteId: "quote-123",
        revision: "A",
        status: "DRAFT",
        quoteDate: new Date(),
        approvedById: null,
        sentById: null,
        createdById: "user-123",
        updatedById: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      (quoteRepository.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      });

      (quoteRepository.create as jest.Mock).mockResolvedValue({
        success: true,
        data: mockQuote,
      });

      (quoteRevisionRepository.create as jest.Mock).mockResolvedValue({
        success: true,
        data: mockRevision,
      });

      (quoteItemRepository.create as jest.Mock).mockResolvedValue({
        success: true,
        data: {},
      });

      (quoteTermsRepository.create as jest.Mock).mockResolvedValue({
        success: true,
        data: {},
      });

      const result = await service.createQuote(quoteData);

      expect(quoteRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: "customer-123",
          year: "2025",
          priority: "B",
          confidence: 50,
        }),
      );
      expect(quoteRevisionRepository.create).toHaveBeenCalledTimes(1);
      expect(quoteItemRepository.create).toHaveBeenCalledTimes(1);
      expect(quoteTermsRepository.create).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
      expect(result.data.revision).toBe("A");
    });

    it("should throw error if quote creation fails", async () => {
      const quoteData = {
        customerId: "customer-123",
      };

      (quoteRepository.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      });

      (quoteRepository.create as jest.Mock).mockResolvedValue({
        success: false,
      });

      await expect(service.createQuote(quoteData)).rejects.toThrow("Failed to create quote");
    });

    it("should throw error if revision creation fails", async () => {
      const quoteData = {
        customerId: "customer-123",
      };

      const mockQuote: Quote = {
        id: "quote-123",
        journeyId: null,
        customerId: "customer-123",
        customerContactId: null,
        customerAddressId: null,
        dealerId: null,
        dealerContactId: null,
        dealerAddressId: null,
        rsmId: null,
        year: "2025",
        number: "20250001",
        priority: "C",
        confidence: 0,
        status: "OPEN",
        legacy: {},
        createdById: "user-123",
        updatedById: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      (quoteRepository.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      });

      (quoteRepository.create as jest.Mock).mockResolvedValue({
        success: true,
        data: mockQuote,
      });

      (quoteRevisionRepository.create as jest.Mock).mockResolvedValue({
        success: false,
      });

      await expect(service.createQuote(quoteData)).rejects.toThrow("Failed to create quote revision");
    });
  });

  describe("createQuoteRevision", () => {
    it("should create a new revision for existing quote", async () => {
      const quoteId = "quote-123";
      const revisionData = {
        notes: "Updated pricing",
      };

      const mockQuote: Quote = {
        id: quoteId,
        journeyId: null,
        customerId: "customer-123",
        customerContactId: null,
        customerAddressId: null,
        dealerId: null,
        dealerContactId: null,
        dealerAddressId: null,
        rsmId: null,
        year: "2025",
        number: "20250001",
        priority: "A",
        confidence: 75,
        status: "OPEN",
        legacy: {},
        createdById: "user-123",
        updatedById: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const mockRevision: QuoteRevision = {
        id: "revision-456",
        quoteId,
        revision: "B",
        status: "DRAFT",
        quoteDate: new Date(),
        approvedById: null,
        sentById: null,
        createdById: "user-123",
        updatedById: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      (quoteRepository.getById as jest.Mock).mockResolvedValue({
        success: true,
        data: mockQuote,
      });

      (quoteRepository.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: [mockQuote],
      });

      (quoteRevisionRepository.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: [{ revision: "A" }],
      });

      (quoteRevisionRepository.create as jest.Mock).mockResolvedValue({
        success: true,
        data: mockRevision,
      });

      const result = await service.createQuoteRevision(quoteId, revisionData);

      expect(result.revision).toBe("B");
    });

    it("should throw error if quote not found", async () => {
      const quoteId = "non-existent";
      const revisionData = {};

      (quoteRepository.getById as jest.Mock).mockResolvedValue({
        success: false,
        data: null,
      });

      await expect(service.createQuoteRevision(quoteId, revisionData)).rejects.toThrow("Quote not found");
    });
  });

  describe("getAllQuotesWithLatestRevision", () => {
    it("should return all quotes with their latest revisions", async () => {
      const mockQuotes: Quote[] = [
        {
          id: "quote-1",
          journeyId: null,
          customerId: "customer-123",
          customerContactId: null,
          customerAddressId: null,
          dealerId: null,
          dealerContactId: null,
          dealerAddressId: null,
          rsmId: null,
          year: "2025",
          number: "20250001",
          priority: "A",
          confidence: 80,
          status: "OPEN",
          legacy: {},
          createdById: "user-123",
          updatedById: "user-123",
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      const mockRevision: QuoteRevision = {
        id: "revision-1",
        quoteId: "quote-1",
        revision: "A",
        status: "SENT",
        quoteDate: new Date(),
        approvedById: null,
        sentById: null,
        createdById: "user-123",
        updatedById: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      (quoteRepository.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: mockQuotes,
        meta: {
          page: 1,
          limit: 25,
          total: 1,
          totalPages: 1,
        },
      });

      (quoteRevisionRepository.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: [mockRevision],
      });

      const result = await service.getAllQuotesWithLatestRevision();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].revision).toBe("A");
      expect(result.data[0].revisionStatus).toBe("SENT");
    });

    it("should return empty array when no quotes found", async () => {
      (quoteRepository.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
        meta: {
          page: 1,
          limit: 25,
          total: 0,
          totalPages: 0,
        },
      });

      const result = await service.getAllQuotesWithLatestRevision();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe("getQuoteWithDetails", () => {
    it("should return quote with latest revision, items, and terms", async () => {
      const quoteId = "quote-123";

      const mockQuote: Quote = {
        id: quoteId,
        journeyId: null,
        customerId: "customer-123",
        customerContactId: null,
        customerAddressId: null,
        dealerId: null,
        dealerContactId: null,
        dealerAddressId: null,
        rsmId: null,
        year: "2025",
        number: "20250001",
        priority: "A",
        confidence: 90,
        status: "OPEN",
        legacy: {},
        createdById: "user-123",
        updatedById: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const mockRevision: QuoteRevision = {
        id: "revision-123",
        quoteId,
        revision: "A",
        status: "APPROVED",
        quoteDate: new Date(),
        approvedById: null,
        sentById: null,
        createdById: "user-123",
        updatedById: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const mockItems: QuoteItem[] = [
        {
          id: "item-1",
          quoteRevisionId: "revision-123",
          configurationId: null,
          itemId: null,
          model: null,
          name: null,
          description: "Test Item",
          quantity: 5,
          unitPrice: new Prisma.Decimal(100),
          lineNumber: 1,
          isCustom: false,
          createdById: "user-123",
          updatedById: "user-123",
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      const mockTerms: QuoteTerms[] = [
        {
          id: "term-1",
          quoteRevisionId: "revision-123",
          percentage: null,
          netDays: 30,
          amount: null,
          verbiage: "Net 30",
          dueOrder: null,
          customTerms: null,
          notToExceed: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (quoteRepository.getById as jest.Mock).mockResolvedValue({
        success: true,
        data: mockQuote,
      });

      (quoteRevisionRepository.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: [mockRevision],
      });

      (quoteItemRepository.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: mockItems,
      });

      (quoteTermsRepository.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: mockTerms,
      });

      const result = await service.getQuoteWithDetails(quoteId);

      expect(result.success).toBe(true);
      expect(result.data.latestRevision.items).toHaveLength(1);
      expect(result.data.latestRevision.terms).toHaveLength(1);
    });

    it("should throw error if quote not found", async () => {
      (quoteRepository.getById as jest.Mock).mockResolvedValue({
        success: false,
        data: null,
      });

      await expect(service.getQuoteWithDetails("non-existent")).rejects.toThrow("Quote not found");
    });

    it("should throw error if no revisions found", async () => {
      const mockQuote: Quote = {
        id: "quote-123",
        journeyId: null,
        customerId: "customer-123",
        customerContactId: null,
        customerAddressId: null,
        dealerId: null,
        dealerContactId: null,
        dealerAddressId: null,
        rsmId: null,
        year: "2025",
        number: "20250001",
        priority: "A",
        confidence: 90,
        status: "OPEN",
        legacy: {},
        createdById: "user-123",
        updatedById: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      (quoteRepository.getById as jest.Mock).mockResolvedValue({
        success: true,
        data: mockQuote,
      });

      (quoteRevisionRepository.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      });

      await expect(service.getQuoteWithDetails("quote-123")).rejects.toThrow("No revisions found for quote");
    });
  });

  describe("updateQuote", () => {
    it("should update quote revision with items and terms", async () => {
      const quoteId = "quote-123";
      const updateData = {
        notes: "Updated notes",
        items: [
          {
            description: "New Item",
            quantity: 3,
            unitPrice: 150,
          },
        ],
        terms: [
          {
            verbiage: "New Terms",
          },
        ],
      };

      const mockQuote: Quote = {
        id: quoteId,
        journeyId: null,
        customerId: "customer-123",
        customerContactId: null,
        customerAddressId: null,
        dealerId: null,
        dealerContactId: null,
        dealerAddressId: null,
        rsmId: null,
        year: "2025",
        number: "20250001",
        priority: "A",
        confidence: 90,
        status: "OPEN",
        legacy: {},
        createdById: "user-123",
        updatedById: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const mockRevision: QuoteRevision = {
        id: "revision-123",
        quoteId,
        revision: "A",
        status: "DRAFT",
        quoteDate: new Date(),
        approvedById: null,
        sentById: null,
        createdById: "user-123",
        updatedById: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      (quoteRepository.getById as jest.Mock).mockResolvedValue({
        success: true,
        data: mockQuote,
      });

      (quoteRevisionRepository.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: [mockRevision],
      });

      (quoteItemRepository.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      });

      (quoteTermsRepository.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      });

      (quoteRevisionRepository.update as jest.Mock).mockResolvedValue({
        success: true,
        data: mockRevision,
      });

      (quoteItemRepository.create as jest.Mock).mockResolvedValue({
        success: true,
        data: {},
      });

      (quoteTermsRepository.create as jest.Mock).mockResolvedValue({
        success: true,
        data: {},
      });

      await service.updateQuote(quoteId, updateData);

      expect(quoteRevisionRepository.update).toHaveBeenCalledWith("revision-123", updateData);
      expect(quoteItemRepository.create).toHaveBeenCalledTimes(1);
      expect(quoteTermsRepository.create).toHaveBeenCalledTimes(1);
    });
  });

  describe("deleteQuote", () => {
    it("should delete a quote", async () => {
      const quoteId = "quote-123";

      (quoteRepository.delete as jest.Mock).mockResolvedValue({
        success: true,
        message: "Deleted successfully",
      });

      const result = await service.deleteQuote(quoteId);

      expect(quoteRepository.delete).toHaveBeenCalledWith(quoteId);
      expect(result.success).toBe(true);
    });
  });

  describe("approveQuote", () => {
    it("should approve the latest revision of a quote", async () => {
      const quoteId = "quote-123";

      const mockQuote: Quote = {
        id: quoteId,
        journeyId: null,
        customerId: "customer-123",
        customerContactId: null,
        customerAddressId: null,
        dealerId: null,
        dealerContactId: null,
        dealerAddressId: null,
        rsmId: null,
        year: "2025",
        number: "20250001",
        priority: "A",
        confidence: 90,
        status: "OPEN",
        legacy: {},
        createdById: "user-123",
        updatedById: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const mockRevision: QuoteRevision = {
        id: "revision-123",
        quoteId,
        revision: "A",
        status: "SENT",
        quoteDate: new Date(),
        approvedById: null,
        sentById: null,
        createdById: "user-123",
        updatedById: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      (quoteRepository.getById as jest.Mock).mockResolvedValue({
        success: true,
        data: mockQuote,
      });

      (quoteRevisionRepository.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: [mockRevision],
      });

      (quoteItemRepository.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      });

      (quoteTermsRepository.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      });

      (quoteRevisionRepository.update as jest.Mock).mockResolvedValue({
        success: true,
        data: { ...mockRevision, status: "APPROVED" },
      });

      const result = await service.approveQuote(quoteId);

      expect(quoteRevisionRepository.update).toHaveBeenCalledWith("revision-123", {
        status: "APPROVED",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("getNextQuoteNumber", () => {
    it("should generate first quote number for current year", async () => {
      (quoteRepository.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      });

      const result = await service.getNextQuoteNumber();

      expect(result).toBe("20250001");
    });

    it("should generate draft quote number", async () => {
      (quoteRepository.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      });

      const result = await service.getNextQuoteNumber(true);

      expect(result).toBe("DRAFT-20250001");
    });

    it("should increment last quote number", async () => {
      const mockQuote: Quote = {
        id: "quote-123",
        journeyId: null,
        customerId: "customer-123",
        customerContactId: null,
        customerAddressId: null,
        dealerId: null,
        dealerContactId: null,
        dealerAddressId: null,
        rsmId: null,
        year: "2025",
        number: "20250005",
        priority: "A",
        confidence: 90,
        status: "OPEN",
        legacy: {},
        createdById: "user-123",
        updatedById: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      (quoteRepository.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: [mockQuote],
      });

      const result = await service.getNextQuoteNumber();

      expect(result).toBe("20250006");
    });
  });

  describe("getNextQuoteRevision", () => {
    it("should return A for first revision", async () => {
      (quoteRepository.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      });

      const result = await service.getNextQuoteRevision("20250001");

      expect(result).toBe("A");
    });

    it("should increment single letter revision", async () => {
      const mockQuote: Quote = {
        id: "quote-123",
        journeyId: null,
        customerId: "customer-123",
        customerContactId: null,
        customerAddressId: null,
        dealerId: null,
        dealerContactId: null,
        dealerAddressId: null,
        rsmId: null,
        year: "2025",
        number: "20250001",
        priority: "A",
        confidence: 90,
        status: "OPEN",
        legacy: {},
        createdById: "user-123",
        updatedById: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      (quoteRepository.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: [mockQuote],
      });

      (quoteRevisionRepository.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: [{ revision: "A" }],
      });

      const result = await service.getNextQuoteRevision("20250001");

      expect(result).toBe("B");
    });

    it("should handle Z to AA transition", async () => {
      const mockQuote: Quote = {
        id: "quote-123",
        journeyId: null,
        customerId: "customer-123",
        customerContactId: null,
        customerAddressId: null,
        dealerId: null,
        dealerContactId: null,
        dealerAddressId: null,
        rsmId: null,
        year: "2025",
        number: "20250001",
        priority: "A",
        confidence: 90,
        status: "OPEN",
        legacy: {},
        createdById: "user-123",
        updatedById: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      (quoteRepository.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: [mockQuote],
      });

      (quoteRevisionRepository.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: [{ revision: "Z" }],
      });

      const result = await service.getNextQuoteRevision("20250001");

      expect(result).toBe("AA");
    });
  });

  describe("getQuoteMetrics", () => {
    it("should return metrics for open quotes", async () => {
      const mockQuotes: Quote[] = [
        {
          id: "quote-1",
          journeyId: null,
          customerId: "customer-123",
          customerContactId: null,
          customerAddressId: null,
          dealerId: null,
          dealerContactId: null,
          dealerAddressId: null,
          rsmId: null,
          year: "2025",
          number: "20250001",
          priority: "A",
          confidence: 80,
          status: "OPEN",
          legacy: {},
          createdById: "user-123",
          updatedById: "user-123",
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      const mockRevision: QuoteRevision = {
        id: "revision-1",
        quoteId: "quote-1",
        revision: "A",
        status: "SENT",
        quoteDate: new Date(),
        approvedById: null,
        sentById: null,
        createdById: "user-123",
        updatedById: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const mockItems: QuoteItem[] = [
        {
          id: "item-1",
          quoteRevisionId: "revision-1",
          configurationId: null,
          itemId: null,
          model: null,
          name: null,
          description: "Test Item",
          quantity: 5,
          unitPrice: new Prisma.Decimal(200),
          lineNumber: 1,
          isCustom: false,
          createdById: "user-123",
          updatedById: "user-123",
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      (quoteRepository.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: mockQuotes,
      });

      (quoteRevisionRepository.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: [mockRevision],
      });

      (quoteItemRepository.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: mockItems,
      });

      const result = await service.getQuoteMetrics();

      expect(result.success).toBe(true);
      expect(result.data.totalQuoteCount).toBe(1);
      expect(result.data.quotesByStatus.SENT).toBe(1);
    });

    it("should return zero metrics when no quotes found", async () => {
      (quoteRepository.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      });

      const result = await service.getQuoteMetrics();

      expect(result.success).toBe(true);
      expect(result.data.totalQuoteValue).toBe(0);
      expect(result.data.totalQuoteCount).toBe(0);
      expect(result.data.averageQuoteValue).toBe(0);
    });
  });

  describe("exportQuotePDF", () => {
    it("should export quote data as JSON buffer", async () => {
      const quoteId = "quote-123";

      const mockQuote: Quote = {
        id: quoteId,
        journeyId: null,
        customerId: "customer-123",
        customerContactId: null,
        customerAddressId: null,
        dealerId: null,
        dealerContactId: null,
        dealerAddressId: null,
        rsmId: null,
        year: "2025",
        number: "20250001",
        priority: "A",
        confidence: 90,
        status: "OPEN",
        legacy: {},
        createdById: "user-123",
        updatedById: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const mockRevision: QuoteRevision = {
        id: "revision-123",
        quoteId,
        revision: "A",
        status: "APPROVED",
        quoteDate: new Date(),
        approvedById: null,
        sentById: null,
        createdById: "user-123",
        updatedById: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      (quoteRepository.getById as jest.Mock).mockResolvedValue({
        success: true,
        data: mockQuote,
      });

      (quoteRevisionRepository.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: [mockRevision],
      });

      (quoteItemRepository.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      });

      (quoteTermsRepository.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      });

      const result = await service.exportQuotePDF(quoteId);

      expect(result).toBeInstanceOf(Buffer);
      const parsedContent = JSON.parse(result.toString());
      expect(parsedContent.quoteNumber).toBe("2025-20250001");
      expect(parsedContent.revision).toBe("A");
    });
  });
});
