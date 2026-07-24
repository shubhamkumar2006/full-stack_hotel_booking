// Vercel serverless entrypoint v1.0.2
const app = require('../server/src/app');

module.exports = (req, res) => {
  return app(req, res);
};
