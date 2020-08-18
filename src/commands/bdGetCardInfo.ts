import { Command } from 'discord-akairo';
import {MessageAttachment, MessageEmbed} from 'discord.js'
import {getCardData, getGameResource, SLanguage} from "../api/bestdoriHelper"
import { distance, closest } from "fastest-levenshtein"
import {composeCardFrame} from "../api/sharpHelper";

const trainedCheck = [
    "yes",
    "trained",
    "idolized"
]

// check if an input is "truthy" enough
const checkTrainedArg = (t: string): boolean => {
    const tmsg = t.toLowerCase()
    return trainedCheck.includes(tmsg) || ["true", "1"].includes(tmsg) || (distance(closest(tmsg, trainedCheck), tmsg) <= 1)
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
        const cardData = await getGameResource(cardResBase, SLanguage.EN, false)
        const cardName = `card_thumb_${cardInfo.resSetName}_${type}.png`
        /* const cardResBase = `characters/resourceset/${cardInfo.resSetName}_rip/card_${type}.png` */

        const cardThumbBuffer = Buffer.from(new Uint8Array(cardData))
        const composedCardThumb = await composeCardFrame(cardThumbBuffer, cardInfo)

        const cardAttachment = new MessageAttachment(composedCardThumb, cardName)

        const cardURL = `https://bestdori.com/info/cards/${cardInfo.id}`

        // TODO: Make the image thing

        const embed = new MessageEmbed()
            .setTitle(cardInfo.prefix)
            .setURL(cardURL)
            .addField("id:", cardInfo.id, true)
            .addField("memberid:", cardInfo.member, true)
            .addField("attribute:", cardInfo.attr, true)
            .addField("rarity:", cardInfo.rarity, true)
            .attachFiles([cardAttachment])
            .setImage(`attachment://${cardName}`)


        return message.channel.send(embed);
    }
}

module.exports = BDGetCardInfo;