import { log } from "./log.js";

const DAY = 86400000;

export function daysLeft(item, now = Date.now()) {
  return Math.floor((Date.parse(item.expires) - now) / DAY);
}

export function isExpired(item, now = Date.now()) {
  const left = daysLeft(item, now);
  if (left < 0) {
    log.warn("item expired", { id: item.id, days: left });
    return true;
  }
  return left === 0;
}
