import {Command} from "discord-akairo";
import {checkCache} from "../api/bestdoriHelper";

class BDCacheCheckCommand extends Command {
    constructor() {
        super('cachecheck', {
            aliases: ['cachecheck']
        });
    }

    description = "Checks the status of the MasterDB cache"

    async exec(message) {
        const cacheStatus = await checkCache()

        const cacheStatusMsg = cacheStatus.map((value => {
            const status = (value.status) ? "up" : "down"
            return `\n${value.server}: ${status}`
        }))

        return message.channel.send(`Cache status:${cacheStatusMsg}`)
    }
}

module.exports = BDCacheCheckCommand;