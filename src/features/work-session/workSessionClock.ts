export function elapsedSeconds(startedAt: string, now = new Date()) {
  return Math.max(
    0,
    Math.floor((now.getTime() - new Date(startedAt).getTime()) / 1000),
  );
}
