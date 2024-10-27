import axios from "axios";
import type { APIResponse, Command, CommandArgs, EmoteCommandOptions } from "../types";

const emotes = async (
    cmdArgs: CommandArgs
) => {
    cmdArgs.text = cmdArgs.text.slice(1);
    const command = cmdArgs.text[0];
    const cmdoptions: EmoteCommandOptions = {};

    const clientInfo= {
      messageId: cmdArgs.msg.id,
      channel: cmdArgs.channel,
      message:cmdArgs.msg.text,
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
    
    let contentStartIndex = -1; // Index where message content starts
    console.log(cmdArgs.channel);

    for (let i = 1; i < cmdArgs.text.length; i++) {
        if (cmdArgs.text[i].startsWith("-")) {
            if (cmdArgs.text[i].startsWith("--")) {
                const flagName = cmdArgs.text[i].slice(2); // Remove "--"
                cmdoptions[flagName] = true;
            } else {
                const flag = cmdArgs.text[i].slice(1);
                const value = i + 1 < cmdArgs.text.length ? cmdArgs.text[i + 1] : undefined;
                cmdoptions[flag] = value;
                i++;
            }
        } else {
            contentStartIndex = i;
            break;
        }
    }

    const content = contentStartIndex !== -1 ? cmdArgs.text.slice(contentStartIndex) : "";

    if (!content) {
        cmdArgs.client.say(cmdArgs.channel, "Please provide the command argument", {replyTo: cmdArgs.msg});
        return;
    }

    let response: string | undefined;
    
    switch (command) {
        case "search":
            let queryparams;

            if (cmdoptions["tag"]) {
                queryparams = {
                    channel: cmdArgs.channel,
                    tags: content[0],
                };
            } else {
                queryparams = {
                    channel: cmdArgs.channel,
                    query: content[0],
                };
            }

            response = await emoteSearch(queryparams);
            break;

        case "preview":
            const previewquerybody = {
                source: cmdoptions["source"],
                targetemotes: content,
            };

            const apiurl_preview = `${Bun.env.EMOTE_SERVICE_URL}/emotes/preview`;
            response = await runEmoteAPI(previewquerybody, apiurl_preview);
            break;

        case "remove":
            // check for perms
            const permcheckremove = await checkseventvpermission(
                cmdArgs.username!!,
                cmdArgs.channel,
            );

            if (!permcheckremove?.success) {
                response = permcheckremove?.error?.errorMessage;
                break;
            }

            const removequerybody = {
                targetemotes: content,
                targetchannel: cmdArgs.channel,
                clientInfo: clientInfo
            };

            const apiurl_remove = `${Bun.env.EMOTE_SERVICE_URL}/emotes/remove`;
            response = await runEmoteAPI(removequerybody, apiurl_remove);
            break;

        case "add":
            // args check
            if (cmdoptions["source"] && cmdoptions["owner"]) {
                response =
                    "bassni2Pout please put only one emote target. Either owner or source";
                break;
            }

            // check for perms
            const permcheckadd = await checkseventvpermission(
                cmdArgs.username!!,
                cmdArgs.channel,
            );

            if (!permcheckadd?.success) {
                response = permcheckadd?.error?.errorMessage;
                break;
            }

            const isdefault = cmdoptions["default"] ? true : false;

            const addquerybody = {
                source: cmdoptions["source"],
                owner: cmdoptions["owner"],
                emoterename: cmdoptions["rename"],
                defaultname: isdefault,
                targetemotes: content,
                targetchannel: cmdArgs.channel,
                clientInfo: clientInfo
            };

            const apiurl_add = `${Bun.env.EMOTE_SERVICE_URL}/emotes/add`;
            response = await runEmoteAPI(addquerybody, apiurl_add);
            break;

        case "steal":
        case "yoink":

            // dont do perm check bc yoink
            // // check for perms
            // const permcheckyoink = await checkseventvpermission(
            //     cmdArgs.username!!,
            //     cmdArgs.channel,
            // );

            // if (!permcheckadd?.success) {
            //     response = permcheckadd?.error?.errorMessage;
            //     break;
            // }

            const isYoinkDefault = cmdoptions["default"] ? true : false;

            const yoinkquerybody = {
                source: cmdoptions["source"],
                owner: cmdoptions["owner"],
                emoterename: cmdoptions["rename"],
                defaultname: isYoinkDefault,
                targetemotes: content,
                targetchannel: clientInfo.userInfo.userName,
                clientInfo: clientInfo
            };

            const apiurl_yoink = `${Bun.env.EMOTE_SERVICE_URL}/emotes/add`;
            response = await runEmoteAPI(yoinkquerybody, apiurl_yoink);
            break;

        case "rename":
            // check for perms
            const permcheckrename = await checkseventvpermission(
                cmdArgs.username!!,
                cmdArgs.channel,
            );

            if (!permcheckrename?.success) {
                response = permcheckrename?.error?.errorMessage;
                break;
            }

            const targetemote = content[0];
            const emoterename = cmdoptions["default"] ? "" : content[1];

            const querybody_rename = {
                targetemotes: [targetemote],
                emoterename: emoterename,
                targetchannel: cmdArgs.channel,
                clientInfo: clientInfo
            };

            const apiurl_rename = `${Bun.env.EMOTE_SERVICE_URL}/emotes/rename`;
            response = await runEmoteAPI(querybody_rename, apiurl_rename);
            break;

        default:
            break;
    }

    console.log(response);
    if (response) {
        cmdArgs.client.say(cmdArgs.channel, response, {replyTo: cmdArgs.msg});
    }
};

const emoteSearch = async (queryparams: any): Promise<string | undefined> => {
    var apiurl = `${Bun.env.EMOTE_SERVICE_URL}/emotes/searchemotes`;

    try {
        const response = await axios.get<APIResponse<string[]>>(apiurl, {
            params: queryparams,
        });

        if (!response.data.success) {
            return response.data.error?.errorMessage;
        }

        if (response.data.result?.length === 0) {
            return "No emote found";
        }

        return response.data.result?.join(" ");
    } catch (error: any) {
        if (!error?.response?.data)
            return "There was an error while running the command";

        const addEmoteError = error.response.data as APIResponse<string>;
        return addEmoteError.error?.errorMessage;
    }
};

const runEmoteAPI = async (
    querybody: any,
    apiurl: string,
): Promise<string | undefined> => {
    console.log(querybody);

    try {
        const response = await axios.post<APIResponse<string>>(apiurl, querybody);

        if (!response.data.success) {
            return response.data.error?.errorMessage;
        }

        return response.data.result;
    } catch (error: any) {
        if (!error?.response?.data)
            return "There was an error while running the command";

        const apiError = error.response.data as APIResponse<string>;
        return apiError.error?.errorMessage;
    }
};

const checkseventvpermission = async (
    username: string,
    channel: string,
): Promise<APIResponse<string> | undefined> => {
    const apiurl = `${Bun.env.EMOTE_SERVICE_URL}/emotes`;
    channel = channel;

    try {
        const getBotAccess = await axios.get<APIResponse<string[]>>(
            `${apiurl}/getusereditoraccess`,
            {
                params: {
                    user: "bassnixbot",
                },
            },
        );

        if (
            !getBotAccess.data.result!!.includes(channel.toLowerCase()) &&
            channel !== "bassnixbot"
        )
            return {
                success: false,
                error: {
                    errorMessage:
                        "Gulp bot dont have the 7tv editor access in this channel",
                    errorCode: "1002",
                },
                result: undefined,
                responseType: undefined
            };

        const getChannelEditorAccess = await axios.get<APIResponse<string[]>>(
            `${apiurl}/getchanneleditors`,
            {
                params: {
                    user: channel,
                },
            },
        );

        if (
            !getChannelEditorAccess.data.result!!.includes(username) &&
            username !== channel
        )
            return {
                success: false,
                error: {
                    errorMessage: "bassni2Pout only 7tv editor can modify the emotes",
                    errorCode: "1003",
                },
                result: undefined,
                responseType: undefined
            };

        return {
            success: true,
            error: undefined,
            result: undefined,
            responseType: undefined
        };
    } catch (error: any) {
        console.log(error);
        if (!error?.response?.data)
            return {
                success: false,
                error: {
                    errorMessage: "There was an error while running the command",
                    errorCode: "1001",
                },
                result: undefined,
                responseType: undefined
            };

        const permcheckError = error.response.data as APIResponse<string>;
        return permcheckError;
    }
};

export default emotes;
