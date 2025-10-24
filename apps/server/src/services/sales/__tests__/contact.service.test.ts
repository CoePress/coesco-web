import type { Contact } from "@prisma/client";

import { contactRepository } from "@/repositories";

import { ContactService } from "../contact.service";

jest.mock("@/repositories", () => ({
  contactRepository: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getAll: jest.fn(),
    getById: jest.fn(),
  },
}));

describe("contactService", () => {
  let service: ContactService;

  beforeEach(() => {
    service = new ContactService();
    jest.clearAllMocks();
  });

  describe("createContact", () => {
    it("should create a contact successfully", async () => {
      const contactData: Partial<Contact> = {
        companyId: "company-123",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "555-1234",
        title: "Sales Manager",
        isPrimary: true,
        createdById: "user-123",
        updatedById: "user-123",
      };

      const mockCreatedContact: Contact = {
        id: "contact-123",
        companyId: "company-123",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "555-1234",
        title: "Sales Manager",
        isPrimary: true,
        createdById: "user-123",
        updatedById: "user-123",
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockResponse = {
        success: true,
        data: mockCreatedContact,
      };

      (contactRepository.create as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.createContact(contactData);

      expect(contactRepository.create).toHaveBeenCalledWith(contactData);
      expect(contactRepository.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
      expect(result.data.id).toBe("contact-123");
      expect(result.data.firstName).toBe("John");
      expect(result.data.email).toBe("john.doe@example.com");
    });

    it("should throw an error if repository fails", async () => {
      const contactData: Partial<Contact> = {
        companyId: "company-123",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
      };

      const error = new Error("Database connection failed");
      (contactRepository.create as jest.Mock).mockRejectedValue(error);

      await expect(service.createContact(contactData)).rejects.toThrow("Database connection failed");
      expect(contactRepository.create).toHaveBeenCalledWith(contactData);
    });
  });

  describe("updateContact", () => {
    it("should update a contact successfully", async () => {
      const contactId = "contact-123";
      const updateData: Partial<Contact> = {
        email: "john.newemail@example.com",
        phone: "555-5678",
      };

      const mockUpdatedContact: Contact = {
        id: contactId,
        companyId: "company-123",
        firstName: "John",
        lastName: "Doe",
        email: "john.newemail@example.com",
        phone: "555-5678",
        title: "Sales Manager",
        isPrimary: true,
        createdById: "user-123",
        updatedById: "user-123",
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockResponse = {
        success: true,
        data: mockUpdatedContact,
      };

      (contactRepository.update as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.updateContact(contactId, updateData);

      expect(contactRepository.update).toHaveBeenCalledWith(contactId, updateData);
      expect(result.data.email).toBe("john.newemail@example.com");
      expect(result.data.phone).toBe("555-5678");
    });
  });

  describe("deleteContact", () => {
    it("should soft delete a contact successfully", async () => {
      const contactId = "contact-123";

      const mockResponse = {
        success: true,
        message: "Deleted successfully",
      };

      (contactRepository.delete as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.deleteContact(contactId);

      expect(contactRepository.delete).toHaveBeenCalledWith(contactId);
      expect(result.success).toBe(true);
      expect(result.message).toBe("Deleted successfully");
    });
  });

  describe("getAllContacts", () => {
    it("should return all contacts with default params", async () => {
      const mockContacts: Contact[] = [
        {
          id: "contact-1",
          companyId: "company-123",
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
          phone: "555-1234",
          title: "Sales Manager",
          isPrimary: true,
          createdById: "user-123",
          updatedById: "user-123",
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "contact-2",
          companyId: "company-456",
          firstName: "Jane",
          lastName: "Smith",
          email: "jane.smith@example.com",
          phone: "555-5678",
          title: "Engineer",
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
        data: mockContacts,
        meta: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
        },
      };

      (contactRepository.getAll as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.getAllContacts();

      expect(contactRepository.getAll).toHaveBeenCalledWith(undefined);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].firstName).toBe("John");
      expect(result.data[1].firstName).toBe("Jane");
      expect(result.meta.total).toBe(2);
    });

    it("should return filtered contacts with query params", async () => {
      const queryParams = {
        filter: { companyId: "company-123" },
        page: 1,
        pageSize: 10,
      };

      const mockContacts: Contact[] = [
        {
          id: "contact-1",
          companyId: "company-123",
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
          phone: "555-1234",
          title: "Sales Manager",
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
        data: mockContacts,
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      (contactRepository.getAll as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.getAllContacts(queryParams);

      expect(contactRepository.getAll).toHaveBeenCalledWith(queryParams);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].companyId).toBe("company-123");
    });
  });

  describe("getContactById", () => {
    it("should return a single contact by id", async () => {
      const contactId = "contact-123";
      const mockContact: Contact = {
        id: contactId,
        companyId: "company-123",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "555-1234",
        title: "Sales Manager",
        isPrimary: true,
        createdById: "user-123",
        updatedById: "user-123",
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockResponse = {
        success: true,
        data: mockContact,
      };

      (contactRepository.getById as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.getContactById(contactId);

      expect(contactRepository.getById).toHaveBeenCalledWith(contactId, undefined);
      expect(result.data.id).toBe(contactId);
      expect(result.data.firstName).toBe("John");
      expect(result.data.email).toBe("john.doe@example.com");
    });

    it("should return null when contact not found", async () => {
      const contactId = "non-existent-id";

      const mockResponse = {
        success: true,
        data: null,
      };

      (contactRepository.getById as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.getContactById(contactId);

      expect(contactRepository.getById).toHaveBeenCalledWith(contactId, undefined);
      expect(result.data).toBeNull();
    });
  });
});
