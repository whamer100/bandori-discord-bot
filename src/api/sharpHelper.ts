import * as sharp from "sharp"
import {BDBand, CardInfo, CharacterInfo, getCharacterMeta} from "./bestdoriHelper";
import {readFile} from "fs/promises";
import {gravity, OverlayOptions, Sharp} from "sharp";
import * as NodeCache from "node-cache";

const frameBase = "./static/frame"
const SharpCacheExpiryTime = 60 * 60 * 4 // 4 hours -> 14400 seconds

const sharpOptions: sharp.SharpOptions = {
    sequentialRead: true
}

const SharpCache = new NodeCache({
    stdTTL: SharpCacheExpiryTime,
    checkperiod: 120,
    useClones: false
})

const readAndCacheAsset = async (loc: string): Promise<Buffer> => {
    const ttl = SharpCache.getTtl(loc)
    if (ttl === undefined || ttl === 0) {
        const filePath = `${frameBase}/${loc}`
        const fileBuf = await readFile(filePath)

        SharpCache.set(loc, fileBuf, SharpCacheExpiryTime)
    }
    return SharpCache.get(loc)
}

const selectFrame = async (cardInfo: CardInfo): Promise<Buffer> => {
    const rarity = cardInfo.rarity
    if      (rarity === 4) return readAndCacheAsset("/frame_ss_rainbow.png")
    else if (rarity === 3) return readAndCacheAsset(`/frame_s_gold.png`)
    else if (rarity === 2) return readAndCacheAsset(`/frame_r_silver.png`)
    else if (rarity === 1) return readAndCacheAsset(`/frame_n_${cardInfo.attr}.png`)
}

const selectBandmark = async (cardInfo: CardInfo): Promise<Buffer> => {
    const member: CharacterInfo = await getCharacterMeta(cardInfo.member)
    const bandmark: string = BDBand[member.bandId]
    return readAndCacheAsset(`/bandmark_${bandmark}.png`)
}

export const composeCardFrame = async (cardThumb: Buffer, cardInfo: CardInfo): Promise<Buffer> => {
    const composite = sharp(cardThumb, sharpOptions)
    const metadata = await composite.metadata()
    const selectedFrame = await selectFrame(cardInfo)
    const selectedAttr = await readAndCacheAsset(`/icon_attribute_${cardInfo.attr}.png`)
    const selectedBandmark = await selectBandmark(cardInfo)

    composite.composite([{
        input: selectedFrame,
        left: 0,
        top: 0
    },{
        input: selectedAttr,
        top: 1,
        left: metadata.width
    },{
        input: selectedBandmark,
        left: 0,
        top: 0
    }
    ])

    return composite.toBuffer()
}