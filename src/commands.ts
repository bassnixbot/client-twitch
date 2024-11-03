import ping from "./commands/ping";
import emotes from "./commands/emotes";
import {
  ApiResponseType,
  type APIResponse,
  type Command,
  type CommandArgs,
} from "./types";
import type { SelectCommand } from "./schema";
import axios from "axios";

// Use a Record for efficient command lookup
const localcommandslist: Record<string, Command> = {
  ping, // Reference the ping function directly
  emote: emotes,
};

const servicesurls = [
  {
    service: "aichatbot",
    url: Bun.env.AICHATBOT_SERVICE_URL,
  },
  {
    service: "emote",
    url: Bun.env.EMOTE_SERVICE_URL,
  },
  {
    service: "general",
    url: Bun.env.GENERAL_SERVICE_URL,
  },
  {
    service: "reminder",
    url: Bun.env.REMINDER_SERVICE_URL,
  },
];

const commands = async (
  cmdArgs: CommandArgs,
  dbcommandsList: SelectCommand[],
) => {
  const command = cmdArgs.text[0].toLowerCase().trim();
  const dbcommand = dbcommandsList.find(
    (x) => command === x.commandName.toLowerCase(),
  );

  const message = cmdArgs.text
    .filter((x) => x.toLowerCase() !== command)
    .join(" ");

  if (command in localcommandslist) {
    localcommandslist[command](cmdArgs); // Pass arguments during execution
  } else if (dbcommand !== undefined) {
    const serviceUrl = servicesurls.find(
      (x) => x.service === dbcommand.service,
    );

    if (serviceUrl === undefined) return;

    const commandUrl = `${serviceUrl.url}${dbcommand.commandPath}`;

    const queryParams = {
      messageId: cmdArgs.msg.id,
      channel: cmdArgs.channel,
      message: message,
      parentMessageId: cmdArgs.msg.threadMessageId,
      userInfo: {
        userName: cmdArgs.msg.userInfo.userName,
        displayName: cmdArgs.msg.userInfo.displayName,
        color: cmdArgs.msg.userInfo.color,
        badges: cmdArgs.msg.userInfo.badges,
        badgeInfo: cmdArgs.msg.userInfo.badgeInfo,
        userId: cmdArgs.msg.userInfo.userId,
        userType: cmdArgs.msg.userInfo.userType,
        isBroadcaster: cmdArgs.msg.userInfo.isBroadcaster,
        isSubscriber: cmdArgs.msg.userInfo.isSubscriber,
        isFounder: cmdArgs.msg.userInfo.isFounder,
        isMod: cmdArgs.msg.userInfo.isMod,
        isVip: cmdArgs.msg.userInfo.isVip,
        isArtist: cmdArgs.msg.userInfo.isArtist,
      },
    };

    try {

      const response = await axios.post<APIResponse<any>>(
        commandUrl,
        queryParams,
      );

      if (!response.data.success) {
        const errMsg = response.data.error?.errorMessage as string;
        cmdArgs.client.say(cmdArgs.channel, errMsg);
        return;
      }

      switch (response.data.responseType) {
        case ApiResponseType.reply:
          cmdArgs.client.say(cmdArgs.channel, response.data.result, {
            replyTo: cmdArgs.msg,
          });
          break;

        case ApiResponseType.message:
          cmdArgs.client.say(cmdArgs.channel, response.data.result);
          break;

        case ApiResponseType.message_array:
          const messageArray = response.data.result as string[];
          messageArray.forEach((element) => {
            cmdArgs.tmiClient.say(cmdArgs.channel, element);
          });
          break;

        default:
          break;
      }
    } catch (error) {
      console.error('An error occurred during the Axios call:', error);
      // Handle the error or retry the request if needed
    }
  } else {
    console.log("Command not found");
  }
};

export default commands;
