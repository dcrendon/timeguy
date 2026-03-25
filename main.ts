import puppeteer from "npm:puppeteer@23.7.0";
import { getNextFridayFormatted, daysOfWeek } from "./utils.ts";
import { promptSecret, parseArgs } from "jsr:@std/cli";

interface ChargeCode {
  description: string;
  hours: string;
  fridayHours: string;
}

const args = parseArgs(Deno.args, {string: ['username', 'password', 'week', 'database', 'costpointUrl', 'chargeCodes', 'hours', 'fridayHours'], boolean: ['signTimesheet', 'flex', 'fillWeek']});

const config = {
  username:      args.username      || Deno.env.get("COSTPOINT_USERNAME") || null,
  password:      args.password      || Deno.env.get("COSTPOINT_PASSWORD") || null,
  database:      args.database      || Deno.env.get("DATABASE")           || null,
  costpointUrl:  args.costpointUrl  || Deno.env.get("COSTPOINT_URL")      || null,
  chargeCodes:   args.chargeCodes   || Deno.env.get("CHARGE_CODES")       || null,
  week:          args.week          || Deno.env.get("WEEK")               || null,
  signTimesheet: args.signTimesheet || Deno.env.get("SIGN_TIMESHEET") === "true",
  flex:          args.flex          || Deno.env.get("FLEX") === "true",
  fillWeek:      args.fillWeek      || Deno.env.get("FILL_WEEK") === "true",
  hours:         args.hours         || Deno.env.get("HOURS")              || "9",
  fridayHours:   args.fridayHours   || Deno.env.get("FRIDAY_HOURS")       || "8",
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

let chargeCodes: ChargeCode[] = [];

if (config.chargeCodes) {
  try {
    const parsed = JSON.parse(config.chargeCodes);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      console.error("CHARGE_CODES must be a non-empty JSON array.");
      Deno.exit(1);
    }
    chargeCodes = parsed.map((entry: { description?: string; hours?: string; fridayHours?: string }) => ({
      description: entry.description ?? "",
      hours:       entry.hours       ?? config.hours,
      fridayHours: entry.fridayHours ?? config.fridayHours,
    }));
    const invalid = chargeCodes.find(c => !c.description);
    if (invalid) {
      console.error("Each charge code entry must have a \"description\" field.");
      Deno.exit(1);
    }
  } catch {
    console.error("Could not parse CHARGE_CODES as JSON.");
    Deno.exit(1);
  }
} else {
  console.log("No charge codes provided. Enter each charge code interactively.");
  let another: string | null = "y";
  while (another?.toLowerCase() === "y") {
    const description = prompt("Enter charge code description:");
    if (!description) { console.error("Description is required."); Deno.exit(1); }
    const hoursInput       = prompt(`  Hours Mon–Thu (default ${config.hours}):`);
    const fridayHoursInput = prompt(`  Hours Friday (default ${config.fridayHours}):`);
    chargeCodes.push({
      description,
      hours:       hoursInput?.trim()       || config.hours,
      fridayHours: fridayHoursInput?.trim() || config.fridayHours,
    });
    another = prompt("Add another charge code? (y/n):");
  }
  if (chargeCodes.length === 0) {
    console.error("At least one charge code is required.");
    Deno.exit(1);
  }
}

// Column indices for day hour inputs in Costpoint's DOM (3 = Monday ... 7 = Friday)
const costpointInputDays = config.flex
  ? [{number: 3, day: "Monday"}, {number: 4, day: "Tuesday"}, {number: 5, day: "Wednesday"}, {number: 6, day: "Thursday"}]
  : [{number: 3, day: "Monday"}, {number: 4, day: "Tuesday"}, {number: 5, day: "Wednesday"}, {number: 6, day: "Thursday"}, {number: 7, day: "Friday"}]

if (!config.week) {
  config.week = getNextFridayFormatted(new Date());
}

const browser = await puppeteer.launch({ headless: false });
let encounteredError = false;

try {
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

  if (!config.fillWeek) {
    const todayIndex = new Date().getDay();
    if (todayIndex === 0 || todayIndex === 6) {
      console.error("Today is a weekend. Use --fillWeek to fill the entire week.");
      Deno.exit(1);
    }
  }

  for (const chargeCode of chargeCodes) {
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
    }, chargeCode.description);

    if (!descriptionInput) {
      console.error(`Could not find row for: "${chargeCode.description}". Skipping.`);
      continue;
    }

    const popped = descriptionInput.id.split("-").pop();
    if (!popped) {
      console.error(`Unexpected input ID format for: "${chargeCode.description}". Skipping.`);
      continue;
    }
    const idSplit = popped.split("_");
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
      if (dayInput === null) {
        const hrs = day.number === 7 ? chargeCode.fridayHours : chargeCode.hours;
        await page.locator(`#${dayInputId}`).fill(hrs);
        await page.waitForNetworkIdle({
          idleTime: day.number === 7 ? 1000 : 2000,
        });
      }
    }
  }

  if (config.signTimesheet) {
    await page.locator("#SIGN_BUT").click();
  }

  console.log("Script complete. Close the browser to exit.");
} catch (error) {
  encounteredError = true;
  console.error("An error occurred:", error instanceof Error ? error.message : error);
} finally {
  if (encounteredError) {
    await browser.close();
  }
}
