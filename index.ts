import { StaticAuthProvider } from "@twurple/auth";
import { ChatClient, ChatMessage } from "@twurple/chat";
import { neon } from "@neondatabase/serverless";
import { db } from "./src/db";
import { dbchannels, dbcommands, type SelectCommand } from "./src/schema";
import { eq } from "drizzle-orm";
import { config } from "dotenv";
import commands from "./src/commands";
import tmi from "tmi.js";
import logger from "./src/utils/logger";
import commandlogger from "./src/utils/commandlogger";
import errorlog from "./src/utils/errorlog";
import { serve } from "bun";

config({ path: ".env" });

// Load JOIN_LIMIT and JOIN_INTERVAL from environment variables
const JOIN_LIMIT = parseInt(process.env.JOIN_LIMIT || "20", 10); // Default to 20 if not set
const JOIN_INTERVAL = parseInt(process.env.JOIN_INTERVAL || "10000", 10); // Default to 10000ms if not set
let isConnected = false;

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
        channels: [],
    });

    tmiClient.connect();

    const chatAuthProvider = new StaticAuthProvider(clientId, accessToken);

    const chatClient = new ChatClient({
        authProvider: chatAuthProvider,
        rejoinChannelsOnReconnect: true,
        channels: [],
    });

    chatClient.onMessage(
        async (
            channel: string,
            username: string,
            text: string,
            msg: ChatMessage,
        ) => {
            logger.info(`[#${channel}] <${username}>: ${text}`);
            if (username === "bassnixbot") return;

            text = text.replace(/^@\w+\s*/, "").trim();

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

    chatClient.onConnect(() => {
        console.log('joining channels...');

        // join the channel set interval
        const intervalId = setInterval(() => {
            if (channels.length > 0) {
                joinChannelsBatch(channels, chatClient, tmiClient);
            } else {
                isConnected = true;
                clearInterval(intervalId);
                console.log('bot connected');
            }
        }, JOIN_INTERVAL);
    });

    chatClient.onDisconnect((manually, reason) => {
        isConnected = false;
        errorlog.error(reason);
        console.log(reason);
    });

    // Attempt to reconnect every 30 seconds if disconnected
    chatClient.onDisconnect(() => {
        setTimeout(() => {
            if (!isConnected) {
                chatClient.reconnect();
            }
        }, 30000);
    });

    chatClient.connect();
};

// Function to join a batch of channels
const joinChannelsBatch = async (
    channels: string[],
    client: ChatClient,
    tmiClient: tmi.Client,
) => {
    const channelsBatch = channels.splice(0, JOIN_LIMIT);
    await Promise.all(
        channelsBatch.map(async (channel) => {
            try {
                await client.join(channel);
                await tmiClient.join(channel);

                console.log(`Successfully joined #${channel}`);
            } catch (error) {
                console.error(`Error joining ${channel}:`, error);
            }
        }),
    );
};

main().catch((error) => {
    commandlogger.info(`error at main - ${error}`);
});

// Health check endpoint
serve({
    fetch(req) {
        if (req.url.endsWith("/healthcheck")) {
            if (isConnected) {
                return new Response("OK", { status: 200 });
            } else {
                return new Response("Disconnected", { status: 500 });
            }
        }
        return new Response("Not Found", { status: 404 });
    },
    port: 80,
});
