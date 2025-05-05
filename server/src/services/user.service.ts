import axios from "axios";
import { Op, literal } from "sequelize";

import { __prod__, env } from "@/config/env";
import { AppError } from "@/middleware/error-handler";
import User from "@/models/user";
import { error } from "@/utils/logger";
import {
  ICreateUserDTO,
  IUpdateUserDTO,
  IUserService,
  IQueryParams,
  IMicrosoftUser,
  ISyncResult,
  IMachineState,
} from "@/utils/types";
import {
  buildOrderClause,
  buildPaginationOptions,
  buildWhereClause,
} from "@/utils";

class UserService implements IUserService {
  private static readonly BLOCKED_EMAILS = [
    "ads@cpec.com",
    "coemotion@cpec.com",
    "ipad@cpec.com",
    "paris.l@cpec.com",
    "rpasuit@cpec.com",
    "wchilladmin@cpec.com",
    "webforms@cpec.com",
    "OutForProcessing@cpec.com",
  ];
  private static readonly TOKEN_EXPIRY = 3500000;
  private static readonly MS_GRAPH_API = "https://graph.microsoft.com/v1.0";

  private tokenCache: { token: string; expiresAt: number } | null = null;

  constructor(
    private readonly tenantId = env.AZURE_TENANT_ID,
    private readonly clientId = env.AZURE_CLIENT_ID,
    private readonly clientSecret = env.AZURE_CLIENT_SECRET
  ) {}

  async initialize(): Promise<void> {
    const userCount = (await this.getUsers()).length;
    if (userCount === 0) {
      await this.syncMicrosoftUsers();
    }
  }

  async createUser(data: ICreateUserDTO): Promise<User> {
    await this.validateUserData(data);
    const user = await User.create(data);
    return user.reload();
  }

  async getUsers(params?: IQueryParams): Promise<User[]> {
    const searchableFields = ["name", "email"];

    const queryOptions = {
      where: buildWhereClause(params, searchableFields),
      order: buildOrderClause(params),
      ...buildPaginationOptions(params),
    };

    return User.findAll(queryOptions);
  }

  async getReportSubscribers(): Promise<User[]> {
    return User.findAll({ where: { receivesReports: true } });
  }

  async getUserById(id: string): Promise<User> {
    if (!id) throw new AppError(400, "User ID is required");

    const user = await User.findByPk(id);
    if (!user) throw new AppError(404, "User not found");

    return user;
  }

  async getUserByMicrosoftId(microsoftId: string): Promise<User> {
    if (!microsoftId) throw new AppError(400, "Microsoft ID is required");

    const user = await User.findOne({ where: { microsoftId } });
    if (!user) throw new AppError(404, "User not found");

    return user;
  }

  async updateUser(id: string, data: IUpdateUserDTO): Promise<User> {
    const user = await this.getUserById(id);
    const updates = { ...data };

    if (updates.role === "user") {
      updates.receivesReports = false;
    }

    if (Object.keys(updates).length > 0) {
      await user.update(updates);
    }

    return user.reload();
  }

  async syncMicrosoftUsers(): Promise<ISyncResult> {
    const result: ISyncResult = {
      success: { created: [], updated: [], destroyed: [] },
      failures: [],
    };

    try {
      const [microsoftUsers, existingUsers] = await Promise.all([
        this.getMicrosoftUsers(),
        User.findAll(),
      ]);

      await this.processMicrosoftUsers(microsoftUsers, existingUsers, result);
      await this.processDeletedUsers(microsoftUsers, existingUsers, result);

      return result;
    } catch (err) {
      error(`Sync failed: ${err}`);
      throw new AppError(500, "Failed to sync Microsoft users");
    }
  }

  private async validateUserData(data: ICreateUserDTO): Promise<void> {
    const { microsoftId, email, name } = data;

    if (name.length < 2) {
      throw new AppError(400, "Name must be at least 2 characters long");
    }

    if (!email.includes("@")) {
      throw new AppError(400, "Invalid email format");
    }

    const existingUser = await User.findOne({ where: { microsoftId } });
    if (existingUser) {
      throw new AppError(400, "User with this Microsoft ID already exists");
    }
  }

  private async generateMicrosoftToken() {
    if (this.tokenCache && Date.now() < this.tokenCache.expiresAt) {
      return this.tokenCache.token;
    }

    const tokenUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;

    try {
      const params = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      });

      const response = await axios.post(tokenUrl, params);

      this.tokenCache = {
        token: response.data.access_token,
        expiresAt: Date.now() + 3500000,
      };

      return response.data.access_token;
    } catch (error) {
      throw new Error("Failed to generate token");
    }
  }

  private isUserBlocked(microsoftUser: IMicrosoftUser): boolean {
    return UserService.BLOCKED_EMAILS.includes(microsoftUser.mail);
  }

  private async getMicrosoftUsers() {
    try {
      const allUsers = [];
      let url =
        "https://graph.microsoft.com/v1.0/users?$select=id,mail,displayName,givenName,surname,jobTitle,department";

      while (url) {
        const token = await this.generateMicrosoftToken();
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000,
        });

        allUsers.push(...response.data.value);

        url = response.data["@odata.nextLink"] || null;
      }

      return allUsers;
    } catch (error) {
      const errorMessage =
        error.response?.data?.error?.message || error.message;
      throw new Error(`Failed to fetch Microsoft users: ${errorMessage}`);
    }
  }

  private async processMicrosoftUsers(
    microsoftUsers: IMicrosoftUser[],
    existingUsers: User[],
    result: ISyncResult
  ) {
    for (const microsoftUser of microsoftUsers) {
      if (
        !existingUsers.find((user) => user.microsoftId === microsoftUser.id)
      ) {
        try {
          const isBlocked = this.isUserBlocked(microsoftUser);

          if (isBlocked) {
            continue;
          }

          const isAdmin = microsoftUser.department === "MIS";

          const userData = {
            microsoftId: microsoftUser.id,
            name: `${microsoftUser.givenName} ${microsoftUser.surname}`,
            email: microsoftUser.mail,
            department: microsoftUser.department,
            role: isAdmin ? "admin" : "user",
            isActive: isAdmin ? true : false,
            receivesReports: false,
          };

          await User.create(userData);
          result.success.created.push(microsoftUser.id);
        } catch (err) {
          result.failures.push({
            userId: microsoftUser.id,
            user: microsoftUser,
            operation: "create",
            error: err.message,
          });
        }
      }
    }
  }

  private async processDeletedUsers(
    microsoftUsers: IMicrosoftUser[],
    existingUsers: User[],
    result: ISyncResult
  ) {
    for (const existingUser of existingUsers) {
      if (
        !microsoftUsers.find(
          (microsoftUser) => microsoftUser.id === existingUser.microsoftId
        )
      ) {
        try {
          await User.destroy({
            where: { id: existingUser.id },
          });

          result.success.destroyed.push(existingUser.id);
        } catch (err) {
          result.failures.push({
            userId: existingUser.id,
            operation: "archive",
            error: err.message,
          });
        }
      }
    }
  }
}

export default UserService;
