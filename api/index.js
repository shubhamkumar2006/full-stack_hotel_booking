let app;
try {
  app = require('../server/src/app');
} catch (err) {
  console.error('Failed to load Express app:', err);
}

module.exports = (req, res) => {
  if (!app) {
    try {
      app = require('../server/src/app');
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: 'App initialization failed',
        details: err.message,
        stack: err.stack,
      });
    }
  }
  return app(req, res);
};
