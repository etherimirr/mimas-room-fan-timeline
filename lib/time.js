export function getElapsedHours(firstSeenAt, now) {
  const start = new Date(firstSeenAt).getTime();
  const end = new Date(now).getTime();
  return Math.max(0, (end - start) / (1000 * 60 * 60));
}

export function isNightTime(now) {
  const hour = new Date(now).getHours();
  return hour >= 22 || hour < 5;
}

export function formatElapsedHours(firstSeenAt, now) {
  const elapsedHours = getElapsedHours(firstSeenAt, now);

  if (elapsedHours < 1) {
    return `${Math.floor(elapsedHours * 60)} 分钟`;
  }

  return `${elapsedHours.toFixed(1)} 小时`;
}
