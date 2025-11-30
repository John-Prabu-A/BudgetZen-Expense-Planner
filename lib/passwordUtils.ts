// @ts-ignore
import CryptoJS from 'crypto-js';

/**
 * Hash a password using SHA256 (one-way hash)
 * @param password - The password to hash
 * @returns The hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    // Use SHA256 hash which is one-way and secure for storing passwords
    // Combined with a salt for extra security
    const salt = 'budgetzen_salt_2024'; // In production, this should be per-user
    const hashedPassword = CryptoJS.SHA256(password + salt).toString();
    return hashedPassword;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
};

/**
 * Verify a password against its hash
 * @param password - The password to verify
 * @param storedHash - The stored hash
 * @returns True if password matches hash, false otherwise
 */
export const verifyPassword = async (password: string, storedHash: string): Promise<boolean> => {
  try {
    const salt = 'budgetzen_salt_2024'; // Must match the salt used during hashing
    const passwordHash = CryptoJS.SHA256(password + salt).toString();
    return passwordHash === storedHash;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
};

/**
 * Validate password strength
 * @param password - The password to validate
 * @returns Object with validation result and error message if any
 */
export const validatePasswordStrength = (password: string): { valid: boolean; error?: string } => {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters long' };
  }

  if (password.length > 50) {
    return { valid: false, error: 'Password must not exceed 50 characters' };
  }

  // Check for complexity
  const hasNumber = /\d/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);

  if (!hasNumber || !hasLetter) {
    return { valid: false, error: 'Password must contain both letters and numbers' };
  }

  return { valid: true };
};
