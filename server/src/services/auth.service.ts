import { IAuthResponse } from "@/types/schema.types";
import { IAuthService } from "@/types/service.types";

export class AuthService implements IAuthService {
  async login(email: string, password: string): Promise<IAuthResponse> {
    return Promise.resolve({} as IAuthResponse);
  }

  async loginWithMicrosoft(): Promise<IAuthResponse> {
    return Promise.resolve({} as IAuthResponse);
  }

  async callback(code: string, sessionId: string): Promise<IAuthResponse> {
    return Promise.resolve({} as IAuthResponse);
  }

  async logout(sessionId: string): Promise<IAuthResponse> {
    return Promise.resolve({} as IAuthResponse);
  }

  async session(
    sessionId: string,
    authSession: string
  ): Promise<IAuthResponse> {
    return Promise.resolve({} as IAuthResponse);
  }
}
