import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '@/lib/auth-utils'

describe('auth-utils', () => {
  describe('hashPassword', () => {
    it('should hash a password and return a string', async () => {
      const password = 'mySuperSecretPassword123!'
      const hashedPassword = await hashPassword(password)

      expect(typeof hashedPassword).toBe('string')
      expect(hashedPassword.length).toBeGreaterThan(0)
    })

    it('should not return the original password', async () => {
      const password = 'mySuperSecretPassword123!'
      const hashedPassword = await hashPassword(password)

      expect(hashedPassword).not.toBe(password)
    })

    it('should generate a valid hash that can be verified', async () => {
      const password = 'mySuperSecretPassword123!'
      const hashedPassword = await hashPassword(password)

      const isValid = await verifyPassword(password, hashedPassword)
      expect(isValid).toBe(true)
    })

    it('should generate different hashes for the same password', async () => {
      // bcrypt includes a random salt, so hashing the same password twice
      // should produce different results
      const password = 'mySuperSecretPassword123!'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      expect(hash1).not.toBe(hash2)
    })
  })
})
