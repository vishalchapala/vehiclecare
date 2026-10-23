// Runs when no route matched.
function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// One place that turns every error into a clean JSON response.
// Real server errors are logged here but never shown to the user.
function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message || 'Server error';

  if (err.name === 'CastError') { status = 400; message = 'Invalid ID'; }
  else if (err.name === 'ValidationError') { status = 400; message = Object.values(err.errors).map((e) => e.message).join(', '); }
  else if (err.code === 11000) { status = 409; message = 'A record with these details already exists'; }
  else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') { status = 401; message = 'Your session has expired. Please log in again.'; }
  else if (err.type === 'entity.parse.failed') { status = 400; message = 'Malformed JSON in request'; }

  if (status === 500) {
    console.error(err);
    message = 'Something went wrong on the server';
  }
  res.status(status).json({ success: false, message });
}

module.exports = { notFound, errorHandler };
