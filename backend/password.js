// 提供密碼雜湊與密碼驗證函式

const { randomBytes, scryptSync, timingSafeEqual } = require("node:crypto");

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");

  const hash = scryptSync(password, salt, 64).toString("hex");

  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const parts = storedHash.split(":");
  const savedSalt = parts[0];
  const savedHash = parts[1];

  const recalculatedHash = scryptSync(password, savedSalt, 64);

  const expectedHash = Buffer.from(savedHash, "hex");

  if (recalculatedHash.length !== expectedHash.length) {
    return false;
  }

  return timingSafeEqual(recalculatedHash, expectedHash);
}

module.exports = { hashPassword, verifyPassword };
