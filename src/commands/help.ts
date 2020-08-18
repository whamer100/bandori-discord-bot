import {Command} from 'discord-akairo';
import {MessageEmbed, GuildMember, ImageURLOptions} from "discord.js";
import {commandCollection} from "../index";

class HelpCommand extends Command {
    constructor() {
        super('help', {
            aliases: ['help']
        });
    }

    description = "Shows this message."

    async exec(message) {
        const invoker: GuildMember = message.member
        const avatarOptions: ImageURLOptions = {
            format: "png",
            size: 32
        }

        const commandList: string[] = commandCollection.map(
            (mod) => `${process.env.PREFIX || "$"}${mod.id}: ${mod.description}`
        )
        // TODO: make this have pages and categories

        const embed = new MessageEmbed()
            .setAuthor(invoker.nickname, invoker.user.avatarURL(avatarOptions))
            .addField("Commands", commandList.join("\n"))

        return message.reply(embed);
    }
}

module.exports = HelpCommand;