import { DiscordSDK } from "@discord/embedded-app-sdk";

export type DiscordBootstrapStatus = "connected" | "disabled" | "failed";

export type DiscordBootstrapResult = {
  status: DiscordBootstrapStatus;
  sdk: DiscordSDK | null;
  message: string;
};

const PREFIX = "[discord-sdk]";

function log(result: DiscordBootstrapResult) {
  if (result.status === "failed") {
    console.warn(`${PREFIX} ${result.message}`);
    return;
  }

  console.info(`${PREFIX} ${result.message}`);
}

export async function initDiscordSdk(): Promise<DiscordBootstrapResult> {
  const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID?.trim();

  if (!clientId) {
    const result: DiscordBootstrapResult = {
      status: "disabled",
      sdk: null,
      message:
        "disabled (missing VITE_DISCORD_CLIENT_ID), running browser fallback",
    };
    log(result);
    return result;
  }

  try {
    const sdk = new DiscordSDK(clientId, { disableConsoleLogOverride: true });
    await sdk.ready();

    const result: DiscordBootstrapResult = {
      status: "connected",
      sdk,
      message: "ready",
    };
    log(result);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    const result: DiscordBootstrapResult = {
      status: "failed",
      sdk: null,
      message: `init failed, running browser fallback (${message})`,
    };
    log(result);
    return result;
  }
}
