import {
  IAuthResponse,
  IAuthTokens,
  UserType,
  IAuthService,
} from "@/types/auth.types";
import { IEmployee } from "@/types/schema.types";
import { sign, verify } from "jsonwebtoken";
import { config } from "@/config/config";
import { UnauthorizedError } from "@/middleware/error.middleware";
import { compare } from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { ConfidentialClientApplication } from "@azure/msal-node";
import Auth from "@/models/auth";
import Employee from "@/models/employee";
import { SignOptions } from "jsonwebtoken";
import { EmployeeStatus } from "@/types/schema.types";

type AuthWithEmployee = Auth & {
  employee: Employee;
};

export class AuthService implements IAuthService {
  private generateTokens(userId: string): IAuthTokens {
    const token = sign(
      { userId, userType: UserType.EMPLOYEE },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as SignOptions
    );

    const refreshToken = sign(
      { userId, userType: UserType.EMPLOYEE },
      config.jwt.secret,
      { expiresIn: config.jwt.refreshExpiresIn } as SignOptions
    );

    return { token, refreshToken };
  }

  async login(email: string, password: string): Promise<IAuthResponse> {
    if (!email || !password) {
      throw new UnauthorizedError("Email and password are required");
    }

    const auth = (await Auth.findOne({
      where: { email },
      include: [{ model: Employee, as: "employee" }],
    })) as AuthWithEmployee;

    if (!auth || !auth.isActive) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const isValidPassword = await compare(password, auth.password);
    if (!isValidPassword) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const { token, refreshToken } = this.generateTokens(auth.userId);

    await auth.update({
      lastLogin: new Date(),
      refreshToken,
    });

    return {
      token,
      refreshToken,
      userType: UserType.EMPLOYEE,
      user: auth.employee as unknown as IEmployee,
    };
  }

  async loginWithMicrosoft(): Promise<string> {
    const sessionId = uuidv4();
    return (
      `https://login.microsoftonline.com/${config.azure.tenantId}/oauth2/v2.0/authorize?` +
      `client_id=${config.azure.clientId}&` +
      `response_type=code&` +
      `redirect_uri=${config.azure.redirectUri}&` +
      `response_mode=query&` +
      `scope=openid profile email&` +
      `state=${sessionId}`
    );
  }

  async callback(code: string, sessionId: string): Promise<IAuthResponse> {
    if (!code || !sessionId) {
      throw new UnauthorizedError("Code and session ID are required");
    }

    const msalConfig = {
      auth: {
        clientId: config.azure.clientId,
        clientSecret: config.azure.clientSecret,
        authority: `https://login.microsoftonline.com/${config.azure.tenantId}`,
      },
    };

    const msalClient = new ConfidentialClientApplication(msalConfig);
    const tokenResponse = await msalClient.acquireTokenByCode({
      code,
      redirectUri: config.azure.redirectUri,
      scopes: ["openid", "profile", "email"],
    });

    if (!tokenResponse) {
      throw new UnauthorizedError("Failed to acquire token");
    }

    const userInfo = await this.getMicrosoftUserInfo(tokenResponse.accessToken);

    const auth = (await Auth.findOne({
      where: { microsoftId: userInfo.id },
      include: [{ model: Employee, as: "employee" }],
    })) as AuthWithEmployee;

    if (!auth) {
      throw new UnauthorizedError("No account found for this Microsoft user");
    }

    const { token, refreshToken } = this.generateTokens(auth.userId);

    await auth.update({
      lastLogin: new Date(),
      refreshToken,
    });

    return {
      token,
      refreshToken,
      userType: UserType.EMPLOYEE,
      user: auth.employee as unknown as IEmployee,
    };
  }

  async logout(refreshToken: string): Promise<IAuthResponse> {
    if (!refreshToken) {
      throw new UnauthorizedError("Refresh token is required");
    }

    const decoded = verify(refreshToken, config.jwt.secret) as {
      userId: string;
    };
    await Auth.update(
      { refreshToken: "" },
      { where: { userId: decoded.userId } }
    );
    return {} as IAuthResponse;
  }

  async session(
    sessionId: string,
    authSession: string
  ): Promise<IAuthResponse> {
    if (!sessionId || !authSession) {
      throw new UnauthorizedError("Session ID and auth session are required");
    }

    const decoded = verify(sessionId, config.jwt.secret) as { userId: string };

    const auth = (await Auth.findOne({
      where: {
        userId: decoded.userId,
        refreshToken: authSession,
      },
      include: [{ model: Employee, as: "employee" }],
    })) as AuthWithEmployee;

    if (!auth || !auth.isActive) {
      throw new UnauthorizedError("Invalid session");
    }

    const { token, refreshToken: newRefreshToken } = this.generateTokens(
      auth.userId
    );

    await auth.update({ refreshToken: newRefreshToken });

    return {
      token,
      refreshToken: newRefreshToken,
      userType: UserType.EMPLOYEE,
      user: auth.employee as unknown as IEmployee,
    };
  }

  private async getMicrosoftUserInfo(accessToken: string) {
    const response = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new UnauthorizedError("Failed to get user info from Microsoft");
    }

    return response.json();
  }

  async testLogin(): Promise<IAuthResponse> {
    let testEmployee = await Employee.findOne({
      where: { email: "test@example.com" },
    });

    if (!testEmployee) {
      testEmployee = await Employee.create({
        id: uuidv4(),
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        role: "Test Role",
        jobTitle: "Test Job",
        status: EmployeeStatus.ACTIVE,
        departmentIds: [],
      });
    }

    let auth = await Auth.findOne({
      where: { email: "test@example.com" },
    });

    if (!auth) {
      auth = await Auth.create({
        id: uuidv4(),
        email: "test@example.com",
        password: "",
        userId: testEmployee.id,
        userType: UserType.EMPLOYEE,
        isActive: true,
        isVerified: true,
        refreshToken: "",
      });
    }

    const { token, refreshToken } = this.generateTokens(testEmployee.id);

    await auth.update({ refreshToken });

    return {
      token,
      refreshToken,
      userType: UserType.EMPLOYEE,
      user: testEmployee as unknown as IEmployee,
    };
  }
}
