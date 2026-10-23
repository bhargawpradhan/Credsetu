import { Router, Response } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { getDb } from '../db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { uploadReceipt } from '../middleware/upload';

const router = Router();

// Validation schema for creating a loan
const createLoanSchema = z.object({
  friendName: z
    .string()
    .trim()
    .min(1, 'Friend name is required')
    .max(100, 'Friend name cannot exceed 100 characters'),
  amount: z.coerce
    .number()
    .positive('Amount must be greater than 0')
    .max(100000000, 'Amount exceeds maximum permitted limit'),
  dueDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format'),
  notes: z.string().trim().max(500, 'Notes cannot exceed 500 characters').optional().nullable(),
});

/**
 * Format loan object helper:
 * Converts db row columns and computes isOverdue dynamically
 */
export function formatLoanRow(row: any) {
  const amount = parseFloat(row.amount);
  
  // Format due_date cleanly as YYYY-MM-DD
  let dueDateStr = '';
  if (row.due_date instanceof Date) {
    dueDateStr = row.due_date.toISOString().split('T')[0];
  } else if (typeof row.due_date === 'string') {
    dueDateStr = row.due_date.split('T')[0];
  }

  // Calculate if loan is overdue:
  // Overdue if NOT repaid AND due_date is strictly before today's date (local/UTC date comparison)
  const todayStr = new Date().toISOString().split('T')[0];
  const isOverdue = !row.is_repaid && dueDateStr < todayStr;

  return {
    id: row.id,
    userId: row.user_id,
    friendName: row.friend_name,
    amount: amount,
    dueDate: dueDateStr,
    isRepaid: Boolean(row.is_repaid),
    repaidAt: row.repaid_at || null,
    receiptUrl: row.receipt_url || null,
    notes: row.notes || null,
    isOverdue,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * GET /api/loans
 * Query params: status (all | active | overdue | repaid), search, sort
 */
router.get(
  '/',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { status = 'all', search = '', sort = 'due_date_asc' } = req.query;

      const db = await getDb();
      let query = 'SELECT * FROM loans WHERE user_id = $1';
      const params: any[] = [userId];

      if (search && typeof search === 'string' && search.trim() !== '') {
        params.push(`%${search.trim().toLowerCase()}%`);
        query += ` AND LOWER(friend_name) LIKE $${params.length}`;
      }

      // Sort ordering
      switch (sort) {
        case 'due_date_desc':
          query += ' ORDER BY due_date DESC, created_at DESC';
          break;
        case 'amount_desc':
          query += ' ORDER BY amount DESC, due_date ASC';
          break;
        case 'amount_asc':
          query += ' ORDER BY amount ASC, due_date ASC';
          break;
        case 'created_desc':
          query += ' ORDER BY created_at DESC';
          break;
        case 'due_date_asc':
        default:
          query += ' ORDER BY due_date ASC, created_at DESC';
          break;
      }

      const result = await db.query(query, params);
      let loans = result.rows.map(formatLoanRow);

      // In-memory filter for status to ensure exact date parity
      if (status === 'active') {
        loans = loans.filter((l) => !l.isRepaid);
      } else if (status === 'repaid') {
        loans = loans.filter((l) => l.isRepaid);
      } else if (status === 'overdue') {
        loans = loans.filter((l) => l.isOverdue);
      }

      res.status(200).json({
        success: true,
        count: loans.length,
        loans,
      });
    } catch (error: any) {
      console.error('Error fetching loans:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch loans',
      });
    }
  }
);

/**
 * GET /api/loans/:id
 */
router.get(
  '/:id',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const db = await getDb();

      const result = await db.query('SELECT * FROM loans WHERE id = $1 AND user_id = $2', [
        id,
        userId,
      ]);

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Loan entry not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        loan: formatLoanRow(result.rows[0]),
      });
    } catch (error: any) {
      console.error('Error fetching loan detail:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch loan' });
    }
  }
);

/**
 * POST /api/loans
 * Supports JSON or multipart/form-data (with optional receipt photo)
 */
router.post(
  '/',
  requireAuth,
  uploadReceipt.single('receipt'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const parseResult = createLoanSchema.safeParse(req.body);

      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: parseResult.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }

      const { friendName, amount, dueDate, notes } = parseResult.data;
      const receiptUrl = req.file ? `/uploads/${req.file.filename}` : null;
      const loanId = randomUUID();

      const db = await getDb();
      await db.query(
        `INSERT INTO loans (id, user_id, friend_name, amount, due_date, receipt_url, notes, is_repaid)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [loanId, userId, friendName, amount, dueDate, receiptUrl, notes || null, false]
      );

      const createdRow = await db.query('SELECT * FROM loans WHERE id = $1', [loanId]);

      res.status(201).json({
        success: true,
        message: 'Loan entry added successfully',
        loan: formatLoanRow(createdRow.rows[0]),
      });
    } catch (error: any) {
      console.error('Error creating loan:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create loan entry',
      });
    }
  }
);

/**
 * PATCH /api/loans/:id/repay
 * Marks loan entry as repaid
 */
router.patch(
  '/:id/repay',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const db = await getDb();

      // Check loan existence
      const existing = await db.query('SELECT * FROM loans WHERE id = $1 AND user_id = $2', [
        id,
        userId,
      ]);

      if (existing.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Loan entry not found',
        });
        return;
      }

      const loan = existing.rows[0];
      if (loan.is_repaid) {
        res.status(200).json({
          success: true,
          message: 'Loan is already marked as repaid',
          loan: formatLoanRow(loan),
        });
        return;
      }

      const now = new Date().toISOString();
      await db.query(
        'UPDATE loans SET is_repaid = TRUE, repaid_at = $1, updated_at = $2 WHERE id = $3',
        [now, now, id]
      );

      const updated = await db.query('SELECT * FROM loans WHERE id = $1', [id]);

      res.status(200).json({
        success: true,
        message: 'Loan marked as repaid successfully',
        loan: formatLoanRow(updated.rows[0]),
      });
    } catch (error: any) {
      console.error('Error marking loan as repaid:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark loan as repaid',
      });
    }
  }
);

/**
 * DELETE /api/loans/:id
 */
router.delete(
  '/:id',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const db = await getDb();

      const existing = await db.query('SELECT id FROM loans WHERE id = $1 AND user_id = $2', [
        id,
        userId,
      ]);

      if (existing.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Loan entry not found',
        });
        return;
      }

      await db.query('DELETE FROM loans WHERE id = $1', [id]);

      res.status(200).json({
        success: true,
        message: 'Loan entry deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting loan:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete loan entry',
      });
    }
  }
);

export default router;
