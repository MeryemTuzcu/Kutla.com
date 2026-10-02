const sendError = (res, status, error, message) => res.status(status).json({ error, message });

module.exports = { sendError };
