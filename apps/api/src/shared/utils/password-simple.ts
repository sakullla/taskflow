// 简化版密码处理 - 生产环境应使用 bcrypt
import { createHash, randomBytes } from "node:crypto";

export async function hashPassword(password: string): Promise<string> {
  // 生成随机盐
  const salt = randomBytes(16).toString("hex");
  // SHA256 哈希 (仅用于演示，生产环境请使用 bcrypt)
  const hash = createHash("sha256")
    .update(password + salt)
    .digest("hex");
  return `${salt}:${hash}`;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, originalHash] = hash.split(":");
  if (!salt || !originalHash) return false;

  const computedHash = createHash("sha256")
    .update(password + salt)
    .digest("hex");

  return computedHash === originalHash;
}
