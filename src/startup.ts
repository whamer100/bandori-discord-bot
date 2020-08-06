import { clearLine } from "readline"

process.stdout.write("Checking environmental variables...\r")

const fail = (failed: number) => {
    clearLine(process.stdout, 0);
    console.log(`\nEnvironmental variable "${check[failed]}" missing!`)
    process.exit(1)
}

const update = (i: number, t: number) => {
    clearLine(process.stdout, 0);
    process.stdout.write(`Checking environmental variables... [${i}/${t}]\r`)
}

const check: string[] = [
    "TOKEN",
    "PREFIX",
    "OWNERS",
]

check.forEach(
    (iter, index, array) => {
        (process.env[iter] === undefined) ? fail(index) : update(index + 1, array.length)
    })

clearLine(process.stdout, 0);
console.log("Checking environmental variables... [DONE]")
