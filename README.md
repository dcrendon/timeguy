
# Costpoint Timesheet Automation Script

## Overview

This Deno script automates the process of filling out timesheets in the Costpoint web application.

## Prerequisites

- [Deno](https://deno.land/)
- Active Costpoint web access credentials

## Dependencies

- Puppeteer (imported from npm)
- Deno Std CLI utilities

## Installation

1. Ensure Deno is installed on your system.
2. Clone this repository.
3. Install dependencies using `deno install --allow-scripts`

## Configuration

You can configure the script using a `.env` file in the project root. This avoids re-entering the same values on every run. CLI arguments always take precedence over `.env` values, and interactive prompts fire only if neither is provided.

Create a `.env` file:
```
COSTPOINT_URL=https://your-costpoint-url
DATABASE=your_database
COSTPOINT_USERNAME=your_username
COSTPOINT_PASSWORD=your_password

# Single charge code
CHARGE_CODES=[{"description":"Your Charge Code Description"}]

# Multiple charge codes with per-code hours (hours/fridayHours are optional, fall back to HOURS/FRIDAY_HOURS)
CHARGE_CODES=[{"description":"Project Alpha","hours":"6"},{"description":"Project Beta","hours":"3","fridayHours":"2"}]
```

All CLI arguments are also supported as environment variables:

| Environment Variable | Equivalent CLI Argument | Notes |
|----------------------|------------------------|-------|
| `COSTPOINT_URL`      | `--costpointUrl`       | |
| `DATABASE`           | `--database`           | |
| `COSTPOINT_USERNAME` | `--username`           | |
| `COSTPOINT_PASSWORD` | `--password`           | |
| `CHARGE_CODES`       | `--chargeCodes`        | JSON array; see Configuration section for format |
| `WEEK`               | `--week`               | |
| `FLEX`               | `--flex`               | |
| `FILL_WEEK`          | `--fillWeek`           | |
| `SIGN_TIMESHEET`     | `--signTimesheet`      | |
| `HOURS`              | `--hours`              | Global default; overridden per-code in `CHARGE_CODES` |
| `FRIDAY_HOURS`       | `--fridayHours`        | Global default; overridden per-code in `CHARGE_CODES` |

> **Note:** The `.env` file is gitignored and will not be committed to version control.

## Usage

### Basic Command

To start the script interactively:
```bash
deno task start
```

### CLI Arguments

| Argument            | Description                                           | Type    | Default         |
|---------------------|-------------------------------------------------------|---------|-----------------|
| `--username`        | Costpoint username                                    | string  | Prompted        |
| `--password`        | Costpoint password                                    | string  | Prompted        |
| `--database`        | Costpoint database                                    | string  | Prompted        |
| `--costpointUrl`    | Costpoint URL                                         | string  | Prompted        |
| `--chargeCodes`     | JSON array of charge codes (see examples below)       | string  | Prompted        |
| `--week`            | Specific week to fill (MM/DD/YYYY)                    | string  | Next Friday     |
| `--flex`            | Skip flex-Friday (4-day work week)                    | boolean | `false`         |
| `--fillWeek`        | Fill hours for the entire week                        | boolean | `false`         |
| `--signTimesheet`   | Automatically sign timesheet                          | boolean | `false`         |
| `--hours`           | Global default hours per day for Mon–Thu              | string  | `9`             |
| `--fridayHours`     | Global default hours for Friday                       | string  | `8`             |

#### With Arguments

```bash
# Single charge code
deno task start --username johndoe --chargeCodes '[{"description":"Project Alpha"}]'

# Multiple charge codes with per-code hours
deno task start --fillWeek --chargeCodes '[{"description":"Project Alpha","hours":"6"},{"description":"Project Beta","hours":"3","fridayHours":"2"}]'

# Flex Friday (4-day week)
deno task start --username johndoe --flex
```

## Security Notes

- Password input is masked using `promptSecret`.
- Credentials are not stored persistently by the script.
- Avoid passing `--password` as a CLI argument — it will be visible in your shell history. Use the interactive prompt or a `.env` file instead.
- Never hardcode credentials directly in source files, especially before compiling to a binary.

## Compile to Executable

To compile this script into a standalone executable, use the following command:
```bash
deno compile -A main.ts
```

To avoid interactive prompts when running the compiled binary, use a `.env` file or pass CLI arguments at runtime.

## Disclaimer

This script is provided as-is. Use it responsibly and ensure compliance with your organization's policies.
