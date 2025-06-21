export default interface Lockbox {
  expiration_date: string; // ISO string
  payload: string; // base64 of IV + ciphertext
  hmac: string; // hex-encoded HMAC
}
