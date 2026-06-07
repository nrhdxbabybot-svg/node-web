/**
 * Middleware: validasi API Key dari header X-API-Key
 * Dipakai di endpoint upload, delete, update.
 */
module.exports = function requireApiKey(req, res, next) {
  const key = req.headers['x-api-key'] || req.query.api_key;
  if (!key || key !== process.env.API_KEY) {
    return res.status(401).json({ error: 'API Key tidak valid atau tidak disertakan.' });
  }
  next();
};
