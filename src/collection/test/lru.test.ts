// ./node_modules/.bin/mocha -r ./node_modules/ts-node/register .\src\collection\test\lru.test.ts

import { LRUCache } from "../lru";

var assert = require("assert");

describe("Test lru cache", function () {
  const capacity = 3;
  const lru = new LRUCache(capacity);

  it("lru should be empty", function () {
    assert.equal(lru.head?.val === null && lru.tail?.val === null, true);
  });

  it("put('a', 'a')", function () {
    lru.put("a", "a");
    assert.equal("a", lru.get("a"));
  });

  it("put('b', 'b')", function () {
    lru.put("b", "b");
    assert.equal("b", lru.get("b"));
  });

  it("put('c', 'c')", function () {
    lru.put("c", "c");
    assert.equal("c", lru.get("c"));
  });

  it("put('d', 'd')", function () {
    lru.put("d", "d");
    assert.equal("d", lru.get("d"));
  });

  it("put() more than capacity keys, key a should be null", function () {
    assert.equal(null, lru.get("a"));
  });

  it("lru's num should be 3", function () {
    assert.equal(3, lru.num);
  });

  it("lru's sort should be d, c, b", function () {
    let head = lru.head?.next;
    const ret = [];
    for (let i = 0; i < 3; i++) {
      ret.push(head?.val);
      head = head?.next;
    }

    assert.equal(JSON.stringify(["d", "c", "b"]), JSON.stringify(ret));
  });

  it("lru's sort should be b, d, c after get b", function () {
    lru.get("b");
    let head = lru.head?.next;
    const ret = [];
    for (let i = 0; i < 3; i++) {
      ret.push(head?.val);
      head = head?.next;
    }

    assert.equal(JSON.stringify(["b", "d", "c"]), JSON.stringify(ret));
  });
});
