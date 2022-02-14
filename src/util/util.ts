import RedisClient, { RedisOptions, Redis } from "ioredis";
var fnv = require("fnv-plus");

export function sleep(time: number) {
  const time1 = Date.now();
  while (Date.now() - time1 < time) {}
}

export function hash(data: any): string {
  return fnv.hash(data).dec();
}

export function newRedis(options: RedisOptions): Redis {
  return new RedisClient(options);
}
