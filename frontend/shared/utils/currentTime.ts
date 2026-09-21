export const useCurrentDateTime = () => {
  const now = new Date();
  const locale = "ru-RU";

  const capitalize = (text: string) => {
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  const rawWeekDay = new Intl.DateTimeFormat(locale, {
    weekday: "long",
  }).format(now);

  const rawMonth = new Intl.DateTimeFormat(locale, { month: "long" }).format(
    now,
  );

  return {
    year: now.getFullYear(),
    monthNumber: String(now.getMonth() + 1).padStart(2, "0"),
    month: capitalize(rawMonth),
    day: String(now.getDate()).padStart(2, "0"),
    hours: String(now.getHours()).padStart(2, "0"),
    minutes: String(now.getMinutes()).padStart(2, "0"),
    weekDay: capitalize(rawWeekDay),
  };
};
