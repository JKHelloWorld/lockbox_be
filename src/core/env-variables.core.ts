import dotenv from "dotenv";

function readVariable(name: string): string {
  const value: string | undefined = process.env[name];
  if (value === undefined) {
    console.error(`Environment variable ${name} is not set`);
    process.exit(1);
  }
  return value;
}

let ENV: string;
let DEBUG: string;
let SECRET_KEY: string;
let NTP_CLIENT: string;
let NTP_CLIENT_PORT: number;
let DATETIME_FORMAT: string;
let MIN_PASSWORD_LENGTH: number;
let MAX_FILE_SIZE: number;
let MAX_EXPRESS_JSON_PAYLOAD_SIZE: string;
let SERVER_PORT: number;
let CORS: string;

export const loadEnvVariables = (env: string): void => {
  dotenv.config({ path: `.env.${env}` });

  ENV = readVariable("ENV");
  DEBUG = readVariable("DEBUG");
  SECRET_KEY = readVariable("SECRET_KEY");
  NTP_CLIENT = readVariable("NTP_CLIENT");
  NTP_CLIENT_PORT = parseInt(readVariable("NTP_CLIENT_PORT"));
  DATETIME_FORMAT = readVariable("DATETIME_FORMAT");
  MIN_PASSWORD_LENGTH = parseInt(readVariable("MIN_PASSWORD_LENGTH"));
  MAX_FILE_SIZE = parseInt(readVariable("MAX_FILE_SIZE"));
  MAX_EXPRESS_JSON_PAYLOAD_SIZE = readVariable("MAX_EXPRESS_JSON_PAYLOAD_SIZE");
  SERVER_PORT = parseInt(readVariable("SERVER_PORT"));
  CORS = readVariable("CORS");
};

export {
  ENV,
  DEBUG,
  SECRET_KEY,
  NTP_CLIENT,
  NTP_CLIENT_PORT,
  DATETIME_FORMAT,
  MIN_PASSWORD_LENGTH,
  MAX_FILE_SIZE,
  MAX_EXPRESS_JSON_PAYLOAD_SIZE,
  SERVER_PORT,
  CORS,
};
