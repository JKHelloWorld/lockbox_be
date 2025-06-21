import { CustomError } from "../core/custom-error";

export class ServerError extends Error {
  constructor(
    readonly status: number,
    readonly error: CustomError,
  ) {
    super(`[Server Error]: ${error.getValue()}`);
    this.status = status;

    Error.captureStackTrace(this, this.constructor);
  }
}
