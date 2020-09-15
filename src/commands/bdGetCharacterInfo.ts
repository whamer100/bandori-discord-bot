import { Command } from 'discord-akairo';
import {MessageAttachment, MessageEmbed} from 'discord.js'
import {getCharacterMeta, BDCharacter, SLanguageLocale, SLanguage} from "../api/bestdoriHelper"
import { closest } from "fastest-levenshtein"

class BDGetCharacterInfo extends Command {
    constructor() {
        super('getchar', {
            aliases: ['getchar'],
            args: [{
                id: "character"
            }]
        });
    }

    description = "Get info on a character."

    async exec(message, args) {
        // TODO: Get character data and return it
        // reminder of how attachments work for later lol
        // const attachment = new MessageAttachment(new Buffer(0), "attachment.png")

        const character = closest(args["character"], Object.keys(BDCharacter))

        const characterInfo = await getCharacterMeta(BDCharacter[character])
        if (characterInfo === undefined) {
            return message.channel.send("Unknown character!")
        }

        const characterURL = `https://bestdori.com/info/characters/${characterInfo.id}`
        const birthdayDate = new Date(characterInfo.birthday)
        const locale = SLanguageLocale[SLanguage.EN] // TODO: add server-based (or user-based) locales
        const localeOptions: Intl.DateTimeFormatOptions = {
            month: 'long', day: 'numeric', timeZone: "Japan" // timezone set to Japan due to server offset
        }
        const birthdayStr = birthdayDate.toLocaleDateString(locale, localeOptions)

        const characterIconName = `icon_character${characterInfo.id.toString().padStart(3, "0")}.png`
        const characterIconAttachment = new MessageAttachment(`./static/icons/${characterIconName}`, characterIconName, {width: 16})

        const embed = new MessageEmbed()
            .setTitle("Character Info")
            .setURL(characterURL)
            .addField("id:", characterInfo.id, true)
            .addField("name:", characterInfo.name, true)
            .addField("band:", characterInfo.band, true)
            .addField("instrument:", characterInfo.inst, true)
            .addField("birthday:", birthdayStr, true)
            .attachFiles([characterIconAttachment])
            .setThumbnail(`attachment://${characterIconName}`)

        return message.channel.send({embed});
    }
}

module.exports = BDGetCharacterInfo;