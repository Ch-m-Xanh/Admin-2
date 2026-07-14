// Boc route handler async de promise bi reject di toi error middleware
// thay vi lam treo request / crash process.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { asyncHandler };
