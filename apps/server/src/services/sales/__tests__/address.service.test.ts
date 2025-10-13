import type { Address } from "@prisma/client";
import { AddressService } from "../address.service";
import { addressRepository } from "@/repositories";

jest.mock("@/repositories", () => ({
  addressRepository: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getAll: jest.fn(),
    getById: jest.fn(),
  },
}));

describe("AddressService", () => {
  let service: AddressService;

  beforeEach(() => {
    service = new AddressService();
    jest.clearAllMocks();
  });

  describe("createAddress", () => {
    it("should create an address successfully", async () => {
      const addressData: Omit<Address, "id" | "createdAt" | "updatedAt"> = {
        companyId: "company-123",
        addressLine1: "123 Main St",
        addressLine2: null,
        city: "Springfield",
        state: "IL",
        zip: "62701",
        country: "USA",
        isPrimary: true,
        createdById: "user-123",
        updatedById: "user-123",
        deletedAt: null,
      };

      const mockCreatedAddress: Address = {
        id: "address-123",
        ...addressData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockResponse = {
        success: true,
        data: mockCreatedAddress,
      };

      (addressRepository.create as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.createAddress(addressData);

      expect(addressRepository.create).toHaveBeenCalledWith(addressData);
      expect(addressRepository.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
      expect(result.data.id).toBe("address-123");
      expect(result.data.city).toBe("Springfield");
    });

    it("should throw an error if repository fails", async () => {
      const addressData: Omit<Address, "id" | "createdAt" | "updatedAt"> = {
        companyId: "company-123",
        addressLine1: "123 Main St",
        addressLine2: null,
        city: "Springfield",
        state: "IL",
        zip: "62701",
        country: "USA",
        isPrimary: true,
        createdById: "user-123",
        updatedById: "user-123",
        deletedAt: null,
      };

      const error = new Error("Database connection failed");
      (addressRepository.create as jest.Mock).mockRejectedValue(error);

      await expect(service.createAddress(addressData)).rejects.toThrow("Database connection failed");
      expect(addressRepository.create).toHaveBeenCalledWith(addressData);
    });
  });

  describe("updateAddress", () => {
    it("should update an address successfully", async () => {
      const addressId = "address-123";
      const updateData: Partial<Omit<Address, "id" | "createdAt" | "updatedAt">> = {
        city: "New City",
        zip: "62702",
      };

      const mockUpdatedAddress: Address = {
        id: addressId,
        companyId: "company-123",
        addressLine1: "123 Main St",
        addressLine2: null,
        city: "New City",
        state: "IL",
        zip: "62702",
        country: "USA",
        isPrimary: true,
        createdById: "user-123",
        updatedById: "user-123",
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockResponse = {
        success: true,
        data: mockUpdatedAddress,
      };

      (addressRepository.update as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.updateAddress(addressId, updateData);

      expect(addressRepository.update).toHaveBeenCalledWith(addressId, updateData);
      expect(result.data.city).toBe("New City");
      expect(result.data.zip).toBe("62702");
    });
  });

  describe("deleteAddress", () => {
    it("should soft delete an address successfully", async () => {
      const addressId = "address-123";

      const mockResponse = {
        success: true,
        message: "Deleted successfully",
      };

      (addressRepository.delete as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.deleteAddress(addressId);

      expect(addressRepository.delete).toHaveBeenCalledWith(addressId);
      expect(result.success).toBe(true);
      expect(result.message).toBe("Deleted successfully");
    });
  });

  describe("getAllAddresses", () => {
    it("should return all addresses with default params", async () => {
      const mockAddresses: Address[] = [
        {
          id: "address-1",
          companyId: "company-123",
          addressLine1: "123 Main St",
          addressLine2: null,
          city: "Springfield",
          state: "IL",
          zip: "62701",
          country: "USA",
          isPrimary: true,
          createdById: "user-123",
          updatedById: "user-123",
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "address-2",
          companyId: "company-456",
          addressLine1: "456 Oak Ave",
          addressLine2: null,
          city: "Chicago",
          state: "IL",
          zip: "60601",
          country: "USA",
          isPrimary: false,
          createdById: "user-456",
          updatedById: "user-456",
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockResponse = {
        success: true,
        data: mockAddresses,
        meta: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
        },
      };

      (addressRepository.getAll as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.getAllAddresses();

      expect(addressRepository.getAll).toHaveBeenCalledWith(undefined);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].city).toBe("Springfield");
      expect(result.data[1].city).toBe("Chicago");
      expect(result.meta.total).toBe(2);
    });

    it("should return filtered addresses with query params", async () => {
      const queryParams = {
        filter: { companyId: "company-123" },
        page: 1,
        pageSize: 10,
      };

      const mockAddresses: Address[] = [
        {
          id: "address-1",
          companyId: "company-123",
          addressLine1: "123 Main St",
          addressLine2: null,
          city: "Springfield",
          state: "IL",
          zip: "62701",
          country: "USA",
          isPrimary: true,
          createdById: "user-123",
          updatedById: "user-123",
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockResponse = {
        success: true,
        data: mockAddresses,
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      (addressRepository.getAll as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.getAllAddresses(queryParams);

      expect(addressRepository.getAll).toHaveBeenCalledWith(queryParams);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].companyId).toBe("company-123");
    });
  });

  describe("getAddressById", () => {
    it("should return a single address by id", async () => {
      const addressId = "address-123";
      const mockAddress: Address = {
        id: addressId,
        companyId: "company-123",
        addressLine1: "123 Main St",
        addressLine2: null,
        city: "Springfield",
        state: "IL",
        zip: "62701",
        country: "USA",
        isPrimary: true,
        createdById: "user-123",
        updatedById: "user-123",
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockResponse = {
        success: true,
        data: mockAddress,
      };

      (addressRepository.getById as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.getAddressById(addressId);

      expect(addressRepository.getById).toHaveBeenCalledWith(addressId, undefined);
      expect(result.data.id).toBe(addressId);
      expect(result.data.addressLine1).toBe("123 Main St");
    });

    it("should return null when address not found", async () => {
      const addressId = "non-existent-id";

      const mockResponse = {
        success: true,
        data: null,
      };

      (addressRepository.getById as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.getAddressById(addressId);

      expect(addressRepository.getById).toHaveBeenCalledWith(addressId, undefined);
      expect(result.data).toBeNull();
    });
  });
});
