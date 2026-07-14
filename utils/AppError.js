// Loi ung dung chuan. Moi loi nem ra can toi client duoi dang JSON co kiem soat
// deu la (hoac duoc chuyen thanh) AppError. Middleware errorHandler bien no thanh:
//   { error: { message, code } }
class AppError extends Error {
  constructor(message, statusCode = 400, code = "BAD_REQUEST") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }

  static notFound(message = "Khong tim thay du lieu", code = "NOT_FOUND") {
    return new AppError(message, 404, code);
  }

  static unauthorized(message = "Ban chua dang nhap", code = "UNAUTHORIZED") {
    return new AppError(message, 401, code);
  }

  static forbidden(message = "Ban khong co quyen thuc hien hanh dong nay", code = "FORBIDDEN") {
    return new AppError(message, 403, code);
  }

  static conflict(message = "Du lieu da ton tai", code = "CONFLICT") {
    return new AppError(message, 409, code);
  }

  static validation(message = "Du lieu khong hop le", code = "VALIDATION_ERROR") {
    return new AppError(message, 422, code);
  }

  static internal(message = "Loi he thong, vui long thu lai sau", code = "INTERNAL_ERROR") {
    return new AppError(message, 500, code);
  }
}

module.exports = { AppError };
