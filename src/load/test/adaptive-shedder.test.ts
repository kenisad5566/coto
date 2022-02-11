import { sleep } from "./../../util/util";
import { AdaptiveShedder } from "../adaptive-shedder";

var assert = require("assert");

const bucketDuration = 50; //50ms
const window = 0.5;
const buckets = 10;

describe("TestAdaptiveShedderMaxPass", function () {
  const shedder = new AdaptiveShedder({
    window,
    buckets,
  });

  it("shedder.maxPass() === 1000", function () {
    for (let i = 1; i <= 10; i++) {
      shedder.passCounter.add(i * 100);
      sleep(bucketDuration);
    }
    assert.equal(1000, shedder.maxPass());
  });
});

describe("TestAdaptiveShedderMaxPass", function () {
  const shedder = new AdaptiveShedder({
    window,
    buckets,
  });

  it("shedder.maxPass() === 1", function () {
    for (let i = 1; i <= 10; i++) {
      shedder.passCounter.add(1);
      sleep(bucketDuration);
    }
    assert.equal(1, shedder.maxPass());
  });
});

describe("TestAdaptiveShedderMinRt", function () {
  const shedder = new AdaptiveShedder({
    window,
    buckets,
  });

  it("minRt is equal to 6", function () {
    for (let i = 0; i < 10; i++) {
      if (i > 0) {
        sleep(bucketDuration);
      }
      for (let j = i * 10 + 1; j <= i * 10 + 10; j++) shedder.rtCounter.add(j);
    }
    assert.equal(6, shedder.minRt());
  });
});

describe("TestAdaptiveShedderMaxFlight", function () {
  const shedder = new AdaptiveShedder({
    window,
    buckets,
  });
  shedder.windows = 10;

  it("maxFlight is equal to 54", function () {
    for (let i = 0; i < 10; i++) {
      if (i > 0) {
        sleep(bucketDuration);
      }

      shedder.passCounter.add((i + 1) * 100);
      for (let j = i * 10 + 1; j <= i * 10 + 10; j++) shedder.rtCounter.add(j);
    }
    assert.equal(54, shedder.maxFlight());
  });
});

describe("TestAdaptiveShedderShouldDrop", function () {
  const shedder = new AdaptiveShedder({
    window,
    buckets,
  });
  shedder.windows = 10;

  // 模拟cpu >= 80%, flying < maxPass
  shedder.systemOverloaded = () => {
    return true;
  };

  it("cpu >= 80%, flying < maxPass shouldDrop is false", function () {
    for (let i = 0; i < 10; i++) {
      if (i > 0) {
        sleep(bucketDuration);
      }

      shedder.passCounter.add((i + 1) * 100);
      for (let j = i * 10 + 1; j <= i * 10 + 10; j++) shedder.rtCounter.add(j);
    }
    assert.equal(shedder.shouldDrop(), false);
  });

  // cpu >= 80, avgFlying >= 54, flying <= 54
  it("cpu >= 80, avgFlying >= 54, flying <= 54 shouldDrop is false", function () {
    shedder.avgFlying = 80;
    shedder.flying = 50;
    assert.equal(shedder.shouldDrop(), false);
  });

  // cpu >= 80, avgFlying >= 54, flying > 54

  it("cpu >= 80, avgFlying >= 54, flying > 54 shouldDrop is true", function () {
    shedder.avgFlying = 80;
    shedder.flying = 80;
    assert.equal(shedder.shouldDrop(), true);
  });

  // cpu < 800, inflight > maxPass

  it("cpu < 800, inflight > maxPass shouldDrop is false", function () {
    shedder.systemOverloaded = () => {
      return false;
    };
    shedder.avgFlying = 80;
    assert.equal(shedder.shouldDrop(), false);
  });

  // cpu >=  800, inflight < maxPass

  it("cpu >=  800, inflight < maxPass shouldDrop is true", function () {
    shedder.systemOverloaded = () => {
      return true;
    };
    shedder.avgFlying = 80;
    shedder.flying = 80;
    assert.equal(shedder.shouldDrop(), true);
  });
});
