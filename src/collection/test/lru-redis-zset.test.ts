// ./node_modules/.bin/mocha -r ./node_modules/ts-node/register .\src\collection\test\lru-redis-zset.test.ts

import { RedisOptions } from "ioredis";
import { newRedis } from "../../util/util";
import { ZsetLru } from "../lru-redis-zset";
var assert = require("assert");

const redisOption = { host: "127.0.0.1", port: 6379 } as RedisOptions;

describe("Test ZsetLru cache", async function () {
  const storeKey = "test_zset_lru";
  const storeHashKey = "test_zset_lru_hash_map";
  const capacity = 3;
  const store = newRedis(redisOption);
  const lru = new ZsetLru(store, storeKey, capacity);

  before(async () => {
    await lru.del();
  });

  it("lru should be empty", async function () {
    assert.equal(await lru.lenth(), 0);
  });

  it("put('a', 'a')", async function () {
    await lru.put("a", "a");
    assert.equal("a", await lru.get("a"));
  });

  it("put('b', 'b')", async function () {
    await lru.put("b", "b");
    assert.equal("b", await lru.get("b"));
  });

  it("put('c', 'c')", async function () {
    await lru.put("c", "c");
    assert.equal("c", await lru.get("c"));
  });

  it("put('d', 'd')", async function () {
    await lru.put("d", "d");
    assert.equal("d", await lru.get("d"));
  });

  it("put() more than capacity keys, key a should be null", async function () {
    assert.equal(null, await lru.get("a"));
  });

  it("lru's num should be 3", async function () {
    assert.equal(3, await lru.lenth());
  });

  it("lru's sort should be d, c, b", async function () {
    const members = await lru.list();
    assert.equal(JSON.stringify(["d", "c", "b"]), JSON.stringify(members));
  });

  it("lru's sort should be b, d, c after get b", async function () {
    await lru.get("b");
    const members = await lru.list();
    assert.equal(JSON.stringify(["b", "d", "c"]), JSON.stringify(members));
  });

  it("hash keys should be b d c", async function () {
    const keys = await store.hkeys(storeHashKey);
    assert.equal(
      JSON.stringify(["b", "d", "c"].sort()),
      JSON.stringify(keys.sort())
    );
  });

  it("hash values should be b d c", async function () {
    const all = await store.hgetall(storeHashKey);
    assert.equal(
      JSON.stringify(["b", "d", "c"].sort()),
      JSON.stringify(Object.values(all).sort())
    );
  });
});
