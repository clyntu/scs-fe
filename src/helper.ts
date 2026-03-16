export const convertToQueryParams = (queryParams: any): string => {
  const queryString = Object.entries(queryParams)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => {
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        return `${encodeURIComponent(key)}=${encodeURIComponent(value.toString())}`;
      } else {
        console.error(`Invalid query parameter value for key "${key}":`, value);
        return "";
      }
    })
    .filter((param) => param !== "")
    .join("&");

  return queryString;
};

export function formatToDate(dateStr: string | undefined): string {
  if (dateStr === undefined || dateStr === null) return "-";
  const date = new Date(dateStr);

  // Extract year, month, day
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  // Return the formatted date as YYYY-MM-DD
  return `${year}-${month}-${day}`;
}

export function formatToDateTime(dateStr: string | undefined): string {
  if (dateStr === undefined || dateStr === null) return "-";
  const date = new Date(dateStr);

  // Extract year, month, day, hours, and minutes
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // getMonth() returns 0-based month, so add 1
  const day = String(date.getDate()).padStart(2, "0");

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");

  // Determine AM or PM and convert hours to 12-hour format
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours === 0 ? 12 : hours; // Convert hour '0' to '12'

  // Return the formatted date and time as MM/DD/YYYY HH:MM AM/PM
  return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
}

export function addCommaToNumberWithFourPlaces(num: number | string | undefined): any {
  if (num === undefined || num === null) return num;

  return Number(num).toFixed(4).replace(/\d(?=(\d{3})+\.)/g, "$&,");
}

export function addCommaToNumberWithTwoPlaces(num: number | string | undefined): any {
  if (num === undefined || num === null) return num;

  return Number(num).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,");
}

export function addTwoPlaces(num: number | string | undefined): any {
  if (num === undefined || num === null) return num;

  return Number(num).toFixed(2);
}

export function addFourPlaces(num: number | string | undefined): any {
  if (num === undefined || num === null) return num;

  return Number(num).toFixed(4);
}

export function removeCommas(numberString: string): string {
  return numberString.replace(/,/g, "");
}

export const formatToSP = (number: number): string => {
  const padded = number.toString().padStart(4, "0");
  return `SP${padded}`;
};

export const formatToCP = (number: number): string => {
  const padded = number.toString().padStart(4, "0");
  return `CP${padded}`;
};

export const formatToWH = (number: number): string => {
  const padded = number.toString().padStart(4, "0");
  return `WH${padded}`;
};
