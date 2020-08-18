import {Command} from 'discord-akairo';

class TestCommand extends Command {
    constructor() {
        super('test', {
            aliases: ['test']
        });
    }

    description = "This is a test command."

    exec(message) {
        return message.reply('If you can see this, then this is working!');
    }
}

module.exports = TestCommand;