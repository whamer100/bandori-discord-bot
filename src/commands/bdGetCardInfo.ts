import { Command } from 'discord-akairo';
import {EmbedFieldData, MessageAttachment, MessageEmbed} from 'discord.js'
import {getCardData, getCharacterMeta, getGameResource, SLanguage} from "../api/bestdoriHelper"
import { distance, closest } from "fastest-levenshtein"
import {composeCardFrame} from "../api/sharpHelper";
import {wrapString} from "../utils";

// check if an input is "truthy" enough
const checkTrainedArg = (t: string): boolean => {
    const tmsg = t.toLowerCase()
    const trainedCheck = [
        "yes",
        "trained",
        "idolized"
    ]
    return trainedCheck.includes(tmsg)
        || ["true", "1"].includes(tmsg)
        || (distance(closest(tmsg, trainedCheck), tmsg) <= 1)
}

class BDGetCardInfo extends Command {
    constructor() {
        super('getcard', {
            aliases: ['getcard'],
            args: [{
                id: "card",
                type: "number",
                prompt: true
            },{
                id: "trained",
                type: "string",
                default: "false"
            }]
        });
    }

    description = "Get info on a card."

    async exec(message, args) {
        // TODO: Get card data and return it
        // reminder of how attachments work for later lol
        // const attachment = new MessageAttachment(new Buffer(0), "attachment.png")

        const resolvedArg = checkTrainedArg(args["trained"])

        const cardInfo = await getCardData(args["card"], resolvedArg, SLanguage.EN)

        if (cardInfo === undefined) {
            return message.channel.send("Unknown card id!")
        }
        const type = cardInfo.state

        const cardThumbFolder = `${Math.floor(cardInfo.id / 50)}`
// https://bestdori.com/assets/en/thumb/chara/card00011_rip/res003022_normal.png
        const cardResBase = `thumb/chara/card${cardThumbFolder.padStart(5, "0")}_rip/${cardInfo.resSetName}_${type}.png`
        const cardData = await getGameResource(cardResBase, SLanguage.JP, false)
        const cardName = `card_thumb_${cardInfo.resSetName}_${type}.png`
        /* const cardResBase = `characters/resourceset/${cardInfo.resSetName}_rip/card_${type}.png` */

        const cardMember = await getCharacterMeta(cardInfo.member, SLanguage.EN)

        const cardThumbBuffer = Buffer.from(new Uint8Array(cardData))
        const composedCardThumb = await composeCardFrame(cardThumbBuffer, cardInfo, resolvedArg)

        const cardAttachment = new MessageAttachment(composedCardThumb, cardName)

        const cardURL = `https://bestdori.com/info/cards/${cardInfo.id}`

        const embedFields: EmbedFieldData[] = [
            { name: "Card ID:", value: cardInfo.id, inline: true },
            { name: "Member:", value: cardMember.name, inline: true },
            { name: "Attribute:", value: cardInfo.attr, inline: true },
            // gachaText here (index = 3)
            { name: "Skill:", value: [
                    `Name: ${cardInfo.skillName}`,
                    `ID: ${cardInfo.skillId}`
                ].join("\n"), inline: true }
        ]
        // not always present
        if (cardInfo.gachaText !== null) embedFields.splice(
            3, 0, { name: "Gacha Text:", value: wrapString(cardInfo.gachaText), inline: true }
            )

        const embed = new MessageEmbed()
            .setTitle(cardInfo.prefix)
            .setURL(cardURL)
            .addFields(embedFields)
            .attachFiles([cardAttachment])
            .setThumbnail(`attachment://${cardName}`)


        return message.channel.send({embed});
    }
}

module.exports = BDGetCardInfo;