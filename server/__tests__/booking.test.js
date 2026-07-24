const bookingService = require('../src/services/bookingService');
const prisma = require('../src/config/db');

jest.mock('../src/config/db', () => ({
  booking: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  },
  room: { findUnique: jest.fn() },
  roomAvailability: { findFirst: jest.fn(), findUnique: jest.fn() },
  payment: { create: jest.fn(), findUnique: jest.fn() },
  $transaction: jest.fn((fns) => Promise.all(Array.isArray(fns) ? fns : [fns])),
}));

jest.mock('../src/config/redis', () => ({
  acquireBookingLock: jest.fn().mockResolvedValue(true),
  releaseBookingLock: jest.fn().mockResolvedValue(true),
}));

jest.mock('../src/services/notificationService', () => ({
  sendBookingConfirmationEmail: jest.fn().mockResolvedValue(true),
  sendCancellationEmail: jest.fn().mockResolvedValue(true),
  createInAppNotification: jest.fn().mockResolvedValue(true),
}));

describe('Booking Service', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('checkRoomAvailability', () => {
    it('should throw if room not found', async () => {
      prisma.room.findUnique.mockResolvedValue(null);
      await expect(
        bookingService.checkRoomAvailability('nonexistent', '2026-12-01', '2026-12-05', 2)
      ).rejects.toThrow('Room not found');
    });

    it('should throw if guests exceed max occupancy', async () => {
      prisma.room.findUnique.mockResolvedValue({ id: 'r1', maxOccupancy: 2, pricePerNight: 5000 });
      await expect(
        bookingService.checkRoomAvailability('r1', '2026-12-01', '2026-12-05', 5)
      ).rejects.toThrow('max 2 guests');
    });

    it('should throw if check-out is before check-in', async () => {
      prisma.room.findUnique.mockResolvedValue({ id: 'r1', maxOccupancy: 4, pricePerNight: 5000 });
      await expect(
        bookingService.checkRoomAvailability('r1', '2026-12-10', '2026-12-05', 2)
      ).rejects.toThrow('Check-out must be after check-in');
    });

    it('should throw if room already booked', async () => {
      prisma.room.findUnique.mockResolvedValue({ id: 'r1', maxOccupancy: 4, pricePerNight: 5000 });
      prisma.booking.findFirst.mockResolvedValue({ id: 'existing-booking' });
      await expect(
        bookingService.checkRoomAvailability('r1', '2027-01-01', '2027-01-05', 2)
      ).rejects.toThrow('not available');
    });

    it('should resolve for valid available room', async () => {
      const mockRoom = { id: 'r1', maxOccupancy: 4, pricePerNight: 5000 };
      prisma.room.findUnique.mockResolvedValue(mockRoom);
      prisma.booking.findFirst.mockResolvedValue(null);
      prisma.roomAvailability.findFirst.mockResolvedValue(null);
      const result = await bookingService.checkRoomAvailability('r1', '2027-02-01', '2027-02-05', 2);
      expect(result).toEqual(mockRoom);
    });
  });

  describe('calculateTotal', () => {
    it('should correctly compute total nights × price', async () => {
      const room = { id: 'r1', pricePerNight: 5000 };
      prisma.roomAvailability.findUnique.mockResolvedValue(null);
      const { total, nights } = await bookingService.calculateTotal(room, '2027-02-01', '2027-02-05');
      expect(nights).toBe(4);
      expect(total).toBe(20000);
    });

    it('should use custom price when available', async () => {
      const room = { id: 'r1', pricePerNight: 5000 };
      prisma.roomAvailability.findUnique.mockResolvedValue({ customPrice: 7000 });
      const { total } = await bookingService.calculateTotal(room, '2027-02-01', '2027-02-02');
      expect(total).toBe(7000);
    });
  });

  describe('calculateRefund', () => {
    const makeBooking = (policy, checkIn) => ({
      totalAmount: 10000,
      checkIn: new Date(checkIn),
      room: { property: { cancellationPolicy: policy } },
    });

    it('FREE policy + > 48h should return full refund', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);
      const refund = bookingService.calculateRefund(makeBooking('FREE', futureDate.toISOString()));
      expect(refund).toBe(10000);
    });

    it('STRICT policy should return no refund', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const refund = bookingService.calculateRefund(makeBooking('STRICT', futureDate.toISOString()));
      expect(refund).toBe(0);
    });

    it('PARTIAL policy + > 24h should return 50% refund', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);
      const refund = bookingService.calculateRefund(makeBooking('PARTIAL', futureDate.toISOString()));
      expect(refund).toBe(5000);
    });
  });
});
