import type { ChatClient, ChatMessage, ChatUser } from "@twurple/chat";
import tmi from "tmi.js";

export interface APIResponse<T> {
    responseType: ApiResponseType | undefined;
    success: boolean;
    result: T | undefined;
    error: Error | undefined;
}

export interface APIRequest{
    messageId: string,
    channel: string,
    message: string,
    parentMessageId: string | undefined,
    userInfo: ChatUser
}

export interface Error {
    errorCode: string;
    errorMessage: string;
}

export interface EmoteCommandOptions {
    [args: string]: string | boolean | undefined;
}

// Define a clear type for the commands
export type Command = (
    cmdArgs: CommandArgs
) => void;

export interface CommandArgs{
    channel: string,
    text: string[],
    username: string,
    msg: ChatMessage,
    client: ChatClient,
    tmiClient: tmi.Client
}

export enum ApiResponseType {
    reply,
    message,
    message_array
}
