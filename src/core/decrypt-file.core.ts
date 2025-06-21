import fs from "fs";
import crypto from "crypto";
import { prompt } from "./prompt.core";
import Lockbox from "../interfaces/lockbox.interface";
import { decryptSecret, deriveKeys, encodeStringSafe } from "./crypto.core";
import getNetworkTime from "./ntp.core";
import Keys from "../interfaces/keys.interface";
import { MIN_PASSWORD_LENGTH, SECRET_KEY } from "./env-variables.core";
import { ServerError } from "../errors/server.error";
import { CustomError } from "./custom-error";
import HTTP from "http-status";

export async function decryptFile(
  data: Buffer,
  password: string,
): Promise<string> {
  // Compute magic number
  const magicNumber: number = SECRET_KEY.charCodeAt(
    Math.floor(SECRET_KEY.length / 2),
  );

  // Derive keys
  const keys1: Keys = deriveKeys(password, SECRET_KEY);
  const keys2: Keys = deriveKeys(
    password,
    encodeStringSafe(SECRET_KEY, magicNumber),
  );

  // Decrypt file
  let jsonString: string;
  try {
    jsonString = decryptSecret(data, keys1.keyEnc);
  } catch {
    throw new ServerError(
      HTTP.INTERNAL_SERVER_ERROR,
      CustomError.WRONG_PASSWORD,
    );
  }

  // Parse JSON
  let lockbox: Lockbox;
  try {
    lockbox = JSON.parse(jsonString);
  } catch {
    throw new ServerError(
      HTTP.INTERNAL_SERVER_ERROR,
      CustomError.INVALID_LOCKBOX_FORMAT,
    );
  }

  // Verify HMAC
  const hmacData = Buffer.from(
    lockbox.expiration_date + lockbox.payload,
    "utf-8",
  );
  const expected = crypto
    .createHmac("sha256", keys2.keyMac)
    .update(hmacData)
    .digest("hex");
  if (
    !crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(lockbox.hmac, "hex"),
    )
  ) {
    throw new ServerError(
      HTTP.INTERNAL_SERVER_ERROR,
      CustomError.INTEGRITY_CHECK_FAILED,
    );
  }

  // Check expiry
  let now: Date;
  try {
    now = await getNetworkTime();
  } catch {
    throw new Error("Could not fetch NTP time; aborting.");
  }
  const expDate = new Date(lockbox.expiration_date);
  if (now < expDate) {
    throw new ServerError(
      HTTP.INTERNAL_SERVER_ERROR,
      CustomError.NOT_YET_EXPIRED(expDate.toISOString()),
    );
  }

  // Decrypt payload
  const payload = Buffer.from(lockbox.payload, "base64");
  let decPayload: string;
  try {
    decPayload = decryptSecret(payload, keys2.keyEnc);
  } catch {
    throw new ServerError(
      HTTP.INTERNAL_SERVER_ERROR,
      CustomError.DECRYPTION_FAILED,
    );
  }

  return decPayload;
}

export default async function handleDecryptFile(): Promise<void> {
  // Prompt lockbox file
  let buffer: Buffer;
  while (true) {
    const input: string = prompt("Enter lockbox filename: ");
    const filename = input.toLowerCase().endsWith(".lb")
      ? input
      : `${input}.lb`;
    try {
      buffer = fs.readFileSync(filename);
      break;
    } catch (err: unknown) {
      console.log(`Error reading lockbox: ${(err as Error).message}`);
    }
  }

  // Password input
  let password: string;
  while (true) {
    password = prompt("Enter encryption password: ", { echo: "*" });

    if (password.length < MIN_PASSWORD_LENGTH) {
      console.error(
        `Password must be longer than ${MIN_PASSWORD_LENGTH} characters`,
      );
    } else {
      break;
    }
  }

  const plain: string = await decryptFile(buffer, password);

  const [filename, ext, base64Data]: string[] = plain.split(":", 3);
  const outName = `decrypted_${filename}.${ext}`;
  fs.writeFileSync(outName, Buffer.from(base64Data, "base64"));

  console.log(`Decrypted file written to ${outName}\n`);
}
