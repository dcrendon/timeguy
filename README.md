
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
CODE_DESCRIPTION=Your Charge Code Description
```

All CLI arguments are also supported as environment variables:

| Environment Variable | Equivalent CLI Argument |
|----------------------|------------------------|
| `COSTPOINT_URL`      | `--costpointUrl`       |
| `DATABASE`           | `--database`           |
| `COSTPOINT_USERNAME` | `--username`           |
| `COSTPOINT_PASSWORD` | `--password`           |
| `CODE_DESCRIPTION`   | `--codeDescription`    |
| `WEEK`               | `--week`               |
| `FLEX`               | `--flex`               |
| `FILL_WEEK`          | `--fillWeek`           |
| `SIGN_TIMESHEET`     | `--signTimesheet`      |
| `HOURS`              | `--hours`              |
| `FRIDAY_HOURS`       | `--fridayHours`        |

> **Note:** The `.env` file is gitignored and will not be committed to version control.

## Usage

### Basic Command

To start the script interactively:
```bash
deno task start
```

### CLI Arguments

| Argument            | Description                             | Type    | Default         |
|---------------------|-----------------------------------------|---------|-----------------|
| `--username`        | Costpoint username                      | string  | Prompted        |
| `--password`        | Costpoint password                      | string  | Prompted        |
| `--database`        | Costpoint database                      | string  | Prompted        |
| `--costpointUrl`    | Costpoint URL                           | string  | Prompted        |
| `--codeDescription` | Description used to find row            | string  | Prompted        |
| `--week`            | Specific week to fill (MM/DD/YYYY)      | string  | Next Friday     |
| `--flex`            | Skip flex-Friday (4-day work week)      | boolean | `false`         |
| `--fillWeek`        | Fill hours for the entire week          | boolean | `false`         |
| `--signTimesheet`   | Automatically sign timesheet            | boolean | `false`         |
| `--hours`           | Hours per day for Mon–Thu               | string  | `9`             |
| `--fridayHours`     | Hours for Friday                        | string  | `8`             |

#### With Arguments

```bash
deno task start --username johndoe --flex
```

## Security Notes

- Password input is masked using `promptSecret`.
- Credentials are not stored persistently by the script.
- Avoid passing `--password` as a CLI argument — it will be visible in your shell history. Use the interactive prompt or a `.env` file instead.
- Never hardcode credentials directly in source files, especially before compiling to a binary.

## Limitations

- Currently, the script supports only a single charge code. Enhancements for multiple charge code support are planned.

## Compile to Executable

To compile this script into a standalone executable, use the following command:
```bash
deno compile -A main.ts
```

To avoid interactive prompts when running the compiled binary, use a `.env` file or pass CLI arguments at runtime.

## Disclaimer

This script is provided as-is. Use it responsibly and ensure compliance with your organization's policies.
