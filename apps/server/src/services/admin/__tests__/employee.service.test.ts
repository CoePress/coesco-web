import type { Employee, User } from "@prisma/client";

import { employeeRepository, userRepository } from "@/repositories";

import { EmployeeService } from "../employee.service";

jest.mock("@/repositories", () => ({
  employeeRepository: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getAll: jest.fn(),
    getById: jest.fn(),
  },
  userRepository: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getAll: jest.fn(),
    getById: jest.fn(),
  },
}));

describe("employeeService", () => {
  let service: EmployeeService;

  beforeEach(() => {
    service = new EmployeeService();
    jest.clearAllMocks();
  });

  describe("createEmployee", () => {
    it("should create an employee successfully", async () => {
      const employeeData: Partial<Employee> = {
        userId: "user-123",
        number: "EMP001",
        firstName: "John",
        lastName: "Doe",
        initials: "JD",
        email: "john.doe@example.com",
        title: "Software Engineer",
        isActive: true,
        isSalaried: true,
      };

      const mockEmployee: Employee = {
        id: "employee-123",
        userId: "user-123",
        number: "EMP001",
        firstName: "John",
        lastName: "Doe",
        initials: "JD",
        email: "john.doe@example.com",
        phoneNumber: null,
        title: "Software Engineer",
        hireDate: null,
        startDate: null,
        terminationDate: null,
        departmentId: null,
        managerId: null,
        isSalaried: true,
        isActive: true,
        createdById: "admin-123",
        updatedById: "admin-123",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const mockResponse = {
        success: true,
        data: mockEmployee,
      };

      (employeeRepository.create as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.createEmployee(employeeData);

      expect(employeeRepository.create).toHaveBeenCalledWith(employeeData);
      expect(employeeRepository.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
      expect(result.data.id).toBe("employee-123");
      expect(result.data.firstName).toBe("John");
      expect(result.data.lastName).toBe("Doe");
    });

    it("should throw an error if repository fails", async () => {
      const employeeData: Partial<Employee> = {
        userId: "user-123",
        number: "EMP001",
        firstName: "John",
        lastName: "Doe",
        initials: "JD",
        title: "Software Engineer",
      };

      const error = new Error("Database connection failed");
      (employeeRepository.create as jest.Mock).mockRejectedValue(error);

      await expect(service.createEmployee(employeeData)).rejects.toThrow("Database connection failed");
      expect(employeeRepository.create).toHaveBeenCalledWith(employeeData);
    });
  });

  describe("updateEmployee", () => {
    it("should update an employee successfully", async () => {
      const employeeId = "employee-123";
      const updateData: Partial<Employee> = {
        title: "Senior Software Engineer",
        phoneNumber: "555-1234",
      };

      const mockUpdatedEmployee: Employee = {
        id: employeeId,
        userId: "user-123",
        number: "EMP001",
        firstName: "John",
        lastName: "Doe",
        initials: "JD",
        email: "john.doe@example.com",
        phoneNumber: "555-1234",
        title: "Senior Software Engineer",
        hireDate: null,
        startDate: null,
        terminationDate: null,
        departmentId: null,
        managerId: null,
        isSalaried: true,
        isActive: true,
        createdById: "admin-123",
        updatedById: "admin-123",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const mockResponse = {
        success: true,
        data: mockUpdatedEmployee,
      };

      (employeeRepository.update as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.updateEmployee(employeeId, updateData);

      expect(employeeRepository.update).toHaveBeenCalledWith(employeeId, updateData);
      expect(result.data.title).toBe("Senior Software Engineer");
      expect(result.data.phoneNumber).toBe("555-1234");
    });
  });

  describe("deleteEmployee", () => {
    it("should soft delete an employee successfully", async () => {
      const employeeId = "employee-123";

      const mockResponse = {
        success: true,
        message: "Deleted successfully",
      };

      (employeeRepository.delete as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.deleteEmployee(employeeId);

      expect(employeeRepository.delete).toHaveBeenCalledWith(employeeId);
      expect(result.success).toBe(true);
      expect(result.message).toBe("Deleted successfully");
    });
  });

  describe("getAllEmployees", () => {
    it("should return all employees with default params", async () => {
      const mockEmployees: Employee[] = [
        {
          id: "employee-1",
          userId: "user-1",
          number: "EMP001",
          firstName: "John",
          lastName: "Doe",
          initials: "JD",
          email: "john.doe@example.com",
          phoneNumber: null,
          title: "Software Engineer",
          hireDate: null,
          startDate: null,
          terminationDate: null,
          departmentId: null,
          managerId: null,
          isSalaried: true,
          isActive: true,
          createdById: "admin-123",
          updatedById: "admin-123",
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        {
          id: "employee-2",
          userId: "user-2",
          number: "EMP002",
          firstName: "Jane",
          lastName: "Smith",
          initials: "JS",
          email: "jane.smith@example.com",
          phoneNumber: null,
          title: "Product Manager",
          hireDate: null,
          startDate: null,
          terminationDate: null,
          departmentId: null,
          managerId: null,
          isSalaried: true,
          isActive: true,
          createdById: "admin-123",
          updatedById: "admin-123",
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      const mockResponse = {
        success: true,
        data: mockEmployees,
        meta: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
        },
      };

      (employeeRepository.getAll as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.getAllEmployees();

      expect(employeeRepository.getAll).toHaveBeenCalledWith(undefined);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].firstName).toBe("John");
      expect(result.data[1].firstName).toBe("Jane");
      expect(result.meta.total).toBe(2);
    });

    it("should return filtered employees with query params", async () => {
      const queryParams = {
        filter: { departmentId: "dept-123" },
        page: 1,
        pageSize: 10,
      };

      const mockEmployees: Employee[] = [
        {
          id: "employee-1",
          userId: "user-1",
          number: "EMP001",
          firstName: "John",
          lastName: "Doe",
          initials: "JD",
          email: "john.doe@example.com",
          phoneNumber: null,
          title: "Software Engineer",
          hireDate: null,
          startDate: null,
          terminationDate: null,
          departmentId: "dept-123",
          managerId: null,
          isSalaried: true,
          isActive: true,
          createdById: "admin-123",
          updatedById: "admin-123",
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      const mockResponse = {
        success: true,
        data: mockEmployees,
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      (employeeRepository.getAll as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.getAllEmployees(queryParams);

      expect(employeeRepository.getAll).toHaveBeenCalledWith(queryParams);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].departmentId).toBe("dept-123");
    });
  });

  describe("getEmployeeById", () => {
    it("should return a single employee by id", async () => {
      const employeeId = "employee-123";
      const mockEmployee: Employee = {
        id: employeeId,
        userId: "user-123",
        number: "EMP001",
        firstName: "John",
        lastName: "Doe",
        initials: "JD",
        email: "john.doe@example.com",
        phoneNumber: null,
        title: "Software Engineer",
        hireDate: null,
        startDate: null,
        terminationDate: null,
        departmentId: null,
        managerId: null,
        isSalaried: true,
        isActive: true,
        createdById: "admin-123",
        updatedById: "admin-123",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const mockResponse = {
        success: true,
        data: mockEmployee,
      };

      (employeeRepository.getById as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.getEmployeeById(employeeId);

      expect(employeeRepository.getById).toHaveBeenCalledWith(employeeId, undefined);
      expect(result.data.id).toBe(employeeId);
      expect(result.data.firstName).toBe("John");
    });

    it("should return null when employee not found", async () => {
      const employeeId = "non-existent-id";

      const mockResponse = {
        success: true,
        data: null,
      };

      (employeeRepository.getById as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.getEmployeeById(employeeId);

      expect(employeeRepository.getById).toHaveBeenCalledWith(employeeId, undefined);
      expect(result.data).toBeNull();
    });
  });

  describe("createUser", () => {
    it("should create a user successfully", async () => {
      const userData: Partial<User> = {
        username: "johndoe",
        password: "hashedpassword123",
        role: "USER",
        isActive: true,
      };

      const mockUser: User = {
        id: "user-123",
        username: "johndoe",
        password: "hashedpassword123",
        microsoftId: null,
        role: "USER",
        isActive: true,
        lastLogin: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockResponse = {
        success: true,
        data: mockUser,
      };

      (userRepository.create as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.createUser(userData);

      expect(userRepository.create).toHaveBeenCalledWith(userData);
      expect(userRepository.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
      expect(result.data.id).toBe("user-123");
      expect(result.data.username).toBe("johndoe");
    });

    it("should throw an error if repository fails", async () => {
      const userData: Partial<User> = {
        username: "johndoe",
        password: "hashedpassword123",
      };

      const error = new Error("Username already exists");
      (userRepository.create as jest.Mock).mockRejectedValue(error);

      await expect(service.createUser(userData)).rejects.toThrow("Username already exists");
      expect(userRepository.create).toHaveBeenCalledWith(userData);
    });
  });

  describe("updateUser", () => {
    it("should update a user successfully", async () => {
      const userId = "user-123";
      const updateData: Partial<User> = {
        isActive: false,
      };

      const mockUpdatedUser: User = {
        id: userId,
        username: "johndoe",
        password: "hashedpassword123",
        microsoftId: null,
        role: "USER",
        isActive: false,
        lastLogin: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockResponse = {
        success: true,
        data: mockUpdatedUser,
      };

      (userRepository.update as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.updateUser(userId, updateData);

      expect(userRepository.update).toHaveBeenCalledWith(userId, updateData);
      expect(result.data.isActive).toBe(false);
    });
  });

  describe("deleteUser", () => {
    it("should delete a user successfully", async () => {
      const userId = "user-123";

      const mockResponse = {
        success: true,
        message: "Deleted successfully",
      };

      (userRepository.delete as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.deleteUser(userId);

      expect(userRepository.delete).toHaveBeenCalledWith(userId);
      expect(result.success).toBe(true);
      expect(result.message).toBe("Deleted successfully");
    });
  });

  describe("getAllUsers", () => {
    it("should return all users with default params", async () => {
      const mockUsers: User[] = [
        {
          id: "user-1",
          username: "johndoe",
          password: "hashedpassword123",
          microsoftId: null,
          role: "USER",
          isActive: true,
          lastLogin: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "user-2",
          username: "janesmith",
          password: "hashedpassword456",
          microsoftId: null,
          role: "ADMIN",
          isActive: true,
          lastLogin: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockResponse = {
        success: true,
        data: mockUsers,
        meta: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
        },
      };

      (userRepository.getAll as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.getAllUsers();

      expect(userRepository.getAll).toHaveBeenCalledWith(undefined);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].username).toBe("johndoe");
      expect(result.data[1].username).toBe("janesmith");
      expect(result.meta.total).toBe(2);
    });

    it("should return filtered users with query params", async () => {
      const queryParams = {
        filter: { isActive: true },
        page: 1,
        pageSize: 10,
      };

      const mockUsers: User[] = [
        {
          id: "user-2",
          username: "janesmith",
          password: "hashedpassword456",
          microsoftId: null,
          role: "ADMIN",
          isActive: true,
          lastLogin: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockResponse = {
        success: true,
        data: mockUsers,
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      (userRepository.getAll as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.getAllUsers(queryParams);

      expect(userRepository.getAll).toHaveBeenCalledWith(queryParams);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].isActive).toBe(true);
    });
  });

  describe("getUserById", () => {
    it("should return a single user by id", async () => {
      const userId = "user-123";
      const mockUser: User = {
        id: userId,
        username: "johndoe",
        password: "hashedpassword123",
        microsoftId: null,
        role: "USER",
        isActive: true,
        lastLogin: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockResponse = {
        success: true,
        data: mockUser,
      };

      (userRepository.getById as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.getUserById(userId);

      expect(userRepository.getById).toHaveBeenCalledWith(userId, undefined);
      expect(result.data.id).toBe(userId);
      expect(result.data.username).toBe("johndoe");
    });

    it("should return null when user not found", async () => {
      const userId = "non-existent-id";

      const mockResponse = {
        success: true,
        data: null,
      };

      (userRepository.getById as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.getUserById(userId);

      expect(userRepository.getById).toHaveBeenCalledWith(userId, undefined);
      expect(result.data).toBeNull();
    });
  });
});
