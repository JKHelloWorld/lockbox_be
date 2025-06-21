import handleEncryptFile from "./core/encrypt-file.core";
import handleDecryptFile from "./core/decrypt-file.core";
import { prompt } from "./core/prompt.core";
import { ENV, loadEnvVariables } from "./core/env-variables.core";
import * as Server from "./server/server";

async function main(): Promise<void> {
  const env = process.argv[2] || "development";

  loadEnvVariables(env);

  // prettier-ignore
  console.log(
      "██╗      ██████╗  ██████╗██╗  ██╗██████╗  ██████╗ ██╗  ██╗\n" +
      "██║     ██╔═══██╗██╔════╝██║ ██╔╝██╔══██╗██╔═══██╗╚██╗██╔╝\n" +
      "██║     ██║   ██║██║     █████╔╝ ██████╔╝██║   ██║ ╚███╔╝ \n" +
      "██║     ██║   ██║██║     ██╔═██╗ ██╔══██╗██║   ██║ ██╔██╗ \n" +
      "███████╗╚██████╔╝╚██████╗██║  ██╗██████╔╝╚██████╔╝██╔╝ ██╗\n" +
      "╚══════╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝╚═════╝  ╚═════╝ ╚═╝  ╚═╝\n",
  );

  if (ENV === "production") {
    Server.start();
  } else {
    while (true) {
      console.log(
        "- [1] Encrypt File  - [2] Decrypt File  - [3] Start server  - [4] Exit",
      );
      const choice = prompt("Choose: ");
      if (choice === "1") {
        try {
          handleEncryptFile();
        } catch (e) {
          console.error((e as Error).message);
        }
      } else if (choice === "2") {
        try {
          await handleDecryptFile();
        } catch (e) {
          console.error((e as Error).message);
        }
      } else if (choice === "3") {
        Server.start();
        break;
      } else if (choice === "4") {
        console.log("Goodbye.");
        break;
      } else {
        console.log("Invalid.");
      }
    }
  }
}

main().catch(console.error);
