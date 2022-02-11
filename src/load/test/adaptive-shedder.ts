import { AdaptiveShedder } from "../adaptive-shedder";

const bucketDuration = 50; //50ms
const window = 0.5;
const buckets = 10;

/**
 * 测试maxPass
 */
function testAdaptiveShedderMaxPass() {
  const shedder = new AdaptiveShedder({
    window,
    buckets,
  });

  for (let i = 1; i <= 10; i++) {
    shedder.passCounter.add(i * 100);
    sleep(bucketDuration);
  }

  console.log(
    shedder.maxPass() === 1000,
    "passCounter maxPass is equal to 1000"
  );

  const shedder2 = new AdaptiveShedder({
    window, // 1秒窗口
    buckets,
  });

  for (let i = 1; i <= 10; i++) {
    shedder2.passCounter.add(1);
    sleep(bucketDuration);
  }

  console.log(shedder2.maxPass() === 1, "passCounter2 maxPass is equal to 1");
}

function testAdaptiveShedderMinRt() {
  const shedder = new AdaptiveShedder({
    window,
    buckets,
  });

  for (let i = 0; i < 10; i++) {
    if (i > 0) {
      sleep(bucketDuration);
    }
    for (let j = i * 10 + 1; j <= i * 10 + 10; j++) shedder.rtCounter.add(j);
  }
  console.log(
    shedder.minRt() === 6,
    "testAdaptiveShedderMinRt minRt is equal to 6"
  );
}

function testAdaptiveShedderMaxFlight() {
  const shedder = new AdaptiveShedder({
    window,
    buckets,
  });
  shedder.windows = 10;

  for (let i = 0; i < 10; i++) {
    if (i > 0) {
      sleep(bucketDuration);
    }

    shedder.passCounter.add((i + 1) * 100);
    for (let j = i * 10 + 1; j <= i * 10 + 10; j++) shedder.rtCounter.add(j);
  }

  console.log(
    shedder.maxFlight() === 54,
    "testAdaptiveShedderMaxFlight maxFlight is equal to 54"
  );
}

function testAdaptiveShedderShouldDrop() {
  const shedder = new AdaptiveShedder({
    window,
    buckets,
  });
  shedder.windows = 10;

  for (let i = 0; i < 10; i++) {
    if (i > 0) {
      sleep(bucketDuration);
    }

    shedder.passCounter.add((i + 1) * 100);
    for (let j = i * 10 + 1; j <= i * 10 + 10; j++) shedder.rtCounter.add(j);
  }

  // 模拟cpu >= 80%, flying < maxPass
  shedder.systemOverloaded = () => {
    return true;
  };
  console.log(
    shedder.shouldDrop() === false,
    "testAdaptiveShedderShouldDrop 模拟cpu >= 80%, flying < maxPass is false"
  );

  // cpu >= 80, avgFlying >= 54, flying <= 54
  shedder.avgFlying = 80;
  shedder.flying = 50;

  console.log(
    shedder.shouldDrop() === false,
    "testAdaptiveShedderShouldDrop cpu >= 80, avgFlying >= 54, flying <= 54 is false"
  );

  // cpu >= 80, avgFlying >= 54, flying > 54
  shedder.avgFlying = 80;
  shedder.flying = 80;

  console.log(
    shedder.shouldDrop() === true,
    "testAdaptiveShedderShouldDrop cpu >= 80, avgFlying >= 54, flying > 54 is true"
  );

  // cpu < 800, inflight > maxPass
  shedder.systemOverloaded = () => {
    return false;
  };
  shedder.avgFlying = 80;

  console.log(
    shedder.shouldDrop() === false,
    "testAdaptiveShedderShouldDrop cpu < 800, inflight > maxPass is false"
  );

  // cpu >=  800, inflight < maxPass

  shedder.systemOverloaded = () => {
    return true;
  };
  shedder.avgFlying = 80;
  shedder.flying = 80;

  console.log(
    shedder.shouldDrop() === true,
    "testAdaptiveShedderShouldDrop cpu >=  800, inflight < maxPass is true",
    "[err]:",
    shedder.allow().error
  );
}

function testAdaptiveShedderStillHot() {
  const shedder = new AdaptiveShedder({
    window,
    buckets,
  });
  shedder.windows = 10;

  for (let i = 0; i < 10; i++) {
    if (i > 0) {
      sleep(bucketDuration);
    }

    shedder.passCounter.add((i + 1) * 100);
    for (let j = i * 10 + 1; j <= i * 10 + 10; j++) shedder.rtCounter.add(j);
  }

  console.log(
    shedder.stillHot() === false,
    "testAdaptiveShedderStillHot stillHot is false"
  );
  shedder.dropTime = Date.now() - 1000 * 2;
  console.log(
    shedder.stillHot() === false,
    "testAdaptiveShedderStillHot stillHot is false"
  );
  shedder.droppedRecently = true;
  shedder.dropTime = Date.now() - 1000 / 2;
  console.log(
    shedder.stillHot() === true,
    "testAdaptiveShedderStillHot droppedRecently and drop time < 1s stillHot is true"
  );
  shedder.droppedRecently = true;
  shedder.dropTime = Date.now() - 1000 * 2;
  shedder.stillHot();
  console.log(
    shedder.droppedRecently,
    "testAdaptiveShedderStillHot droppedRecently and drop time > 1s droppedRecently is false"
  );
}

function sleep(time: number) {
  const time1 = Date.now();
  while (Date.now() - time1 < time) {}
}

function test() {
  testAdaptiveShedderMaxPass();
  testAdaptiveShedderMinRt();
  testAdaptiveShedderMaxFlight();
  testAdaptiveShedderShouldDrop();
  testAdaptiveShedderStillHot();
}

test();
