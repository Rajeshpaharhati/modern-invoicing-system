/**
 * Centralized error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('[Error Handler]', err);

  // MongoDB duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    let message = `Duplicate value entered for ${field}.`;

    if (err.keyPattern && err.keyPattern.invoiceNumber) {
      message = `Invoice number '${err.keyValue?.invoiceNumber}' already exists for your account. Please use a unique invoice number.`;
    } else if (err.keyPattern && err.keyPattern.email) {
      message = `An account or client with email '${err.keyValue?.email}' already exists.`;
    }

    return res.status(409).json({
      success: false,
      error: message,
      field
    });
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      error: 'Validation Failed',
      details: errors
    });
  }

  // CastError (invalid ObjectId format)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: `Invalid resource ID format for '${err.path}'`
    });
  }

  // Multer errors (file size, file type)
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      error: `File upload error: ${err.message}`
    });
  }

  // Fallback internal server error
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
};

module.exports = errorHandler;
