const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/propertyController');
const { authenticate, requireRole } = require('../middlewares/auth');
const { createUploader } = require('../config/cloudinary');
const { propertyValidators, validate } = require('../middlewares/validate');

const propertyImageUploader = createUploader('properties', 'images', 10);
const roomImageUploader = createUploader('rooms', 'images', 10);

// ── Public ────────────────────────────────────────────────
router.get('/', ctrl.searchProperties);
router.get('/:id', ctrl.getProperty);

// ── Host ──────────────────────────────────────────────────
router.post('/',
  authenticate, requireRole('HOST', 'ADMIN'),
  propertyImageUploader,
  propertyValidators.create, validate,
  ctrl.createProperty
);

router.patch('/:id',
  authenticate, requireRole('HOST', 'ADMIN'),
  ctrl.updateProperty
);

router.delete('/:id',
  authenticate, requireRole('HOST', 'ADMIN'),
  ctrl.deleteProperty
);

// ── Rooms ─────────────────────────────────────────────────
router.post('/:propertyId/rooms',
  authenticate, requireRole('HOST', 'ADMIN'),
  roomImageUploader,
  ctrl.createRoom
);

router.patch('/rooms/:roomId',
  authenticate, requireRole('HOST', 'ADMIN'),
  ctrl.updateRoom
);

router.delete('/rooms/:roomId',
  authenticate, requireRole('HOST', 'ADMIN'),
  ctrl.deleteRoom
);

router.put('/rooms/:roomId/availability',
  authenticate, requireRole('HOST', 'ADMIN'),
  ctrl.setRoomAvailability
);

module.exports = router;
