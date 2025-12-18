import crypto from "node:crypto";

import env from "./env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

class EncryptionService {
  private key: Buffer;

  constructor() {
    this.key = crypto.scryptSync(env.GRAPH_ENCRYPTION_KEY, "salt", 32);
  }

  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);

    let encrypted = cipher.update(plaintext, "utf8", "base64");
    encrypted += cipher.final("base64");

    const authTag = cipher.getAuthTag();

    return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
  }

  decrypt(ciphertext: string): string {
    const [ivB64, authTagB64, encryptedB64] = ciphertext.split(":");

    const iv = Buffer.from(ivB64, "base64");
    const authTag = Buffer.from(authTagB64, "base64");
    const encrypted = Buffer.from(encryptedB64, "base64");

    const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString("utf8");
  }
}

export const encryptionService = new EncryptionService();
