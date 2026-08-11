export const utcDayKey = (date = new Date()) => date.toISOString().slice(0, 10);

export const dailyIndex = (day: string, total: number, salt = "al-furqan") => {
  if (!Number.isInteger(total) || total < 1) throw new Error("Daily selection requires at least one item.");
  let hash = 2166136261;
  for (const character of `${salt}:${day}`) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % total;
};
