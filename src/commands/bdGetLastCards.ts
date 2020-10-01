import {Command} from 'discord-akairo';
import {EmbedFieldData, MessageEmbed} from "discord.js";
import {
    BDCharacter,
    getBand,
    getCharacterMeta,
    getLatestCard,
    getMetaMember,
    MMType,
    SLanguage,
    SServer
} from "../api/bestdoriHelper";
import {QuickScore} from "quick-score";


class BDLastCardCommand extends Command {
    constructor() {
        super('bdlast', {
            aliases: ['bdlast'],
            args: [{
                id: "source",
                type: "string",
                prompt: true
            },{
                id: "server",
                type: "string",
                default: SServer["0"] // "jp"
            }]
        });
    }

    description = "Get the last cards from a specified source."

    async exec(message, args) {

        const target = await getMetaMember(MMType.MAny, args["source"])
        const qs = new QuickScore(Object.keys(SLanguage))
        const targetServerQS: string = qs.search(args["server"])[0].item
        const targetServer: number = SLanguage[targetServerQS]

        if (target === undefined) {
            return message.channel.send("No result!")
        }

        const bandData = (target.type === MMType.MBand) ? await getBand(target.item) : undefined

        const itemField: EmbedFieldData[] = []
        const cardField: Buffer[] = []

        if (target.type === MMType.MBand) {
            const memberMapPromise = bandData.members.map(async member => {
                const memberItem = await getLatestCard(member, targetServer)
                return memberItem.id
            })
            const memberMap = await Promise.all(memberMapPromise)
            itemField.push({ name: "Latest Cards:", value: `{ ${memberMap.join(", ")} }`, inline: true })
        } else {
            const targetMember = await getMetaMember(MMType.MMember, target.item, true)
            const targetMemberInfo = await getCharacterMeta(BDCharacter[targetMember.item])
            const latestCard = await getLatestCard(targetMemberInfo, targetServer)
            itemField.push({ name: "Latest Card:", value: latestCard.id, inline: true })
        }

        itemField.push({ name: "Type:", value: (target.type) ? "Band" : "Member", inline: true })

        //TODO: Have the thing get all the needed information for the latest cards
        //TODO: Create an image showing the cards and their latest release

        const embed = new MessageEmbed()
            .addFields(itemField)
        /*
            .setTitle(cardInfo.prefix)
            .setURL(cardURL)
            .addFields(embedFields)
            .attachFiles([cardAttachment])
            .setThumbnail(`attachment://${cardName}`)
        /**/


        return message.channel.send({embed});
    }
}

module.exports = BDLastCardCommand;