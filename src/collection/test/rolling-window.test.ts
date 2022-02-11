/**
 * 测试命令   ./node_modules/.bin/mocha -r ./node_modules/ts-node/register .\src\collection\test\rolling-window.test.ts
 */

import { RollingWindow } from "../rolling-window";
var assert = require("assert");

let size = 10;
// const duration = 50;

// describe("#add()", function () {
//   size = 3;
//   const r = new RollingWindow({ size, interval: duration });
//   const listBuckets = function () {
//     let buckets: any[] = [];
//     r.reduce((b: any) => {
//       buckets.push(b.sum);
//     });
//     return buckets;
//   };
//   describe("test add()", function () {
//     it("[0,0,0]", function () {
//       assert.equal(JSON.stringify([0, 0, 0]), JSON.stringify(listBuckets()));
//     });

//     it("[0,0,1]", function () {
//       r.add(1);
//       assert.equal(JSON.stringify([0, 0, 1]), JSON.stringify(listBuckets()));
//     });

//     it("[0,1,5]", function () {
//       sleep(duration);
//       r.add(2);
//       r.add(3);
//       assert.equal(JSON.stringify([0, 1, 5]), JSON.stringify(listBuckets()));
//     });

//     it("[1,5,15]", function () {
//       sleep(duration);
//       r.add(4);
//       r.add(5);
//       r.add(6);
//       assert.equal(JSON.stringify([1, 5, 15]), JSON.stringify(listBuckets()));
//     });

//     it("[5,15,7]", function () {
//       sleep(duration);
//       r.add(7);
//       assert.equal(JSON.stringify([5, 15, 7]), JSON.stringify(listBuckets()));
//     });
//   });
// });

// describe("TestRollingWindowReset", function () {
//   size = 3;
//   const r = new RollingWindow({
//     size,
//     interval: duration,
//     ignoreCurrent: true,
//   });
//   const listBuckets = function () {
//     let buckets: any[] = [];
//     r.reduce((b: any) => {
//       buckets.push(b.sum);
//     });
//     return buckets;
//   };
//   it("[0,1]", function () {
//     r.add(1);
//     sleep(duration);
//     assert.equal(JSON.stringify([0, 1]), JSON.stringify(listBuckets()));
//   });

//   it("[1]", function () {
//     sleep(duration);
//     assert.equal(JSON.stringify([1]), JSON.stringify(listBuckets()));
//   });

//   it("[]", function () {
//     sleep(duration);
//     assert.equal(JSON.stringify([]), JSON.stringify(listBuckets()));
//   });

//   it("cross window []", function () {
//     r.add(1);
//     sleep(duration * 10);
//     assert.equal(JSON.stringify([]), JSON.stringify(listBuckets()));
//   });
// });

// describe("TestRollingWindowReduce with ignoreCurrent false", function () {
//   size = 4;
//   const r = new RollingWindow({
//     size,
//     interval: duration,
//     ignoreCurrent: false,
//   });
//   const result = function () {
//     let ret = 0;
//     r.reduce((b: any) => {
//       ret += b.sum;
//     });
//     return ret;
//   };
//   it("10", function () {
//     for (let i = 0; i < size; i++) {
//       for (let j = 0; j <= i; j++) {
//         r.add(j);
//       }
//       if (i < size - 1) sleep(duration);
//     }
//     assert.equal(10, result());
//   });
// });

// describe("TestRollingWindowReduce with ignoreCurrent true", function () {
//   size = 4;
//   const r = new RollingWindow({
//     size,
//     interval: duration,
//     ignoreCurrent: true,
//   });
//   const result = function () {
//     let ret = 0;
//     r.reduce((b: any) => {
//       ret += b.sum;
//     });
//     return ret;
//   };
//   it("4", function () {
//     for (let i = 0; i < size; i++) {
//       for (let j = 0; j <= i; j++) {
//         r.add(j);
//       }
//       if (i < size - 1) sleep(duration);
//     }
//     assert.equal(4, result());
//   });
// });

describe("TestRollingWindowBucketTimeBoundary", function () {
  size = 3;
  const duration = 30;
  const r = new RollingWindow({ size, interval: duration });
  const listBuckets = function () {
    let buckets: any[] = [];
    r.reduce((b: any) => {
      buckets.push(b.sum);
    });
    return buckets;
  };
  it("[0,0,0]", function () {
    assert.equal(JSON.stringify([0, 0, 0]), JSON.stringify(listBuckets()));
  });

  it("[0,0,1]", function () {
    r.add(1);
    const re = listBuckets();
    assert.equal(JSON.stringify([0, 0, 1]), JSON.stringify(re));
  });

  it("[0,1,5]", function () {
    sleep(45);
    r.add(2);
    r.add(3);
    const re = listBuckets();

    assert.equal(JSON.stringify([0, 1, 5]), JSON.stringify(re));
  });

  // sleep time should be less than interval, and make the bucket change happen
  it("[1,5,15]", function () {
    sleep(20);
    r.add(4);
    r.add(5);
    r.add(6);
    const re = listBuckets();

    assert.equal(JSON.stringify([1, 5, 15]), JSON.stringify(re));
  });

  it("[0, 0, 24]", function () {
    sleep(100);
    r.add(7);
    r.add(8);
    r.add(9);
    const re = listBuckets();
    assert.equal(JSON.stringify([0, 0, 24]), JSON.stringify(re));
  });
});

function sleep(time: number) {
  const time1 = new Date().getTime();
  while (new Date().getTime() - time1 < time) {}
}
