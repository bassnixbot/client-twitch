import type { ChatClient, ChatMessage } from "@twurple/chat";
import {
    HumanizeDuration,
    HumanizeDurationLanguage,
} from "humanize-duration-ts";
import type { CommandArgs } from "../types";
import commandlogger from "../utils/commandlogger";

const ping = (
    cmdArgs: CommandArgs
) => {
    const uptimeInNano = Bun.nanoseconds();
    const uptimeInMillis = Math.floor(uptimeInNano / 1000000);

    const humanizeDuration = new HumanizeDuration(new HumanizeDurationLanguage());
    const formattedTime = humanizeDuration.humanize(uptimeInMillis, {
        largest: 2,
        round: true,
        delimiter: " and ",
    });

    const message = `MrDestructoid bot (V2) has been running for ${formattedTime} pong.`;
 
    commandlogger.info(
        `[#${cmdArgs.channel}] <${cmdArgs.username}>: response command - ping; args - ${message}`,
    );

    cmdArgs.client.say(
        cmdArgs.channel,
        message,
        {replyTo: cmdArgs.msg}
    );
};

export default ping;
