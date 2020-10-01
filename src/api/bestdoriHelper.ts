import axios from "axios"

import * as NodeCache from "node-cache";
import {QuickScore} from "quick-score";

const bestdoriEndpoint = "https://bestdori.com/api"
const bestdoriResourceEndpoint = "https://bestdori.com/assets"
const MDBCacheExpiryTime = 60 * 60 * 4 // 4 hours -> 14400 seconds
const cacheExpiryTime = 60 * 4 // 4 minutes -> 240 seconds

const bandURL = "bands/main.1.json"
const charURL = "characters/all.2.json"
const cardURL = "cards/all.5.json"

const MasterDBCache = new NodeCache({
    stdTTL: MDBCacheExpiryTime,
    checkperiod: 120,
    useClones: false
})
const GameDataCache = new NodeCache({
    stdTTL: cacheExpiryTime,
    checkperiod: 15,
    useClones: false
})

type CacheStatus = { server: string, status: boolean }
type ServerDate = { server: string, date: number }
export type CharacterInfo = {
    id: number,
    name: string,
    band: string,
    bandId: number
    inst: string,
    birthday: number
}
export type CardInfo = {
    id: number,
    state: string,
    member: number,
    rarity: number,
    attr: string,
    resSetName: string,
    costumeId: number,
    prefix: string,
    gachaText: string,
    releasedAt: string,
    skillName: string,
    skillId: number,
    type: string
}
export type Band = {
    bandID: number,
    bandName: string,
    members: CharacterInfo[]
}

type CardAssort = {
    cardId: number,
    characterId: number,
    cardReleased: string[]
}

type CardAssortMap = {
    [characterId: string]: CardAssort[]
}

export const Server = { // for use with cache generation
    JP: "jp",
    EN: "en"
}
export const SServer = {
    0: "jp",
    1: "en",
    2: "tw",
    3: "cn",
    4: "kr"
}
export const SLanguage = {
    JP: 0,
    EN: 1,
    TW: 2,
    CN: 3,
    KR: 4
}
export const SLanguageLocale = {
    0: "ja-JP",
    1: "en-US",
    2: "zh-TW",
    3: "zh-CN",
    4: "ko-KR"
}

export const BDBand = {
    1: "popipa",
    2: "after",
    3: "harohapi",
    4: "paspale",
    5: "roselia",
    18: "raiseasuilen",
    21: "morfonica"
}
export const BDCharacter = {
    // Poppin' Party
    Kasumi: 1,
    Tae: 2,
    Rimi: 3,
    Saaya: 4,
    Arisa: 5,
    // Afterglow
    Ran: 6,
    Moca: 7,
    Himari: 8,
    Tomoe: 9,
    Tsugumi: 10,
    // Hello, Happy World!
    Kokoro: 11,
    Kaoru: 12,
    Hagumi: 13,
    Kanon: 14,
    Misaki: 15,
    // Pastel*Palettes
    Aya: 16,
    Hina: 17,
    Chisato: 18,
    Maya: 19,
    Eve: 20,
    // Roselia
    Yukina: 21,
    Sayo: 22,
    Lisa: 23,
    Ako: 24,
    Rinko: 25,
    // Morfonica
    Mashiro: 26,
    Touko: 27,
    Nanami: 28,
    Tsukushi: 29,
    Rui: 30,
    // RAISE A SUILEN
    Rei: 31,
    Rokka: 32,
    Masuki: 33,
    Reona: 34,
    Chiyu: 35,
} // List of characters w/ IDs
const BDPart = {
    "vocal": "Vocals",
    "guitar": "Guitar",
    "base": "Bass",
    "drum": "Drums",
    "keyboard": "Keyboard",
    "dj": "DJ",
    "violin": "Violin",
    "base_vocal": "Bass & Vocals",
    "guitar_vocal": "Guitar & Vocals"
}
export const MMType = {
    MMember: 0,
    MBand: 1,
    MAny: 2
}

export const updateMasterDB = async () => {
    console.log("\nInitializing MasterDB cache...")
    for (const k in Server) {
        const s = Server[k]
        const ttl = MasterDBCache.getTtl(s)
        if (ttl === undefined || ttl === 0) {
            console.log(` - Caching MasterDB_${s}.json`)
            const requestURL = `${bestdoriEndpoint}/MasterDB_${s}.json`

            const resp = await axios.get(requestURL)
            if (resp.status !== 200) {
                throw `Server ${s} failed to cache!`
            }
            const respData: JSON = resp.data

            MasterDBCache.set(s, respData, cacheExpiryTime)
        }
    }
    console.log("Initial caching completed successfully.")
}

export const checkCache = async (): Promise<CacheStatus[]> => {
    return Object.values(Server).map((k) => {
        return { "server": k, "status": MasterDBCache.getTtl(k) >= 0 }
    })
}

export const getMasterDB = async (server: string): Promise<JSON> => {
    const ttl = MasterDBCache.getTtl(server)
    if (ttl === undefined || ttl === 0) {
        const requestURL = `${bestdoriEndpoint}/MasterDB_${server}.json`

        const resp = await axios.get(requestURL)
        const respData: JSON = resp.data

        MasterDBCache.set(server, respData, cacheExpiryTime)
    }

    return MasterDBCache.get(server)
}

export const getGameData = async (loc: string): Promise<JSON> => {
    const ttl = GameDataCache.getTtl(loc)
    if (ttl === undefined || ttl === 0) {
        const requestURL = `${bestdoriEndpoint}/${loc}`

        const resp = await axios.get(requestURL).catch(() => undefined)
        if (resp === undefined || resp.status !== 200) {
            return Promise.resolve(undefined)
        }

        const respData: JSON = resp.data

        GameDataCache.set(loc, respData, cacheExpiryTime)
    }

    return GameDataCache.get(loc)
}

export const getGameResource = async (loc: string, server: number, cache?: boolean): Promise<ArrayBuffer> => {
    const resourceURL = `${bestdoriResourceEndpoint}/${SServer[server]}/${loc}`
    const resourceID = `${server}::${loc}`
    if (cache) {
        const ttl = GameDataCache.getTtl(resourceID)
        if (ttl === undefined || ttl === 0) {
            const resp = await axios.get(resourceURL, {responseType: 'arraybuffer'}).catch(() => undefined)

            if (resp === undefined || resp.status !== 200) {
                return Promise.resolve(undefined)
            }

            const respData: ArrayBuffer = resp.data

            GameDataCache.set(resourceID, respData, cacheExpiryTime)
        }
        return GameDataCache.get(resourceID)
    }
    else {
        const resp = await axios.get(resourceURL, {responseType: 'arraybuffer'}).catch(() => undefined)

        if (resp === undefined || resp.status !== 200) {
            return Promise.resolve(undefined)
        }

        return resp.data
    }
}

export const getTestData = async (): Promise<Promise<ServerDate>[]>  => {
    return Object.values(Server).map(async (k) => {
        const mdbData = await getMasterDB(k)
        const serverDate = mdbData["system"]["serverDate"]

        return { "server": k, "date": +serverDate }
    })
}

export const selectEntry = (options: JSON | Object, language: number) => {
    const option = options[language] // initial check
    if (option === null) {
        const optionEN = options[SLanguage.EN]
        const optionJP = options[SLanguage.JP]
        if (optionEN === null) {
            return optionJP // Always at least return JP, even if undefined
        }
        return optionEN // EN prioritized
    }
    return option // requested entry found
}

export const getCharacterMeta = async (character: number, language = SLanguage.EN): Promise<CharacterInfo> => {
    const characterData: JSON = await getGameData(`characters/${character}.json`)
    const bandNames: JSON = await getGameData(bandURL)
    if (characterData === undefined) {
        return Promise.resolve<CharacterInfo>(undefined)
    }
    const charName: string = characterData["characterName"][language]
    const bandID: number = characterData["bandId"]
    const bandStruct: JSON = bandNames[bandID]["bandName"]
    const bandName: string =  selectEntry(bandStruct, language)
    const part: string = characterData["profile"]["part"]
    const instrument: string = BDPart[part]
    const birthday: number = +characterData["profile"]["birthday"]

    const characterInfo: CharacterInfo = {
        id: character,
        name: charName,
        band: bandName,
        bandId: bandID,
        inst: instrument,
        birthday: birthday
    }

    return Promise.resolve<CharacterInfo>(characterInfo)
}

export const getCardData = async (id: number, trained: boolean = false, language: number): Promise<CardInfo>  => {
    const cardData = await getGameData(`cards/${id}.json`)
    if (cardData === undefined) {
        return Promise.resolve<CardInfo>(undefined)
    }
    const cardInfo: CardInfo = {
        id: id,
        state: (trained && cardData["rarity"] >= 3) ? "after_training" : "normal",
        member: cardData["characterId"],
        attr: cardData["attribute"],
        rarity: cardData["rarity"],
        resSetName: cardData["resourceSetName"],
        costumeId: cardData["costumeId"],
        prefix: selectEntry(cardData["prefix"], language),
        gachaText: selectEntry(cardData["gachaText"], language),
        releasedAt: selectEntry(cardData["releasedAt"], language),
        skillName: selectEntry(cardData["skillName"], language),
        skillId: cardData["skillId"],
        type: cardData["type"]
    }

    return Promise.resolve<CardInfo>(cardInfo)
}

export const getMetaMember = async (type: number, str: string, useID: boolean = false) => {
    const bandJson = await getGameData(bandURL)

    const MMembersPromise: Promise<string>[] = Object.keys(BDCharacter).map(async (value: string) => {
        const characterMeta = await getCharacterMeta(BDCharacter[value])
        return characterMeta.name
    })
    const MBands: string[] = Object.keys(BDBand).map((value: string) => {
        return selectEntry(bandJson[value]["bandName"], SLanguage.EN)
    })
    const MMembers = await Promise.all(MMembersPromise)

    const MAny = [...MMembers, ...MBands]

    let qs;
    if        (type === MMType.MBand) {
        qs = new QuickScore(MBands)
    } else if (type === MMType.MMember) {
        qs = new QuickScore(MMembers)
    } else if (type === MMType.MAny) {
        qs = new QuickScore(MAny)
    }
    const res = qs.search(str)
    console.log(res)
    if (res.length === 0) {
        return undefined
    }
    const resItem = res[0]["item"]
    const typeCheck = () => {
        if (MBands.includes(resItem)) {
            return MMType.MBand
        } else
            return MMType.MMember
    }
    const getID = () => {
        if (type === MMType.MMember) {
            const bdk = Object.keys(BDCharacter)
            const qs = new QuickScore(bdk)
            const itemFirst = `${resItem}`.split(" ", 1)
            const char = qs.search(itemFirst[0])
            return char[0].item
        } else {
            const bdk = Object.values(BDBand)
            const qs = new QuickScore(bdk)
            const band = qs.search(resItem[0])
            const bandItem = band[0].item
            return Object.keys(BDBand)[bdk.indexOf(bandItem)]
        }
    }
    const retType = (type === MMType.MAny) ? typeCheck() : type
    return {
        item: (useID) ? getID() : resItem,
        type: retType
    }
}

export const getBandMembers = async (band: number): Promise<number[]> => {
    const charJson = await getGameData(charURL)
    const ttlKey = "band_data"
    const ttl = GameDataCache.getTtl(ttlKey)
    if (ttl === undefined || ttl === 0) {
        const characterValues = Object.values(BDCharacter)
        const bandMap: Map<number, number[]> = new Map<number, number[]>()
        characterValues.map((value) => {
            const charTemp = charJson[value]
            const charBandID = charTemp["bandId"]
            if (!(bandMap.hasOwnProperty(charBandID))) {
                bandMap[charBandID] = []
            }
            bandMap[charBandID].push(value)
        })

        GameDataCache.set(ttlKey, bandMap, cacheExpiryTime)
    }
    const targetBandMap = GameDataCache.get(ttlKey)
    return targetBandMap[band]
}

export const getBand = async (bandID: number | string): Promise<Band> => {
    const bandJson = await getGameData(bandURL)

    if (typeof bandID === "string") {
        const newBandID = await getMetaMember(MMType.MBand, bandID, true)
        bandID = newBandID.item
    }

    const bandObject = bandJson[bandID]["bandName"]
    const bandSelect: string = selectEntry(bandObject, SLanguage.EN)

    const bandMembersIDs = await getBandMembers(+bandID)
    const bandMembersPromise = bandMembersIDs.map(async value => {
        return await getCharacterMeta(value)
    })
    const bandMembers = await Promise.all(bandMembersPromise)

    return {
        bandID: +bandID,
        bandName: bandSelect,
        members: bandMembers
    }
}

const assortCards = async (): Promise<CardAssortMap> => {
    const cardJson = await getGameData(cardURL)
    const ttlKey = "card_data"
    const ttl = GameDataCache.getTtl(ttlKey)
    if (ttl === undefined || ttl === 0) {
        const cards = Object.keys(cardJson)
        const cardMap: CardAssortMap = {}
        //console.log("--------------------------")
        cards.map((cardId) => {
            const cardEntry: JSON = cardJson[cardId]
            const characterId: string = `${cardEntry["characterId"]}`
            const newCardEntry: CardAssort = {
                cardId: +cardId,
                characterId: +characterId,
                cardReleased: cardEntry["releasedAt"]
            }
            //console.log(typeof cardMap[characterId])
            //console.log(cardMap[characterId])
            //console.log("--------------------------")
            if (cardMap[characterId] === undefined) {
                cardMap[characterId] = [newCardEntry]
            } else {
                //console.log(cardMap[characterId])
                cardMap[characterId] = [...cardMap[characterId], newCardEntry]
            }
            //console.log(cardMap[characterId])
            /*
            {
                console.log("i am working here");
                (cardId === "1" || cardId === "5") ? console.log(cardMap[characterId]) : ""
            }/**/
        })
        //console.log(Object.values(cardMap).length)
        GameDataCache.set(ttlKey, cardMap, cacheExpiryTime)
    }
    /*
    {
        const cardMap: CardAssortMap = GameDataCache.get(ttlKey)
        let i = 0;
        Object.values(cardMap).map((value => {
            i += value.length
        }))
        console.log(i)
    }/**/
    return GameDataCache.get(ttlKey)
}

export const getLatestCard = async (member: CharacterInfo, server: number): Promise<CardInfo> => {
    //console.log("--------------------------")
    const cardReleaseMap: CardAssortMap = await assortCards()
    const memid = (member.id).toString(10)
    //console.log("i work, trust me")
    const cardReleaseChar: CardAssort[] = cardReleaseMap[memid] // it has to be a string, bcause javascript sucks
    //console.log(cardReleaseChar)
    //console.log(cardReleaseChar)
    //console.log(cardReleaseChar.length)

    const latestCard: CardAssort = cardReleaseChar.reduce(function(prev, current) {
        const prevTime = prev.cardReleased[server]
        const curTime = current.cardReleased[server]
        //console.log(prev.cardId, prevTime, current.cardId, curTime)

        if (new Date(+curTime ) > new Date()) return prev
        if (new Date(+prevTime) > new Date()) return prev

        return (new Date(+prevTime) > new Date(+curTime)) ? prev : current
    })

    /*cardReleaseChar.reduce(
        (prev, current) => {
            const prevTime = prev["cardReleased"][server]
            const currentTime = current["cardReleased"][server]

            if (currentTime === null) {
                return prev
            }

            return (+prevTime > +currentTime) ? prev : current
        }
    )*/

    return await getCardData(latestCard["cardId"], false, server)
}
