// Lets route handlers be async without try/catch in every one:
// any thrown error goes to the error-handling middleware.
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
