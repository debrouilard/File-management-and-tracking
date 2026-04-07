export function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || (err.name === "MulterError" ? 400 : 500);
  const message = err.message || "Server error";
  res.status(status).json({ error: message });
}
