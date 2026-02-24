import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";

const BCRYPT_ROUNDS = 12;

function isBcryptHash(hash: string): boolean {
  return /^\$2[aby]\$/.test(hash);
}

function verifyLegacyPassword(password: string, hash: string): boolean {
  const [salt, originalHash] = hash.split(":");
  if (!salt || !originalHash) return false;

  const computedHash = createHash("sha256")
    .update(password + salt)
    .digest("hex");

  return computedHash === originalHash;
}

export function isLegacyPasswordHash(hash: string): boolean {
  return !isBcryptHash(hash);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (isBcryptHash(hash)) {
    return bcrypt.compare(password, hash);
  }

  return verifyLegacyPassword(password, hash);
}
