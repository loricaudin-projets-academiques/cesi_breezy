import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

async function hashPassword(password) {
  return bcrypt.hash(String(password), SALT_ROUNDS);
}

async function verifyPassword(password, storedHash) {
  if (!storedHash) return false;
  return bcrypt.compare(String(password), storedHash);
}

export { hashPassword, verifyPassword };
