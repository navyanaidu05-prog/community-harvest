export class HttpError extends Error {
  constructor(status, code, message, details = undefined) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message, code = "BAD_REQUEST") => new HttpError(400, code, message);
export const unauthorized = (message = "Please sign in to continue.") =>
  new HttpError(401, "AUTH_REQUIRED", message);
export const forbidden = (message = "You do not have permission to do that.") =>
  new HttpError(403, "FORBIDDEN", message);
export const notFound = (message = "Not found.") => new HttpError(404, "NOT_FOUND", message);
export const conflict = (message, code = "CONFLICT") => new HttpError(409, code, message);
