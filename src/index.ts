require('dotenv').config()
import { AkairoClient, CommandHandler  } from "discord-akairo";
import { handleEvents } from "./events";
import "./startup"

const prefix = process.env.PREFIX || "b!";
const TOKEN = process.env.TOKEN!

const client = new AkairoClient(
    {
        ownerID: [],
    }, {
        disableMentions: "everyone"
    }
);

const commandHandler = new CommandHandler(client, {
    directory: "./dist/commands/",
    prefix: prefix
}).loadAll();

handleEvents(client, commandHandler)

console.log("Connecting bot...")
client.login(TOKEN);

