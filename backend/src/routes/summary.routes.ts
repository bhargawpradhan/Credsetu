import { Router, Response } from 'express';
import { getDb } from '../db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /api/summary
 * Returns total lent, total repaid, overdue amount, and helpful counts
 */
router.get(
  '/',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const db = await getDb();

      // Retrieve all loans for this user
      const result = await db.query(
        'SELECT amount, due_date, is_repaid FROM loans WHERE user_id = $1',
        [userId]
      );

      const todayStr = new Date().toISOString().split('T')[0];

      let totalLent = 0;
      let totalRepaid = 0;
      let overdueAmount = 0;
      let totalCount = 0;
      let activeCount = 0;
      let overdueCount = 0;
      let repaidCount = 0;

      for (const row of result.rows) {
        const amount = parseFloat(row.amount) || 0;
        let dueDateStr = '';
        if (row.due_date instanceof Date) {
          dueDateStr = row.due_date.toISOString().split('T')[0];
        } else if (typeof row.due_date === 'string') {
          dueDateStr = row.due_date.split('T')[0];
        }

        totalLent += amount;
        totalCount += 1;

        if (row.is_repaid) {
          totalRepaid += amount;
          repaidCount += 1;
        } else {
          activeCount += 1;
          if (dueDateStr < todayStr) {
            overdueAmount += amount;
            overdueCount += 1;
          }
        }
      }

      const totalPending = Math.max(0, totalLent - totalRepaid);

      res.status(200).json({
        success: true,
        summary: {
          totalLent: Math.round(totalLent * 100) / 100,
          totalRepaid: Math.round(totalRepaid * 100) / 100,
          totalPending: Math.round(totalPending * 100) / 100,
          overdueAmount: Math.round(overdueAmount * 100) / 100,
          counts: {
            total: totalCount,
            active: activeCount,
            overdue: overdueCount,
            repaid: repaidCount,
          },
        },
      });
    } catch (error: any) {
      console.error('Error fetching summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate loan summary',
      });
    }
  }
);

export default router;
