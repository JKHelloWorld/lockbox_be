import ntpClient from "ntp-client";
import { NTP_CLIENT, NTP_CLIENT_PORT } from "./env-variables.core";

export default async function getNetworkTime(): Promise<Date> {
  return new Promise((resolve, reject) => {
    ntpClient.getNetworkTime(NTP_CLIENT, NTP_CLIENT_PORT, (err, date) => {
      if (err) return reject(err);
      if (date == null)
        return reject(new Error("NPT_CLIENT: No date received"));
      resolve(date);
    });
  });
}
