require('dotenv').config()
import { AkairoClient, CommandHandler  } from "discord-akairo";
import { handleEvents } from "./events";
import { updateMasterDB } from "./api/bestdoriHelper"
import "./startup"

const prefix = process.env.PREFIX || "b!";
const TOKEN = process.env.TOKEN!

export class BotClient extends AkairoClient {
    public commandHandler: CommandHandler;

    constructor() {
        super({
            ownerID: [],
        }, {
            disableMentions: "everyone"
        });
        this.commandHandler = new CommandHandler(this, {
            directory: "./dist/commands/",
            prefix: prefix
        })
    }
}

const client = new BotClient();
client.commandHandler.loadAll()

export const commandCollection = client.commandHandler.modules

handleEvents(client)

updateMasterDB().catch((reason => {
    console.log(`MasterDB update failed for reason ${reason}!`)
    process.exit(1)
}))

console.log("Connecting bot...")
// noinspection JSIgnoredPromiseFromCall becasue im annoying
client.login(TOKEN);

