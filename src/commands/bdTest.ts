import {Command} from 'discord-akairo';
import {getTestData} from "../api/bestdoriHelper"

class BDTestCommand extends Command {
    constructor() {
        super('bdtest', {
            aliases: ['bdtest']
        });
    }

    description = "Test bestdori api command for testing."

    async exec(message) {
        const testDate = await Promise.all(await getTestData())
        const dates: string[] = []

        testDate.forEach((value) => {
            dates.push(` - Server \`${value.server}\`: \`${new Date(value.date)}\``)
        })

        const testDateMsg = dates.join("\n")

        return message.reply(`Server dates: \n${testDateMsg}`);
    }
}

module.exports = BDTestCommand;