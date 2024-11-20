export function getNextFridayFormatted(date: Date) {
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 5) {
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
  date.setDate(date.getDate() + daysUntilFriday);

  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const year = date.getFullYear();

  return `${month}/${day}/${year}`;
}

export const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];