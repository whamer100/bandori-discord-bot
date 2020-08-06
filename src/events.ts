import { AkairoClient, CommandHandler } from "discord-akairo";
import { boxContents } from "./utils";

const logStartup = (client: AkairoClient, commandHandler: CommandHandler) => {
    const stat = `Logged in as ${client.user.tag} [id:${client.user.id}]`;
    const commands = commandHandler.modules.map(
        (mod) => `${process.env.PREFIX || "$"}${mod.id}: ${mod.description}`
    );
    const out = boxContents("Started Up!", stat, commands.join("\n"));
    console.log(out);
};

const onReady = (client: AkairoClient, commandHandler: CommandHandler) => {
    logStartup(client, commandHandler)
}

export const handleEvents = (client: AkairoClient, commandHandler: CommandHandler) => {
    client.on("ready", () => onReady(client, commandHandler));
}
