import Keys from "../interfaces/keys.interface";
import crypto from "crypto";

const BLOCK_SIZE = 16;

export function deriveKeys(password: string, secret: string): Keys {
  const combined = Buffer.concat([
    Buffer.from(secret, "utf-8"),
    Buffer.from(password, "utf-8"),
  ]);
  const keyEnc = crypto
    .createHash("sha256")
    .update(Buffer.concat([combined, Buffer.from("enc")]))
    .digest();
  const keyMac = crypto
    .createHash("sha256")
    .update(Buffer.concat([combined, Buffer.from("mac")]))
    .digest();
  return { keyEnc, keyMac };
}

export function encryptSecret(plaintext: string, keyEnc: Buffer): Buffer {
  const iv = crypto.randomBytes(BLOCK_SIZE);
  const cipher = crypto.createCipheriv("aes-256-cbc", keyEnc, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf-8"), cipher.final()]);
  return Buffer.concat([iv, ct]);
}

export function decryptSecret(blob: Buffer, keyEnc: Buffer): string {
  const iv = blob.subarray(0, BLOCK_SIZE);
  const ct = blob.subarray(BLOCK_SIZE);
  const decipher = crypto.createDecipheriv("aes-256-cbc", keyEnc, iv);
  const padded = Buffer.concat([decipher.update(ct), decipher.final()]);
  return padded.toString("utf-8");
}

export function encodeStringSafe(input: string, magicNumber: number): string {
  return input
    .split("")
    .map((char) => (char.charCodeAt(0) * magicNumber).toString(36)) // base-36 string
    .join("-");
}
