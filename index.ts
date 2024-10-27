import { StaticAuthProvider } from "@twurple/auth";
import { ChatClient, ChatMessage } from "@twurple/chat";
import { neon } from "@neondatabase/serverless";
import { db } from "./src/db";
import { dbchannels, dbcommands, type SelectCommand } from "./src/schema";
import { eq } from "drizzle-orm";
import commands from "./src/commands";
import tmi from "tmi.js";

const main = async () => {
  const channelquery = await db
    .select()
    .from(dbchannels)
    .where(eq(dbchannels.status, true));
  const activecommands = await db
    .select()
    .from(dbcommands)
    .where(eq(dbcommands.status, true));

  const activechannel = channelquery.map((x) => x.channel) as string[];
  console.log(activechannel);
  // console.log(activecommands);
  connecttwitch(activechannel, activecommands);

  return;
};

const connecttwitch = (channels: string[], commandslist: SelectCommand[]) => {
  const clientId = Bun.env.CLIENT_ID!;
  const accessToken = Bun.env.BOT_OAUTH_TOKEN!;

  // reason why we use 2 different twitch client here are because
  // 1. twurple have a new feature like message reply, and tracking parent message id
  // 2. tmi js can send messages multiple times, so it would be used only to send array/ heavy text response.

  const tmiClient: tmi.Client = new tmi.Client({
    options: {
      debug: true,
    },
    connection: {
      reconnect: true,
      secure: true,
    },
    identity: {
      username: Bun.env.BOT_USERNAME,
      password: Bun.env.BOT_OAUTH_TOKEN,
    },
    channels: channels,
  });

  tmiClient.connect();

  const chatAuthProvider = new StaticAuthProvider(clientId, accessToken);

  const chatClient = new ChatClient({
    authProvider: chatAuthProvider,
    channels: channels,
  });

  chatClient.onMessage(
    async (
      channel: string,
      username: string,
      text: string,
      msg: ChatMessage,
    ) => {
      if (username === "bassnixbot") return;

      text = text.replace(/^@\w+\s*/, "").trim();

      console.log(text);

      let cmd = text.split(" ");
      if (msg.isReply) {
        const regex = /@[a-zA-Z0-9._]+/;

        const match = cmd[0].match(regex);

        if (match) {
          cmd.splice(0);
        }
      }

      const cmdSign = "!";
      if (text[0] !== cmdSign) return;

      if (cmd[0][0] === cmdSign) {
        if (cmd[0].length === 1)
          cmd = cmd.filter((command) => command !== cmd[0]);
        else cmd[0] = cmd[0].replace("!", "");
      }

      cmd = cmd.filter((text) => text !== "");

      commands(
        {
          channel,
          text: cmd,
          username,
          msg,
          client: chatClient,
          tmiClient: tmiClient,
        },
        commandslist,
      );
    },
  );

  chatClient.connect();
};

main();
