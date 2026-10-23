import request from 'supertest';
import { createApp } from '../src/app';
import { getDb } from '../src/db';

const app = createApp();

describe('MiniLedger API Integration Tests', () => {
  let authToken: string;
  let userId: string;
  const testPhone = '+919876543210';
  let activeLoanId: string;
  let overdueLoanId: string;

  beforeAll(async () => {
    // Ensure in-memory test database is ready
    await getDb();
  });

  afterAll(async () => {
    const db = await getDb();
    await db.close();
  });

  describe('1. Health Check', () => {
    it('GET /api/health returns 200 and ok status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('2. Authentication Flow (Mock OTP)', () => {
    it('POST /api/auth/send-otp sends mock OTP for valid phone number', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ phone: testPhone });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.mockOtp).toBeDefined();
    });

    it('POST /api/auth/send-otp rejects invalid phone format', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ phone: '123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('POST /api/auth/verify-otp rejects invalid OTP', async () => {
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone: testPhone, otp: '000000' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/auth/verify-otp succeeds with mock OTP 123456 and issues JWT', async () => {
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone: testPhone, otp: '123456' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.phone).toBe(testPhone);

      authToken = res.body.token;
      userId = res.body.user.id;
    });

    it('GET /api/auth/me returns authenticated user details', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.id).toBe(userId);
    });

    it('Protected endpoints reject unauthenticated requests', async () => {
      const res = await request(app).get('/api/loans');
      expect(res.status).toBe(401);
    });
  });

  describe('3. Loan Entry Management & Validation', () => {
    it('POST /api/loans validates required fields and types', async () => {
      // Negative amount and missing friendName
      const res = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          friendName: '',
          amount: -500,
          dueDate: 'invalid-date',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.length).toBeGreaterThanOrEqual(3);
    });

    it('POST /api/loans adds an active loan entry successfully', async () => {
      // Due 10 days in future
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const dueDateStr = futureDate.toISOString().split('T')[0];

      const res = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          friendName: 'Rahul Sharma',
          amount: 2500,
          dueDate: dueDateStr,
          notes: 'Dinner and movie split',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.loan.friendName).toBe('Rahul Sharma');
      expect(res.body.loan.amount).toBe(2500);
      expect(res.body.loan.isRepaid).toBe(false);
      expect(res.body.loan.isOverdue).toBe(false);

      activeLoanId = res.body.loan.id;
    });

    it('POST /api/loans adds an overdue loan entry (due in the past)', async () => {
      // Due 5 days ago
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      const dueDateStr = pastDate.toISOString().split('T')[0];

      const res = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          friendName: 'Priya Verma',
          amount: 1500,
          dueDate: dueDateStr,
          notes: 'Concert ticket',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.loan.isOverdue).toBe(true);

      overdueLoanId = res.body.loan.id;
    });

    it('GET /api/loans retrieves list of loans with overdue flag calculated', async () => {
      const res = await request(app)
        .get('/api/loans')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.loans.length).toBe(2);

      const overdueItem = res.body.loans.find((l: any) => l.id === overdueLoanId);
      expect(overdueItem.isOverdue).toBe(true);

      const activeItem = res.body.loans.find((l: any) => l.id === activeLoanId);
      expect(activeItem.isOverdue).toBe(false);
    });

    it('GET /api/loans?status=overdue returns only overdue loans', async () => {
      const res = await request(app)
        .get('/api/loans?status=overdue')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.loans.length).toBe(1);
      expect(res.body.loans[0].id).toBe(overdueLoanId);
    });

    it('PATCH /api/loans/:id/repay marks loan as repaid', async () => {
      const res = await request(app)
        .patch(`/api/loans/${overdueLoanId}/repay`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.loan.isRepaid).toBe(true);
      expect(res.body.loan.repaidAt).toBeDefined();
      // Once repaid, loan should no longer be overdue
      expect(res.body.loan.isOverdue).toBe(false);
    });
  });

  describe('4. Summary Endpoint Calculations', () => {
    it('GET /api/summary returns accurate total lent, total repaid, and overdue amount', async () => {
      // Currently:
      // - Rahul: 2500 (active, not overdue)
      // - Priya: 1500 (repaid)
      // Let's add another loan that is overdue: 800
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 3);
      const pastDateStr = pastDate.toISOString().split('T')[0];

      await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          friendName: 'Amit Patel',
          amount: 800,
          dueDate: pastDateStr,
        });

      const res = await request(app)
        .get('/api/summary')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const summary = res.body.summary;
      // Total lent: 2500 + 1500 + 800 = 4800
      expect(summary.totalLent).toBe(4800);
      // Total repaid: 1500
      expect(summary.totalRepaid).toBe(1500);
      // Total pending: 3300
      expect(summary.totalPending).toBe(3300);
      // Overdue amount: 800 (Amit's loan only, since Priya is repaid)
      expect(summary.overdueAmount).toBe(800);

      expect(summary.counts.total).toBe(3);
      expect(summary.counts.active).toBe(2);
      expect(summary.counts.overdue).toBe(1);
      expect(summary.counts.repaid).toBe(1);
    });
  });
});
