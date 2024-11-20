
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

## Usage

### Basic Command

To start the script interactively:
```bash
deno task start
```

### CLI Arguments

| Argument           | Description                             | Type    | Default         |
|--------------------|-----------------------------------------|---------|-----------------|
| `--username`       | Costpoint username                     | string  | Prompted        |
| `--password`       | Costpoint password                     | string  | Prompted        |
| `--database`       | Costpoint database                     | string  | Prompted        |
| `--costpointUrl`   | Costpoint URL                          | string  | Prompted        |
| `--codeDescription`| Description used to find row           | string  | Prompted        |
| `--week`           | Specific week to fill (MM/DD/YYYY)     | string  | Next Friday     |
| `--flex`           | Skip flex-Friday (4-day work week)     | boolean | `false`         |
| `--fillWeek`       | Fill hours for the entire week         | boolean | `false`         |
| `--signTimesheet`  | Automatically sign timesheet           | boolean | `false`         |

#### With Arguments

```bash
deno task start --username johndoe --password secretpass --flex
```

## Security Notes

- Password input is masked using `promptSecret`.
- Credentials are not stored persistently.

## Limitations

- Currently, the script supports only a single charge code. Enhancements for multiple charge code support are planned.

## Compile to Executable
To compile this script into a standalone executable, use the following command:
```bash
deno compile -A main.ts
```
It is also possible to hardcode your credentials in the `main.ts` file before compiling to streamline the script and avoid prompts and CLI arguments.

## Disclaimer

This script is provided as-is. Use it responsibly and ensure compliance with your organization's policies.