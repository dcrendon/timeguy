import { assertEquals } from "@std/assert";
import { getNextFridayFormatted } from "./utils.ts";

Deno.test("returns same day when called on a Friday", () => {
  const friday = new Date(2025, 2, 21); // Friday, March 21 2025
  assertEquals(getNextFridayFormatted(friday), "03/21/2025");
});

Deno.test("returns next Friday when called on a Saturday", () => {
  const saturday = new Date(2025, 2, 22); // Saturday, March 22 2025
  assertEquals(getNextFridayFormatted(saturday), "03/28/2025");
});

Deno.test("returns upcoming Friday when called mid-week", () => {
  const wednesday = new Date(2025, 2, 19); // Wednesday, March 19 2025
  assertEquals(getNextFridayFormatted(wednesday), "03/21/2025");
});

Deno.test("does not mutate the input date", () => {
  const wednesday = new Date(2025, 2, 19);
  const original = wednesday.getTime();
  getNextFridayFormatted(wednesday);
  assertEquals(wednesday.getTime(), original);
});
