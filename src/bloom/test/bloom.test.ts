// ./node_modules/.bin/mocha -r ./node_modules/ts-node/register .\src\bloom\test\bloom.test.ts

import { RedisOptions } from "ioredis";
import { newRedis } from "../../util/util";
import { Filter, RedisBitSet } from "../bloom";
var assert = require("assert");

const redisOption = { host: "127.0.0.1", port: 6379 } as RedisOptions;

describe("TestRedisBitSet_New_Set_Test", function () {
  const store = newRedis(redisOption);
  const bitSet = new RedisBitSet(store, "test_key", 1024);

  it("bit should not be set", async function () {
    const isSetBefore = await bitSet.check([0]);
    assert.equal(isSetBefore, false);
  });
  it("bit 512 should  be set", async function () {
    await bitSet.set([512]);
    const isSetAfter = await bitSet.check([512]);
    assert.equal(isSetAfter, true);
  });
});

describe("TestFilter_Add", function () {
  const store = newRedis(redisOption);
  const bitSet = new RedisBitSet(store, "test_key", 64);
  const filter = new Filter(64, bitSet);

  it("filter add should not throw error", async function () {
    try {
      await filter.add("hello");
    } catch (error) {
      assert.equal(true, false);
    }

    try {
      await filter.add("world");
    } catch (error) {
      assert.equal(true, false);
    }

    assert.equal(true, true);
  });

  it("filter hello exist", async function () {
    assert.equal(true, await filter.exists("hello"));
  });

  it("filter hello world not exist", async function () {
    assert.equal(false, await filter.exists("hello world"));
  });
});
