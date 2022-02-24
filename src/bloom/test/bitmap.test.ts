// ./node_modules/.bin/mocha -r ./node_modules/ts-node/register .\src\bloom\test\bitmap.test.ts

import { RedisOptions } from "ioredis";
import { newRedis } from "../../util/util";
import { bitMapSet, bitMapUnSet, bitMapTest, bitMapTestBatch } from "../bitmap";
var assert = require("assert");

const redisOption = { host: "127.0.0.1", port: 6379 } as RedisOptions;

describe("Test bitMap", function () {
  const store = newRedis(redisOption);
  const key = "test_key";

  before(async () => {
    await store.del(key);
  });

  it("It should be empty", async function () {
    assert.equal(
      JSON.stringify([]),
      JSON.stringify(await bitMapTest(store, key, [1, 2, 3]))
    );
  });

  it("bitMapSet", async function () {
    await bitMapSet(store, key, [1, 2]);
    assert.equal(
      JSON.stringify([1, 2]),
      JSON.stringify(await bitMapTest(store, key, [1, 2, 3]))
    );
  });

  it("bitMapUnSet", async function () {
    await bitMapUnSet(store, key, [1]);
    assert.equal(
      JSON.stringify([2]),
      JSON.stringify(await bitMapTest(store, key, [1, 2, 3]))
    );
  });

  it("It should be empty", async function () {
    await bitMapUnSet(store, key, [2]);
    assert.equal(
      JSON.stringify([]),
      JSON.stringify(await bitMapTest(store, key, [1, 2, 3]))
    );
  });

  it("bitMapSet", async function () {
    await bitMapSet(store, key, [2, 1, 3]);
    assert.equal(
      JSON.stringify([1, 2, 3]),
      JSON.stringify(await bitMapTest(store, key, [1, 2, 3]))
    );
  });
});

describe("Test bitMap bitMapTestBatch", function () {
  const store = newRedis(redisOption);

  const prefix = "test_key";
  const join = "_";
  const offset = 145;
  const symbols = [1, 2, 3, 4, 5, 6];

  before(async () => {
    for (const symbol of symbols) {
      await store.del(getKey(prefix, join, symbol));
    }
  });

  it("BitMapTestBatch", async function () {
    for (const symbol of symbols) {
      await bitMapSet(store, getKey(prefix, join, symbol), [offset]);
    }
    assert.equal(
      JSON.stringify([1, 2, 3, 4, 5, 6]),
      JSON.stringify(
        await bitMapTestBatch(store, [1, 2, 3, 4, 5, 6], prefix, join, offset)
      )
    );
  });

  it("BitMapTestBatch after unset", async function () {
    await bitMapUnSet(store, getKey(prefix, join, 1), [offset]);
    await bitMapUnSet(store, getKey(prefix, join, 5), [offset]);
    assert.equal(
      JSON.stringify([2, 3, 4, 6]),
      JSON.stringify(
        await bitMapTestBatch(store, [1, 2, 3, 4, 5, 6], prefix, join, offset)
      )
    );
  });

  it("BitMapTestBatch after unset all", async function () {
    for (const symbol of symbols) {
      await bitMapUnSet(store, getKey(prefix, join, symbol), [offset]);
    }
    assert.equal(
      JSON.stringify([]),
      JSON.stringify(
        await bitMapTestBatch(store, [1, 2, 3, 4, 5, 6], prefix, join, offset)
      )
    );
  });
});

function getKey(prefix: string, join: string, symbol: any): string {
  return [prefix, join, symbol].join("");
}
