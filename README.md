# coto

该库提供了一系列 nodejs web 后端常用的工具，包括自适应降载器，时间滑动窗口，时间轮定时器，lru，布隆过滤器，bitmap 和一些限速工具等。

# usage

```
npm i cotool
```

# adapter shedder

自适应降载器，会计算当前进程 cpu 消耗情况，时间窗口内最大并发数，和当前平均并发数等数据，自适应拒绝请求，降低服务器负载。

```javascript
const shedder = new AdaptiveShedder({
  window:5, // 时间窗口5秒
  buckets:50, // 5秒窗口桶的数量，每个桶5 * 1000/50 = 100ms
  beta:0.95, // 滑动平均权重，0.95相当于20次平均值
  cpu:{
	  cpuThreshold:700000, //cpu负载，大约相当于60%
	  cpuBeta:0,9, // cpu负载统计，滑动平均权重，相当于10次平均
	  duration:250 // cpu统计周期，250ms统计一次
  }
});
// 注册一个中间件，调用allow()方法，返回一个promise和error，如果error有值，说明负载太高，直接拒绝请求，promise.fail()记录请求失败，promise.pass()记录请求成功
export default class AdaptiveShedderMiddleware implements KoaMiddleware {
  constructor() {}

  use = async (ctx: Context, next: NextFunction) => {
    const { promise, error } = shedderClient.allow()
    if (error) {
      ctx.status = 500
      throw new Error('负载太高')
    }
    try {
      await next()
    } finally {
      if (![200].includes(ctx.status)) {
        promise.fail()
      } else {
        promise.pass()
      }
    }
  }
}

```

# 布隆过滤器

布隆过滤器常用来判断不存在，可以用来解决缓存穿透等场景问题。(注意，布隆过滤器不能处理删除)

```javascript
import RedisClient, { RedisOptions, Redis } from "ioredis";
const redisOption = { host: "127.0.0.1", port: 6379 };
const store = new RedisClient(options);

const bitSet = new RedisBitSet(store, "test_key", 64); // 包含64个bit位
const filter = new Filter(64, bitSet); // 64个比特位
// set a value
await filter.add("hello");
await filter.add("world");

await filter.exists("hello"); // true
await filter.exists("world"); // true
await filter.exists("hello world"); // false
```

# bitmap

基于 redis 的 bitmap，可以用来做一些判断存在性问题的场景，比如一篇文章，用户 a 是否已读。

```javascript
import RedisClient, { RedisOptions, Redis } from "ioredis";
const redisOption = { host: "127.0.0.1", port: 6379 };
const store = new RedisClient(options);

await bitMapSet(store, key, [1, 2, 3]); // 索引位 1  2 3 设为[1]
await bitMapTest(store, key, [1, 2, 3, 4, 5]); // 返回值为1的索引，[1,2,3]
await bitMapUnSet(store, key, [1, 2]); // 将索引位 1,2的值设为0
await bitMapTest(store, key, [1, 2, 3, 4, 5]); // 返回值为1的索引，[3]
```

# 时间滑动窗口

时间滑动窗口可以用来收集一些时序相关的信息，可以用在限速，时序相关热度榜等场景

```javascript
const size = 300; // 300个桶
const interval = 50; // 每个桶50ms
const ignoreCurrent = true; // reduce时是否忽略当前正在写入的桶，未写完的桶可能会在统计时提供不完整的信息
const r = new RollingWindow({ size, interval, ignoreCurrent });

r.add(1); // 在当前桶添加值，比如在做时间窗口限速时，每个请求进来都add(1)

// 做计数统计,只统计当前有效窗口
const result = [];
r.reduce((bucket) => {
  result.push(bucket.sum);
});
```
