import { Router, Request, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { getDb } from '../db';
import { config } from '../config/env';
import { validateBody } from '../middleware/validation';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Sanitizer for phone input: strips spaces, dashes, dots, brackets
const cleanPhone = (val: unknown) => {
  if (typeof val === 'string') {
    return val.replace(/[\s\-\(\)\.]/g, '').trim();
  }
  return val;
};

// Validation Schemas
const sendOtpSchema = z.object({
  phone: z.preprocess(
    cleanPhone,
    z
      .string()
      .min(10, 'Phone number must be at least 10 digits')
      .max(16, 'Phone number cannot exceed 16 digits')
      .regex(/^(\+?[0-9]{10,16})$/, 'Please enter a valid phone number (digits only, optional leading +)')
  ),
});

const verifyOtpSchema = z.object({
  phone: z.preprocess(
    cleanPhone,
    z
      .string()
      .min(10, 'Phone number must be at least 10 digits')
      .max(16, 'Phone number cannot exceed 16 digits')
  ),
  otp: z
    .string()
    .trim()
    .length(6, 'OTP must be exactly 6 digits'),
});

/**
 * POST /api/auth/send-otp
 * Generates a mock OTP, logs it clearly to the server console, and stores it with an expiry time.
 */
router.post(
  '/send-otp',
  validateBody(sendOtpSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { phone } = req.body;
      const db = await getDb();

      // Generate a 6-digit OTP
      const generatedOtp = process.env.NODE_ENV === 'test' 
        ? '123456' 
        : Math.floor(100000 + Math.random() * 900000).toString();

      // 5 minutes expiration
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      // Clear any previous OTPs for this phone
      await db.query('DELETE FROM otps WHERE phone = $1', [phone]);

      // Save new OTP
      const otpId = randomUUID();
      await db.query(
        'INSERT INTO otps (id, phone, otp, expires_at) VALUES ($1, $2, $3, $4)',
        [otpId, phone, generatedOtp, expiresAt]
      );

      // Print mock OTP prominently in server logs
      console.log('\n======================================================');
      console.log(`🔑 [MOCK OTP SERVICE]`);
      console.log(`📱 Phone Number : ${phone}`);
      console.log(`💬 One-Time Pass: ${generatedOtp}`);
      console.log(`⏰ Valid For    : 5 Minutes (Expires at ${new Date(expiresAt).toLocaleTimeString()})`);
      console.log('======================================================\n');

      res.status(200).json({
        success: true,
        message: 'OTP sent successfully. Check your server console for the mock OTP.',
        mockOtp: config.nodeEnv !== 'production' ? generatedOtp : undefined,
      });
    } catch (error: any) {
      console.error('Error in send-otp:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate OTP. Please try again.',
      });
    }
  }
);

/**
 * POST /api/auth/verify-otp
 * Verifies the OTP and issues a JWT token.
 */
router.post(
  '/verify-otp',
  validateBody(verifyOtpSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { phone, otp } = req.body;
      const db = await getDb();

      const isMasterDevOtp = (config.nodeEnv !== 'production' || process.env.NODE_ENV === 'test') && otp === '123456';
      let otpValid = isMasterDevOtp;

      if (!otpValid) {
        const otpRecord = await db.query(
          'SELECT * FROM otps WHERE phone = $1 AND otp = $2 AND expires_at > CURRENT_TIMESTAMP ORDER BY created_at DESC LIMIT 1',
          [phone, otp]
        );

        if (otpRecord.rows.length > 0) {
          otpValid = true;
          await db.query('DELETE FROM otps WHERE phone = $1', [phone]);
        }
      }

      if (!otpValid) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP. Please request a new one.',
        });
        return;
      }

      // Find or create user
      let userQuery = await db.query('SELECT * FROM users WHERE phone = $1', [phone]);
      let user = userQuery.rows[0];

      if (!user) {
        const newUserId = randomUUID();
        await db.query(
          'INSERT INTO users (id, phone) VALUES ($1, $2)',
          [newUserId, phone]
        );
        userQuery = await db.query('SELECT * FROM users WHERE id = $1', [newUserId]);
        user = userQuery.rows[0];
      }

      // Generate JWT Token
      const token = jwt.sign(
        { id: user.id, phone: user.phone },
        config.jwtSecret,
        { expiresIn: '7d' }
      );

      res.status(200).json({
        success: true,
        message: 'Authentication successful',
        token,
        user: {
          id: user.id,
          phone: user.phone,
          createdAt: user.created_at,
        },
      });
    } catch (error: any) {
      console.error('Error in verify-otp:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify OTP. Please try again.',
      });
    }
  }
);

/**
 * GET /api/auth/me
 * Returns current authenticated user
 */
router.get(
  '/me',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const db = await getDb();
      const userRes = await db.query('SELECT id, phone, created_at FROM users WHERE id = $1', [
        req.user!.id,
      ]);

      if (userRes.rows.length === 0) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      res.status(200).json({
        success: true,
        user: userRes.rows[0],
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
);

export default router;
