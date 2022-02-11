export function sleep(time: number) {
  const time1 = Date.now();
  while (Date.now() - time1 < time) {}
}
