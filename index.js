'use strict'

const fs = require("fs");

function makeFirefoxHeaders(cookie) {
    return {
        "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64; rv:155.0) Gecko/20100101 Firefox/155.0",

        "Accept":
            "application/json, text/plain, */*",

        "Accept-Language":
            "en-US,en;q=0.5",

        "Accept-Encoding":
        "gzip, deflate, br, zstd",

        "Referer":
            "https://tekmeme.nexus-i.fr/",

        "Sec-Fetch-Dest":
            "empty",

        "Sec-Fetch-Mode":
            "cors",

        "Sec-Fetch-Site":
            "same-origin",

        "Priority":
            "u=4",

        "Cookie":
            `__Host-tekmeme_sid=${cookie}`
    };
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function getBooster(cookie) {
const response = await fetch("https://tekmeme.nexus-i.fr/api/boosters", {
  method: "GET",
  headers: makeFirefoxHeaders(cookie)
  });
    return response;
}

async function open(cookie) {
    const response = await fetch("https://tekmeme.nexus-i.fr/api/boosters/open", {
        method: "POST",
        headers: makeFirefoxHeaders(cookie),
        body: JSON.stringify({})
    });
    return response;
}

async function getAndVerifyCookie() {
  let file = fs.readFileSync(".cookie");
  let js = JSON.parse(file);
  let cookie = js["cookie"];

  const response = await getBooster(cookie);
  if (response.status != 200)
    return {valid: false, cookie_val: cookie};
  return {valid: true, cookie_val: cookie};
}

function printCardsValue(cards)
{
  let rarities = {
    "COMMON": {
      "NORMAL": 0,
      "HOLO": 0,
      "GOLD": 0,
      "GALAXY": 0,
      "GLITCH": 0
    },
    "RARE": {
      "NORMAL": 0,
      "HOLO": 0,
      "GOLD": 0,
      "GALAXY": 0,
      "GLITCH": 0
    },
    "EPIC": {
      "NORMAL": 0,
      "HOLO": 0,
      "GOLD": 0,
      "GALAXY": 0,
      "GLITCH": 0
    },
    "LEGENDARY": {
      "NORMAL": 0,
      "HOLO": 0,
      "GOLD": 0,
      "GALAXY": 0,
      "GLITCH": 0
    }
  }
  for (const card of cards)
    rarities[card["rarity"]][card["finish"]]++;

  console.log("Got:");

  for (const rarity in rarities) {
    for (const finish in rarities[rarity]) {
      const count = rarities[rarity][finish];

      if (count != 0)
        console.log(`${count} ${rarity} ${finish}`);
    }
  }
}

async function openBoostersStock(cookie, stock)
{
  while (stock >= 1) {
    const resp = await (await open(cookie)).json();
    printCardsValue(resp["cards"])
    sleep(1000);
    stock = await (await getBooster(cookie)).json()["stock"];
    await sleep(1000);
  }
}

async function main() {
  const cook_str = await getAndVerifyCookie();
  if (!cook_str) {
    console.error("Recieved 401 status code. Cookie might be invalid, or website is down.");
    return;
  }
  let booster = await getBooster(cook_str.cookie_val);
  if (booster.status != 200) {
    console.error("Unable to retrieve boosters. Something went wrong !");
    return;
  }
  let booster_json = await booster.json();
  let interval = booster_json["intervalMs"];
  let stock = booster_json["stock"];
  console.log(`Started BOT. Got ${stock} boosters pending. Interval is set to ${interval}`);
  await openBoostersStock(cook_str.cookie_val, stock);
  while (true) {
    booster = await getBooster(cook_str.cookie_val);
    if (booster.status != 200) {
        console.error("Unable to retrieve boosters. Let's kill ourselves !");
        console.error(`JSON request output : ${await booster.json()}`);
      throw new Error(`Unable to retrieve boosters status is ${booster.status}`);
    }
    booster = await booster.json();
    stock = booster["stock"];
    await openBoostersStock(cook_str.cookie_val, stock);
    await sleep(10_000);
  };
}

main().catch(err => {
  console.error(err);
  process.exit(1);
})
