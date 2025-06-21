import { isValid, parse } from "date-fns";
import fs from "fs";
import { ParsedPath } from "node:path";
import path from "path";
import crypto from "crypto";
import { prompt } from "./prompt.core";
import Keys from "../interfaces/keys.interface";
import Lockbox from "../interfaces/lockbox.interface";
import { deriveKeys, encodeStringSafe, encryptSecret } from "./crypto.core";
import {
  DATETIME_FORMAT,
  MIN_PASSWORD_LENGTH,
  SECRET_KEY,
} from "./env-variables.core";
import File from "../interfaces/file.interface";

export function encryptFile(
  data: string,
  expiryDate: Date,
  password: string,
): Buffer {
  if (!isValid(expiryDate)) {
    throw new Error("Invalid date format");
  }

  // Compute magic number
  const magicNumber: number = SECRET_KEY.charCodeAt(
    Math.floor(SECRET_KEY.length / 2),
  );

  // Derive keys
  const keys1: Keys = deriveKeys(
    password,
    encodeStringSafe(SECRET_KEY, magicNumber),
  );
  const keys2: Keys = deriveKeys(password, SECRET_KEY);

  // Encrypt payload
  const encPayload = encryptSecret(data, keys1.keyEnc);
  const encPayloadBase64 = encPayload.toString("base64");

  // Build JSON structure
  const lockbox: Lockbox = {
    expiration_date: expiryDate.toISOString(),
    payload: encPayloadBase64,
    hmac: "",
  };

  // Compute HMAC over expiration_date + payload
  const hmacData = Buffer.from(
    lockbox.expiration_date + lockbox.payload,
    "utf-8",
  );

  lockbox.hmac = crypto
    .createHmac("sha256", keys1.keyMac)
    .update(hmacData)
    .digest("hex");

  // Encrypt file
  const jsonString: string = JSON.stringify(lockbox);

  return encryptSecret(jsonString, keys2.keyEnc);
}

export default function handleEncryptFile(): void {
  // Prompt expiry date
  let expiryDate: Date;
  while (true) {
    const input: string = prompt(`Enter expiry date (${DATETIME_FORMAT}): `);
    expiryDate = parse(input, DATETIME_FORMAT, new Date());
    if (isValid(expiryDate)) {
      break;
    } else {
      console.error("Invalid date format");
    }
  }

  // Prompt file to encrypt
  const file: File = {
    data: undefined,
    name: undefined,
    ext: undefined,
  };
  while (true) {
    const filePath: string = prompt("Enter the name of file to encrypt: ");
    try {
      file.data = fs.readFileSync(filePath);
      const parsedPath: ParsedPath = path.parse(filePath);
      file.name = parsedPath.name;
      file.ext = parsedPath.ext.slice(1); // Remove leading dot
      break;
    } catch (err: unknown) {
      console.log(`Error reading file: ${(err as Error).message}`);
    }
  }

  // Package secret
  const payloadPlain = `${file.name}:${file.ext}:${file.data.toString("base64")}`;

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

  // Write file
  const outName = `${file.name}.lb`;
  fs.writeFileSync(outName, encryptFile(payloadPlain, expiryDate, password));

  console.log(`Lockbox saved to ${outName}\n`);
}
