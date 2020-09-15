import axios from "axios"

import * as NodeCache from "node-cache";

const bestdoriEndpoint = "https://bestdori.com/api"
const bestdoriResourceEndpoint = "https://bestdori.com/assets"
const MDBCacheExpiryTime = 60 * 60 * 4 // 4 hours -> 14400 seconds
const cacheExpiryTime = 60 * 4 // 4 minutes -> 240 seconds

const bandURL = "bands/main.1.json"

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
