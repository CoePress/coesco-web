import type { Company, CompanyStatus, Industry } from "@prisma/client";

import { companyRepository } from "@/repositories";

import { CustomerService } from "../customer.service";

jest.mock("@/repositories", () => ({
  companyRepository: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getAll: jest.fn(),
    getById: jest.fn(),
  },
}));

describe("customerService", () => {
  let service: CustomerService;

  beforeEach(() => {
    service = new CustomerService();
    jest.clearAllMocks();
  });

  describe("createCompany", () => {
    it("should create a company successfully", async () => {
      const companyData: Partial<Company> = {
        name: "Acme Corporation",
        website: "https://acme.com",
        phone: "555-9876",
        email: "contact@acme.com",
        industry: "MANUFACTURING" as Industry,
        createdById: "user-123",
        updatedById: "user-123",
      };

      const mockCreatedCompany: Company = {
        id: "company-123",
        name: "Acme Corporation",
        website: "https://acme.com",
        phone: "555-9876",
        email: "contact@acme.com",
        fax: null,
        industry: "MANUFACTURING" as Industry,
        yearFounded: null,
        revenue: null,
        employeeCount: null,
        customerSince: null,
        paymentTerms: null,
        creditLimit: null,
        taxId: null,
        logoUrl: null,
        notes: null,
        tags: [],
        status: "ACTIVE" as CompanyStatus,
        legacy: {},
        createdById: "user-123",
        updatedById: "user-123",
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockResponse = {
        success: true,
        data: mockCreatedCompany,
      };

      (companyRepository.create as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.createCompany(companyData);

      expect(companyRepository.create).toHaveBeenCalledWith(companyData);
      expect(companyRepository.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
      expect(result.data.id).toBe("company-123");
      expect(result.data.name).toBe("Acme Corporation");
      expect(result.data.industry).toBe("MANUFACTURING");
    });

    it("should throw an error if repository fails", async () => {
      const companyData: Partial<Company> = {
        name: "Acme Corporation",
        email: "contact@acme.com",
      };

      const error = new Error("Database connection failed");
      (companyRepository.create as jest.Mock).mockRejectedValue(error);

      await expect(service.createCompany(companyData)).rejects.toThrow("Database connection failed");
      expect(companyRepository.create).toHaveBeenCalledWith(companyData);
    });
  });

  describe("updateCompany", () => {
    it("should update a company successfully", async () => {
      const companyId = "company-123";
      const updateData: Partial<Company> = {
        website: "https://newacme.com",
        phone: "555-1111",
      };

      const mockUpdatedCompany: Company = {
        id: companyId,
        name: "Acme Corporation",
        website: "https://newacme.com",
        phone: "555-1111",
        email: "contact@acme.com",
        fax: null,
        industry: "MANUFACTURING" as Industry,
        yearFounded: null,
        revenue: null,
        employeeCount: null,
        customerSince: null,
        paymentTerms: null,
        creditLimit: null,
        taxId: null,
        logoUrl: null,
        notes: null,
        tags: [],
        status: "ACTIVE" as CompanyStatus,
        legacy: {},
        createdById: "user-123",
        updatedById: "user-123",
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockResponse = {
        success: true,
        data: mockUpdatedCompany,
      };

      (companyRepository.update as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.updateCompany(companyId, updateData);

      expect(companyRepository.update).toHaveBeenCalledWith(companyId, updateData);
      expect(result.data.website).toBe("https://newacme.com");
      expect(result.data.phone).toBe("555-1111");
    });
  });

  describe("deleteCompany", () => {
    it("should soft delete a company successfully", async () => {
      const companyId = "company-123";

      const mockResponse = {
        success: true,
        message: "Deleted successfully",
      };

      (companyRepository.delete as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.deleteCompany(companyId);

      expect(companyRepository.delete).toHaveBeenCalledWith(companyId);
      expect(result.success).toBe(true);
      expect(result.message).toBe("Deleted successfully");
    });
  });

  describe("getAllCompanies", () => {
    it("should return all companies with default params", async () => {
      const mockCompanies: Company[] = [
        {
          id: "company-1",
          name: "Acme Corporation",
          website: "https://acme.com",
          phone: "555-9876",
          email: "contact@acme.com",
          fax: null,
          industry: "MANUFACTURING" as Industry,
          yearFounded: null,
          revenue: null,
          employeeCount: null,
          customerSince: null,
          paymentTerms: null,
          creditLimit: null,
          taxId: null,
          logoUrl: null,
          notes: null,
          tags: [],
          status: "ACTIVE" as CompanyStatus,
          legacy: {},
          createdById: "user-123",
          updatedById: "user-123",
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "company-2",
          name: "Tech Innovations Inc",
          website: "https://techinnovations.com",
          phone: "555-4567",
          email: "info@techinnovations.com",
          fax: null,
          industry: "OTHER" as Industry,
          yearFounded: null,
          revenue: null,
          employeeCount: null,
          customerSince: null,
          paymentTerms: null,
          creditLimit: null,
          taxId: null,
          logoUrl: null,
          notes: null,
          tags: [],
          status: "ACTIVE" as CompanyStatus,
          legacy: {},
          createdById: "user-456",
          updatedById: "user-456",
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockResponse = {
        success: true,
        data: mockCompanies,
        meta: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
        },
      };

      (companyRepository.getAll as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.getAllCompanies();

      expect(companyRepository.getAll).toHaveBeenCalledWith(undefined);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe("Acme Corporation");
      expect(result.data[1].name).toBe("Tech Innovations Inc");
      expect(result.meta.total).toBe(2);
    });

    it("should return filtered companies with query params", async () => {
      const queryParams = {
        filter: { industry: "MANUFACTURING" },
        page: 1,
        pageSize: 10,
      };

      const mockCompanies: Company[] = [
        {
          id: "company-1",
          name: "Acme Corporation",
          website: "https://acme.com",
          phone: "555-9876",
          email: "contact@acme.com",
          fax: null,
          industry: "MANUFACTURING" as Industry,
          yearFounded: null,
          revenue: null,
          employeeCount: null,
          customerSince: null,
          paymentTerms: null,
          creditLimit: null,
          taxId: null,
          logoUrl: null,
          notes: null,
          tags: [],
          status: "ACTIVE" as CompanyStatus,
          legacy: {},
          createdById: "user-123",
          updatedById: "user-123",
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockResponse = {
        success: true,
        data: mockCompanies,
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      (companyRepository.getAll as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.getAllCompanies(queryParams);

      expect(companyRepository.getAll).toHaveBeenCalledWith(queryParams);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].industry).toBe("MANUFACTURING");
    });
  });

  describe("getCompanyById", () => {
    it("should return a single company by id", async () => {
      const companyId = "company-123";
      const mockCompany: Company = {
        id: companyId,
        name: "Acme Corporation",
        website: "https://acme.com",
        phone: "555-9876",
        email: "contact@acme.com",
        fax: null,
        industry: "MANUFACTURING" as Industry,
        yearFounded: null,
        revenue: null,
        employeeCount: null,
        customerSince: null,
        paymentTerms: null,
        creditLimit: null,
        taxId: null,
        logoUrl: null,
        notes: null,
        tags: [],
        status: "ACTIVE" as CompanyStatus,
        legacy: {},
        createdById: "user-123",
        updatedById: "user-123",
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockResponse = {
        success: true,
        data: mockCompany,
      };

      (companyRepository.getById as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.getCompanyById(companyId);

      expect(companyRepository.getById).toHaveBeenCalledWith(companyId, undefined);
      expect(result.data.id).toBe(companyId);
      expect(result.data.name).toBe("Acme Corporation");
      expect(result.data.industry).toBe("MANUFACTURING");
    });

    it("should return null when company not found", async () => {
      const companyId = "non-existent-id";

      const mockResponse = {
        success: true,
        data: null,
      };

      (companyRepository.getById as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.getCompanyById(companyId);

      expect(companyRepository.getById).toHaveBeenCalledWith(companyId, undefined);
      expect(result.data).toBeNull();
    });
  });
});
