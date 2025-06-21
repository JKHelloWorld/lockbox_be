import express, { NextFunction, Request, Response } from "express";
import { isValid, parseISO } from "date-fns";
import {
  CORS,
  MAX_EXPRESS_JSON_PAYLOAD_SIZE,
  MAX_FILE_SIZE,
  SERVER_PORT,
} from "../core/env-variables.core";
import { encryptFile } from "../core/encrypt-file.core";
import { decryptFile } from "../core/decrypt-file.core";
import HTTP from "http-status";
import { ServerError } from "../errors/server.error";
import { CustomError } from "../core/custom-error";
import { ErrorEnum } from "../enums/error.enum";

const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // console.error(err.stack);
  console.error(err.message);
  if (err instanceof ServerError) {
    const _err: ServerError = err as ServerError;
    res.status(_err.status).json({ error: _err.error.getKey() });
  } else {
    next(err);
  }
};

const middlewareHandler = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Access-Control-Allow-Origin", CORS);
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
};

const isAlive = (req: Request, res: Response) => {
  console.log("I'm alive!");
  res.status(HTTP.OK).send();
};

const lockFileHandler = (req: Request, res: Response) => {
  const filename: string = req.body.filename;
  const data: string = req.body.data;
  const expiryDate: string = req.body.expiryDate;
  const secret: string = req.body.secret;

  // Validate filename
  if (filename == null) {
    res.status(HTTP.BAD_REQUEST).json({ error: "Filename field is required" });
    return;
  }

  // Validate data
  if (data == null) {
    res.status(HTTP.BAD_REQUEST).json({ error: "Data field is required" });
    return;
  }

  let fileBuffer: Buffer;
  try {
    fileBuffer = Buffer.from(data, "base64");
  } catch {
    res
      .status(HTTP.BAD_REQUEST)
      .json({ error: "Invalid base64 file encoding." });
    return;
  }

  if (fileBuffer.length > MAX_FILE_SIZE) {
    res
      .status(HTTP.BAD_REQUEST)
      .json({ error: "File size exceeds the maximum limit." });
    return;
  }

  // Validate expiryDate
  if (expiryDate == null) {
    res
      .status(HTTP.BAD_REQUEST)
      .json({ error: "expiryDate field is required" });
    return;
  }

  const parsedDate: Date = parseISO(expiryDate);

  if (!isValid(parsedDate)) {
    res.status(HTTP.BAD_REQUEST).json({ error: "Invalid date format" });
    return;
  }

  if (parsedDate < new Date()) {
    throw new ServerError(
      HTTP.BAD_REQUEST,
      CustomError.EXPIRY_DATE_MUST_NOT_BE_IN_PAST,
    );
  }

  // Validate secret
  if (secret == null || secret.trim() === "") {
    res.status(HTTP.BAD_REQUEST).json({ error: "Secret field is required" });
    return;
  }

  const [name, ext] = filename.split(".");

  // Create data string
  const dataToEnc = `${filename}:${ext}:${data}`;

  // Encrypt the file
  const encFile: Buffer = encryptFile(dataToEnc, parsedDate, secret);

  // Encrypted file to base64
  const encFileBase64: string = encFile.toString("base64");

  // Set headers for file download
  res.setHeader("Content-Type", "application/json");

  res.send({ filename: `${name}.lb`, data: encFileBase64 });
};

const unlockFileHandler = async (req: Request, res: Response) => {
  const data: string = req.body.data;
  const secret = req.body.secret;

  // Validate data
  if (data == null) {
    res.status(HTTP.BAD_REQUEST).json({ error: "Data field is required" });
    return;
  }

  let fileBuffer: Buffer;
  try {
    fileBuffer = Buffer.from(data, "base64");
  } catch {
    res
      .status(HTTP.BAD_REQUEST)
      .json({ error: "Invalid base64 file encoding." });
    return;
  }

  if (fileBuffer.length > MAX_FILE_SIZE) {
    res
      .status(HTTP.BAD_REQUEST)
      .json({ error: "File size exceeds the maximum limit." });
    return;
  }

  // Validate secret
  if (secret == null || secret.trim() === "") {
    res.status(HTTP.BAD_REQUEST).json({ error: "Secret field is required" });
    return;
  }

  // Decrypt the file
  const plain: string = await decryptFile(fileBuffer, secret);

  const [filename, ext, base64Data]: string[] = plain.split(":", 3);
  const outName = `decrypted_${filename}.${ext}`;

  // Set headers for file download
  res.setHeader("Content-Type", "application/json");

  res.send({ filename: outName, data: base64Data });
};

export function start(): void {
  console.log("Starting server...");

  const app = express();

  app.use(express.json({ limit: `${MAX_EXPRESS_JSON_PAYLOAD_SIZE}` }));

  // Middleware
  app.use(middlewareHandler);

  // GET /api/lock
  app.get("/api/is-alive", isAlive);

  // POST /api/lock
  app.post("/api/lock", lockFileHandler);

  // POST /api/unlock
  app.post("/api/unlock", unlockFileHandler);

  // Global error handler
  app.use(errorHandler);

  app.listen(SERVER_PORT, () => {
    console.log(`Server is running on http://localhost:${SERVER_PORT}`);
  });
}
