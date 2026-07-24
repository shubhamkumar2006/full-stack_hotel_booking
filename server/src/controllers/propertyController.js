const propertyService = require('../services/propertyService');

const searchProperties = async (req, res) => {
  const result = await propertyService.searchProperties(req.query);
  res.json({ success: true, data: result });
};

const getProperty = async (req, res) => {
  const property = await propertyService.getProperty(req.params.id, req.user?.id);
  res.json({ success: true, data: property });
};

const createProperty = async (req, res) => {
  const thumbnailImage = req.files?.[0]?.path;
  const property = await propertyService.createProperty(req.user.id, { ...req.body, thumbnailImage });
  res.status(201).json({ success: true, data: property });
};

const updateProperty = async (req, res) => {
  const property = await propertyService.updateProperty(req.params.id, req.user.id, req.body);
  res.json({ success: true, data: property });
};

const deleteProperty = async (req, res) => {
  await propertyService.deleteProperty(req.params.id, req.user.id);
  res.json({ success: true, message: 'Property deleted' });
};

const getHostProperties = async (req, res) => {
  const result = await propertyService.getHostProperties(req.user.id, req.query.page, req.query.limit);
  res.json({ success: true, data: result });
};

// ── Rooms ─────────────────────────────────────────────────

const createRoom = async (req, res) => {
  const images = (req.files || []).map((f) => f.path);
  const room = await propertyService.createRoom(req.params.propertyId, req.user.id, { ...req.body, images });
  res.status(201).json({ success: true, data: room });
};

const updateRoom = async (req, res) => {
  const room = await propertyService.updateRoom(req.params.roomId, req.user.id, req.body);
  res.json({ success: true, data: room });
};

const deleteRoom = async (req, res) => {
  await propertyService.deleteRoom(req.params.roomId, req.user.id);
  res.json({ success: true, message: 'Room deleted' });
};

const setRoomAvailability = async (req, res) => {
  await propertyService.setRoomAvailability(req.params.roomId, req.user.id, req.body.dates);
  res.json({ success: true, message: 'Availability updated' });
};

module.exports = {
  searchProperties, getProperty, createProperty, updateProperty, deleteProperty,
  getHostProperties, createRoom, updateRoom, deleteRoom, setRoomAvailability,
};
