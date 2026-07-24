module.exports = (req, res) => {
  try {
    const app = require('../server/src/app');
    return app(req, res);
  } catch (err) {
    console.error('Serverless Execution Error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        success: false,
        error: 'Vercel Serverless Function Error',
        message: err.message,
        stack: err.stack,
      })
    );
  }
};
