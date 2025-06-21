import { ErrorEnum } from "../enums/error.enum";

export class CustomError {
  public static readonly WRONG_PASSWORD = new CustomError(
    ErrorEnum.WRONG_PASSWORD,
    "Wrong password",
  );
  public static readonly INVALID_LOCKBOX_FORMAT = new CustomError(
    ErrorEnum.INVALID_LOCKBOX_FORMAT,
    "Invalid lockbox format",
  );
  public static readonly INTEGRITY_CHECK_FAILED = new CustomError(
    ErrorEnum.INTEGRITY_CHECK_FAILED,
    "Integrity check failed",
  );
  public static readonly NOT_YET_EXPIRED = (date: string) =>
    new CustomError(
      ErrorEnum.NOT_YET_EXPIRED,
      `Not yet expired. Expiration: ${date}`,
    );
  public static readonly DECRYPTION_FAILED = new CustomError(
    ErrorEnum.DECRYPTION_FAILED,
    "Decryption failed",
  );
  public static readonly FILE_SIZE_EXCEEDED = new CustomError(
    ErrorEnum.FILE_SIZE_EXCEEDED,
    "File size exceeds the maximum limit.",
  );
  public static readonly EXPIRY_DATE_MUST_NOT_BE_IN_PAST = new CustomError(
    ErrorEnum.EXPIRY_DATE_MUST_NOT_BE_IN_PAST,
    "Expiry date must not be in the past",
  );

  private constructor(
    private readonly key: ErrorEnum,
    private readonly value: string,
  ) {}

  public getKey(): ErrorEnum {
    return this.key;
  }

  public getValue(): string {
    return this.value;
  }

  static values(): CustomError[] {
    return [
      CustomError.WRONG_PASSWORD,
      CustomError.INVALID_LOCKBOX_FORMAT,
      CustomError.INTEGRITY_CHECK_FAILED,
      // CustomError.NOT_YET_EXPIRED,
      CustomError.DECRYPTION_FAILED,
      CustomError.FILE_SIZE_EXCEEDED,
      CustomError.EXPIRY_DATE_MUST_NOT_BE_IN_PAST,
    ];
  }
}
