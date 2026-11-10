export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`
  });
};

export const errorHandler = (err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);

  // Check if Zod error
  if (err.name === 'ZodError') {
    const errorMessages = err.errors.map(e => e.message).join('. ');
    return res.status(400).json({
      success: false,
      message: `Validation failed: ${errorMessages}`,
      errors: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
