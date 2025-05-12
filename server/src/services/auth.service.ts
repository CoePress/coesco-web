export class AuthService {
  async verifyTokens(
    accessToken: string,
    refreshToken: string
  ): Promise<boolean> {
    return Promise.resolve(true);
  }
}
