const convertTimestampToDate = (timestamp) =>
  new Date(Number(timestamp)).toLocaleString("ru-RU", {
    timeZone: "Europe/Moscow",
    hour12: false,
  });

export { convertTimestampToDate };
