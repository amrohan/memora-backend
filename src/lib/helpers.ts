import crypto from "crypto";

/**
 * Generates a random alphanumeric access code
 * @param {number} length - Length of the code (default: 6)
 * @returns {string} - Uppercase alphanumeric access code
 */
export function generateAccessCode(length: number = 6): string {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    result += chars[randomIndex];
  }

  return result;
}
