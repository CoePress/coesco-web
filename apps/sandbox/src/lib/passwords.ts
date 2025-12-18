import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const CREDENTIALS_FILE = path.join(__dirname, "../../.generated-credentials.json");

interface GeneratedCredential {
  email: string;
  password: string;
  generatedAt: string;
}

export function generatePassword(length = 12): string {
  const chars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
  const bytes = crypto.randomBytes(length);
  let password = "";

  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }

  return password;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function generateAndHashPassword(): Promise<{ plain: string; hash: string }> {
  const plain = generatePassword();
  const hash = await hashPassword(plain);
  return { plain, hash };
}

export function saveCredential(email: string, password: string): void {
  let credentials: GeneratedCredential[] = [];

  if (fs.existsSync(CREDENTIALS_FILE)) {
    try {
      credentials = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, "utf-8"));
    }
    catch {
      credentials = [];
    }
  }

  const existing = credentials.findIndex(c => c.email === email);
  const entry: GeneratedCredential = {
    email,
    password,
    generatedAt: new Date().toISOString(),
  };

  if (existing >= 0) {
    credentials[existing] = entry;
  }
  else {
    credentials.push(entry);
  }

  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(credentials, null, 2));
}

export function getCredentials(): GeneratedCredential[] {
  if (!fs.existsSync(CREDENTIALS_FILE)) {
    return [];
  }

  try {
    return JSON.parse(fs.readFileSync(CREDENTIALS_FILE, "utf-8"));
  }
  catch {
    return [];
  }
}
