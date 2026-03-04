import { describe, it, expect, vi } from 'vitest';

// We just need to mock db so that auth-utils doesn't try to instantiate PrismaClient
vi.mock('@/lib/db', () => ({
  db: {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
    }
  }
}));

import {
  verifyPassword,
  hashPassword,
  createUser,
  validateCredentials,
  hasPermission,
  generateDefaultPassword
} from '@/lib/auth-utils';
import { db } from '@/lib/db';

describe('auth-utils', () => {
  describe('verifyPassword', () => {
    it('should return true for matching password and hash', async () => {
      const password = 'mySecretPassword123';
      const hashedPassword = await hashPassword(password);

      const result = await verifyPassword(password, hashedPassword);

      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'mySecretPassword123';
      const wrongPassword = 'wrongPassword456';
      const hashedPassword = await hashPassword(password);

      const result = await verifyPassword(wrongPassword, hashedPassword);

      expect(result).toBe(false);
    });

    it('should handle empty password gracefully', async () => {
      const password = 'mySecretPassword123';
      const hashedPassword = await hashPassword(password);

      const result = await verifyPassword('', hashedPassword);

      expect(result).toBe(false);
    });
  });

  describe('createUser', () => {
    it('should create a user with hashed password and return safe fields', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'EMPLEADO'
      });

      (db.user.create as any) = mockCreate;

      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'securePassword123'
      };

      const result = await createUser(userData);

      expect(mockCreate).toHaveBeenCalledTimes(1);

      // Check that create was called with hashed password, not plain text
      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.data.password).not.toBe(userData.password);
      expect(typeof callArgs.data.password).toBe('string');
      expect(callArgs.data.password.length).toBeGreaterThan(20); // bcrypt hashes are typically ~60 chars

      expect(result).toEqual({
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'EMPLEADO'
      });
    });
  });

  describe('validateCredentials', () => {
    it('should return safe user fields for valid credentials', async () => {
      const password = 'validPassword123';
      const hashedPassword = await hashPassword(password);

      const mockFindUnique = vi.fn().mockResolvedValue({
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        role: 'EMPLEADO',
        active: true
      });

      (db.user.findUnique as any) = mockFindUnique;

      const result = await validateCredentials('test@example.com', password);

      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: {
          id: true,
          name: true,
          email: true,
          password: true,
          role: true,
          active: true,
        }
      });

      expect(result).toEqual({
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'EMPLEADO'
      });
    });

    it('should return null for invalid password', async () => {
      const password = 'validPassword123';
      const wrongPassword = 'wrongPassword456';
      const hashedPassword = await hashPassword(password);

      const mockFindUnique = vi.fn().mockResolvedValue({
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        role: 'EMPLEADO',
        active: true
      });

      (db.user.findUnique as any) = mockFindUnique;

      const result = await validateCredentials('test@example.com', wrongPassword);

      expect(result).toBeNull();
    });

    it('should return null for inactive user', async () => {
      const mockFindUnique = vi.fn().mockResolvedValue({
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        password: 'someHashedPassword',
        role: 'EMPLEADO',
        active: false // Inactive user
      });

      (db.user.findUnique as any) = mockFindUnique;

      const result = await validateCredentials('test@example.com', 'anyPassword');

      expect(result).toBeNull();
    });

    it('should return null for non-existent user', async () => {
      const mockFindUnique = vi.fn().mockResolvedValue(null);

      (db.user.findUnique as any) = mockFindUnique;

      const result = await validateCredentials('nonexistent@example.com', 'anyPassword');

      expect(result).toBeNull();
    });
  });

  describe('rolePermissions', () => {
    it('hasPermission should return correct boolean based on role and permission', () => {
      // EMPLEADORA should have all permissions
      expect(hasPermission('EMPLEADORA', 'canManageUsers')).toBe(true);
      expect(hasPermission('EMPLEADORA', 'canDeleteClients')).toBe(true);

      // EMPLEADO has restricted permissions
      expect(hasPermission('EMPLEADO', 'canManageClients')).toBe(true);
      expect(hasPermission('EMPLEADO', 'canManageUsers')).toBe(false);
      expect(hasPermission('EMPLEADO', 'canDeleteClients')).toBe(false);
    });
  });

  describe('generateDefaultPassword', () => {
    it('should generate an 8-character password', () => {
      const password = generateDefaultPassword();

      expect(typeof password).toBe('string');
      expect(password.length).toBe(8);
    });

    it('should generate random passwords', () => {
      const password1 = generateDefaultPassword();
      const password2 = generateDefaultPassword();

      // It's statistically very improbable they are the same
      expect(password1).not.toBe(password2);
    });
  });
});
