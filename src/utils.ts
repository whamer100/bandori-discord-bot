import { GuildMember } from "discord.js"
import R = require("ramda");
import { chain } from "ramda";

export const boxContents = (...texts: string[]) => { // borrowed from another bot, thanks xetera o/
    const getLines = (text: string) => text.split("\n").map((line) => line.length);
    const splitTexts = chain(getLines);
    const maxLength = Math.max(...splitTexts(texts));
    const [head, ...tail] = texts;

    const spacer = "-".repeat(maxLength);
    return tail.reduce((all, text) => [...all, text, spacer], [spacer, head, spacer]).join("\n");
};

export const isOwner = (id: string): boolean => (process.env.OWNERS || "136644132117413888")
    .split(",")
    .some(R.equals(id));


export const isMod = (member: GuildMember): boolean =>
  member.hasPermission("KICK_MEMBERS") || isOwner(member.id)
