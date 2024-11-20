import puppeteer from "npm:puppeteer@23.7.0";
import { getNextFridayFormatted, daysOfWeek } from "./utils.ts";
import { promptSecret, parseArgs } from "jsr:@std/cli";

const args = parseArgs(Deno.args, {string: ['username', 'password', 'week', 'database', 'costpointUrl', 'codeDescription'], boolean: ['signTimesheet', 'flex', 'fillWeek']});

const config = {
  username: args.username || null,
  password: args.password || null,
  database: args.database || null,
  costpointUrl: args.costpointUrl || null,
  codeDescription: args.codeDescription || null,
  week: args.week || null,
  signTimesheet: args.signTimesheet,
  flex: args.flex,
  fillWeek: args.fillWeek,
};

if (!config.username || !config.password) {
  const username = prompt("Enter your username:")
  const password = promptSecret("Enter your password:", {mask:"*"})
  if (!username || !password) {
    console.error("Username and password are required.");
    Deno.exit(1);
  }
  config.username = username
  config.password = password
}

if (!config.database || !config.costpointUrl){
  const database = prompt("Enter your database:")
  const costpointUrl = prompt("Enter the URL for Costpoint:")
  if (!database || !costpointUrl) {
    console.error("Database and Costpoint URL are required.");
    Deno.exit(1);
  }
  config.database = database
  config.costpointUrl = costpointUrl
}

if (!config.codeDescription) {
  const codeDescription = prompt("Enter the code description:")
  if (!codeDescription) {
    console.error("Code description is required.");
    Deno.exit(1);
  }
  config.codeDescription = codeDescription
}

const costpointInputDays = config.flex
  ? [{number: 3, day: "Monday"}, {number: 4, day: "Tuesday"}, {number: 5, day: "Wednesday"}, {number: 6, day: "Thursday"}]
  : [{number: 3, day: "Monday"}, {number: 4, day: "Tuesday"}, {number: 5, day: "Wednesday"}, {number: 6, day: "Thursday"}, {number: 7, day: "Friday"}]

if (!config.week) {
  config.week = getNextFridayFormatted(new Date());
}

const browser = await puppeteer.launch({ headless: false });
const page = await browser.newPage();

await page.goto(`${config.costpointUrl}`);
await page.locator("#USER").fill(`${config.username}`);
await page.locator("#CLIENT_PASSWORD").fill(`${config.password}`);
await page.locator("#DATABASE").fill(`${config.database}`);
await page.locator("#loginBtn").click();
await page.waitForNetworkIdle({
  idleTime: 2000,
});
await page.locator(`span.dData[title='${config.week}']`).click();
await page.waitForNetworkIdle({
  idleTime: 2000,
});

const descriptionInput = await page.evaluate((codeDescription) => {
  // @ts-ignore - Code in this block is executed in the browser
  const inputs = document.querySelectorAll('input[id^="LINE_DESC-"]');
  const descArray = Array.from(inputs).map((input) => {
    const typedInput = input as { id: string | ""; value: string | "" };
    return {
      id: typedInput.id,
      value: typedInput.value,
    };
  }).filter((input) => input.value.includes(codeDescription));
  return descArray[0] || null;
}, config.codeDescription);

if (!descriptionInput || descriptionInput === undefined) {
  console.error("Could not find description input.");
  Deno.exit(1);
}

// @ts-ignore - 
const idSplit = descriptionInput.id.split("-").pop().split("_");
const rowLetter = idSplit[2];
const rowNumber = idSplit[1];

for (let i = 0; i < costpointInputDays.length; i++) {
  if (!config.fillWeek) {
    const currentDay = daysOfWeek[new Date().getDay()];
    if (costpointInputDays[i].day !== currentDay) {
      continue;
    }
  }
  const day = costpointInputDays[i];
  const dayInputId = `DAY${day.number}_HRS-_${rowNumber}_${rowLetter}`;
  const dayInput = await page.evaluate((id) => {
    // @ts-ignore - Code in this block is executed in the browser
    const input = document.getElementById(`${id}`);
    return input ? input.value : null;
  }, dayInputId);
  if (!dayInput) {
    if (day.number === 7) {
      // console.log(`Filling in ${dayInputId} with 8`);
      await page.locator(`#${dayInputId}`).fill("8");
      await page.waitForNetworkIdle({
        idleTime: 1000,
      });
    } else {
      // console.log(`Filling in ${dayInputId} with 9`);
      await page.locator(`#${dayInputId}`).fill("9");
      await page.waitForNetworkIdle({
        idleTime: 2000,
      });
    }
  }
}

if (config.signTimesheet) {
  await page.locator("#SIGN_BUT").click();
}

console.log("Script complete. Close the browser to exit.");
