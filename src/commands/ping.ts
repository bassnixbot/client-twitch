import type { ChatClient, ChatMessage } from "@twurple/chat";
import {
    HumanizeDuration,
    HumanizeDurationLanguage,
} from "humanize-duration-ts";
import type { CommandArgs } from "../types";

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

    cmdArgs.client.say(
        cmdArgs.channel,
        `MrDestructoid bot (V2) has been running for ${formattedTime} pong.`,
        {replyTo: cmdArgs.msg}
    );
};

export default ping;
