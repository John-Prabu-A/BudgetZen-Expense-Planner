import * as bcrypt from 'bcryptjs';
import SecureStorageManager from '../storage/secureStorageManager';

/**
 * SecurePasswordManager - Handles secure password/passcode storage and verification
 * with protection against brute force attacks and timing attacks
 */
class SecurePasswordManager {
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
  private readonly MIN_PASSCODE_LENGTH = 4;
  private readonly MIN_PASSWORD_LENGTH = 6;
  private readonly BCRYPT_ROUNDS = 10;

  /**
   * Hash a password/passcode using bcrypt
   * bcrypt is specifically designed for password hashing with built-in salting
   */
  async hashPassword(password: string): Promise<string> {
    if (!password || password.length === 0) {
      throw new Error('Password cannot be empty');
    }

    try {
      // bcrypt automatically handles salt generation and combines it with the hash
      const hash = await bcrypt.hash(password, this.BCRYPT_ROUNDS);
      return hash;
    } catch (error) {
      console.error('Error hashing password:', error);
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Verify a password/passcode using constant-time comparison
   * Protects against timing attacks
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) {
      return false;
    }

    try {
      // bcrypt.compare handles constant-time comparison internally
      const isValid = await bcrypt.compare(password, hash);
      return isValid;
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   * (bcrypt handles this internally, but kept for reference)
   */
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }

  /**
   * Validate passcode format and length
   */
  validatePasscode(passcode: string, length: 4 | 6 = 4): boolean {
    if (!passcode) return false;

    // Check if it's only digits
    if (!/^\d+$/.test(passcode)) {
      return false;
    }

    // Check minimum length
    if (passcode.length < this.MIN_PASSCODE_LENGTH) {
      return false;
    }

    // Check exact length if specified
    if (passcode.length !== length) {
      return false;
    }

    return true;
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!password) {
      errors.push('Password cannot be empty');
      return { isValid: false, errors };
    }

    if (password.length < this.MIN_PASSWORD_LENGTH) {
      errors.push(`Password must be at least ${this.MIN_PASSWORD_LENGTH} characters`);
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain lowercase letters');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain uppercase letters');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain numbers');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain special characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Record a failed authentication attempt
   * Returns true if locked out
   */
  async recordFailedAttempt(username: string): Promise<boolean> {
    try {
      const key = `failed_attempts_${username}`;
      const data = await SecureStorageManager.getItem(key);

      let attempts = data ? JSON.parse(data) : { count: 0, timestamp: 0 };

      // Check if still in lockout period
      const now = Date.now();
      if (now - attempts.timestamp < this.LOCKOUT_DURATION_MS) {
        // Still in lockout
        if (attempts.count >= this.MAX_FAILED_ATTEMPTS) {
          return true; // Locked out
        }
      } else {
        // Lockout expired, reset
        attempts = { count: 0, timestamp: now };
      }

      // Increment count and update timestamp
      attempts.count++;
      attempts.timestamp = now;

      await SecureStorageManager.setItem(key, JSON.stringify(attempts));

      return attempts.count >= this.MAX_FAILED_ATTEMPTS;
    } catch (error) {
      console.error('Error recording failed attempt:', error);
      return false;
    }
  }

  /**
   * Clear failed attempts for a user
   */
  async clearFailedAttempts(username: string): Promise<void> {
    try {
      const key = `failed_attempts_${username}`;
      await SecureStorageManager.deleteItem(key);
    } catch (error) {
      console.error('Error clearing failed attempts:', error);
    }
  }

  /**
   * Get remaining lockout time in seconds
   */
  async getRemainingLockoutTime(username: string): Promise<number> {
    try {
      const key = `failed_attempts_${username}`;
      const data = await SecureStorageManager.getItem(key);

      if (!data) return 0;

      const attempts = JSON.parse(data);
      const now = Date.now();
      const elapsed = now - attempts.timestamp;
      const remaining = Math.max(0, this.LOCKOUT_DURATION_MS - elapsed);

      return Math.ceil(remaining / 1000); // Return in seconds
    } catch (error) {
      console.error('Error getting lockout time:', error);
      return 0;
    }
  }

  /**
   * Check if account is currently locked out
   */
  async isLockedOut(username: string): Promise<boolean> {
    try {
      const key = `failed_attempts_${username}`;
      const data = await SecureStorageManager.getItem(key);

      if (!data) return false;

      const attempts = JSON.parse(data);
      const now = Date.now();

      // Check if still in lockout period and has exceeded max attempts
      if (
        attempts.count >= this.MAX_FAILED_ATTEMPTS &&
        now - attempts.timestamp < this.LOCKOUT_DURATION_MS
      ) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking lockout status:', error);
      return false;
    }
  }
}

export default new SecurePasswordManager();
