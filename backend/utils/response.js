const success = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, data, message });
};

const error = (res, code, message, statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    error: { code, message },
  });
};

module.exports = { success, error };
