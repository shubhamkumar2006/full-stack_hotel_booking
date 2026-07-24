const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/db');

// Mock external services
jest.mock('../src/services/notificationService', () => ({
  sendOtpEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  sendBookingConfirmationEmail: jest.fn().mockResolvedValue(true),
  sendCancellationEmail: jest.fn().mockResolvedValue(true),
  sendPaymentReceiptEmail: jest.fn().mockResolvedValue(true),
  createInAppNotification: jest.fn().mockResolvedValue(true),
}));

jest.mock('../src/config/redis', () => ({
  redis: { ping: jest.fn(), connect: jest.fn(), quit: jest.fn() },
  acquireBookingLock: jest.fn().mockResolvedValue(true),
  releaseBookingLock: jest.fn().mockResolvedValue(true),
  setWithTTL: jest.fn(),
  getKey: jest.fn().mockResolvedValue(null),
  deleteKey: jest.fn(),
}));

jest.mock('../src/config/db', () => ({
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  otpVerification: {
    create: jest.fn().mockResolvedValue(true),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('Auth API', () => {
  let testEmail = 'test@staynest.com';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/signup', () => {
    it('should create a new user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'u1',
        name: 'Test User',
        email: testEmail,
        role: 'GUEST',
        isVerified: false,
      });

      const res = await request(app).post('/api/auth/signup').send({
        name: 'Test User',
        email: testEmail,
        password: 'Test@123',
        role: 'GUEST',
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testEmail);
    });

    it('should reject duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: testEmail });

      const res = await request(app).post('/api/auth/signup').send({
        name: 'Test User 2',
        email: testEmail,
        password: 'Test@123',
      });
      expect(res.status).toBe(409);
    });

    it('should reject weak password', async () => {
      const res = await request(app).post('/api/auth/signup').send({
        name: 'Test',
        email: 'weak@test.com',
        password: 'weak',
      });
      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should reject login with wrong password', async () => {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('Test@123', 12);
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: testEmail,
        passwordHash: hash,
        isActive: true,
      });

      const res = await request(app).post('/api/auth/login').send({
        email: testEmail,
        password: 'WrongPass@123',
      });
      expect(res.status).toBe(401);
    });
  });
});

describe('Health Check', () => {
  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /live returns live', async () => {
    const res = await request(app).get('/live');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('live');
  });
});

