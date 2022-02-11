import { Bucket, RollingWindow } from "../collection/rolling-window";
import { systemOverLoadChecker, cpuUsage } from "../cpu/cpu";
import { ShedderOptions } from "../type";

export class AdaptiveShedder {
  // cpu负载临界值
  // 高于临界值代表高负载需要降载保证服务
  public cpuThreshold: number;

  // 1s内有多少个桶
  public windows: number;

  // 并发数
  public flying: number;

  // 滑动平滑并发数
  public avgFlying: number;

  // 最后一次拒绝时间，单位ms
  public dropTime: number;

  // 最近是否被拒绝过
  public droppedRecently: boolean;

  // 请求数统计，通过滑动时间窗口记录最近一段时间内的指标
  public passCounter: RollingWindow;

  // 响应时间统计，通过滑动时间窗口记录最近一段时间内的指标
  public rtCounter: RollingWindow;

  // 滑动权重
  public beta: number;

  constructor(options: ShedderOptions) {
    const {
      window = 5, // 5秒窗口
      buckets = 50,
      beta = 0.95,
    } = options;

    if (!options.cpu)
      options.cpu = { cpuThreshold: 70000, cpuBeta: 0.95, duration: 250 };

    // 每个窗口时间间隔，默认100ms
    const bucketDuration = Math.floor((window / buckets) * 1000);

    // cpu负载阈值
    this.cpuThreshold = options.cpu.cpuThreshold;
    // 1s的时间内包含多少个滑动窗口
    this.windows = Math.ceil(1000 / bucketDuration);
    // 最近一次拒绝时间
    this.dropTime = 0;
    // 最近是否被拒绝过
    this.droppedRecently = false;
    // qps统计，滑动时间窗口
    // 忽略当前正在写入窗口（桶），时间周期不完整可能导致数据异常

    this.passCounter = new RollingWindow({
      size: buckets,
      interval: bucketDuration,
      ignoreCurrent: true,
    });
    // // 响应时间统计，滑动时间窗口 单位ms
    // // 忽略当前正在写入窗口（桶），时间周期不完整可能导致数据异常
    this.rtCounter = new RollingWindow({
      size: buckets,
      interval: bucketDuration,
      ignoreCurrent: true,
    });
    this.beta = beta;
    this.flying = 0;
    this.avgFlying = 0;

    cpuUsage(options.cpu); // 计算cpu使用
  }

  allow(): { promise: ShedderPromise | null; error: string } {
    const now = new Date().getTime();
    // 检查请求是否被丢弃
    if (this.shouldDrop()) {
      // 设置最近拒绝时间
      this.dropTime = now;
      // 最近已被drop
      this.droppedRecently = true;
      // 返回过载
      console.log("shouldDrop");
      return { promise: null, error: "too hot" };
    }

    // 正在处理的请求数加1
    this.addFlying(1);

    // 这里每个允许的请求都会返回一个新的promise对象
    // promise内部持有了降载指针对象

    return { promise: new ShedderPromise(now, this), error: "" };
  }

  addFlying(num: number) {
    const flying = this.flying + num;
    // 请求结束后，统计当前正在处理的请求并发
    if (num < 0)
      this.avgFlying = this.avgFlying * this.beta + flying * (1 - this.beta);

    this.flying = flying;
  }

  // 请求是否应该被废弃
  shouldDrop(): boolean {
    // 当前cpu负载超过阈值
    // 服务处于冷却期内应该继续检查负载并尝试丢弃请求
    if (this.systemOverloaded() || this.stillHot()) {
      // 检查正在处理的并发是否超出当前可承载的最大并发数
      // 超出则丢弃请求
      if (this.highThru()) {
        // const flying = this.flying
        // const avgFlying = this.avgFlying
        return true;
      }
    }

    return false;
  }

  // cpu是否过载
  systemOverloaded(): boolean {
    return systemOverLoadChecker(this.cpuThreshold);
  }

  // 是否依然过热
  stillHot(): boolean {
    // 最近没有丢弃请求
    // 说明服务正常
    if (!this.droppedRecently) return false;

    // 不在冷却期
    if (!this.dropTime) return false;

    // 冷却期默认1000ms
    const collOffDuration = 1000;
    const hot =
      new Date().getTime() - this.dropTime < collOffDuration ? true : false;

    // 过了冷却期
    if (!hot) {
      this.droppedRecently = false;
    }

    return hot;
  }

  /**
   * 当前正在处理的并发数是否大于系统并发数上限
   */
  highThru(): boolean {
    const avgFlying = this.avgFlying;
    const maxFlight = this.maxFlight(); // 系统最大并发数
    // console.log('maxFlight', maxFlight, 'avgFlying', avgFlying, 'flying', this.flying)

    // 正在处理的并发数和平均并发数是否大于系统的最大并发数
    return Number(avgFlying) > maxFlight && this.flying > maxFlight;
  }

  /**
   *  计算每秒系统的最大并发数 最大并发数 = 最大请求数（qps）* 最小响应时间（rt）
   *  qps * rt / duration
   */
  maxFlight(): number {
    // windows = buckets per second
    // maxQPS = maxPass * windows
    // minRT = min average response time in milliseconds
    // maxQPS * minRT / milliseconds_per_second
    // as.maxPass()*as.windows - 每个桶最大的qps * 1s内包含桶的数量
    // as.minRt()/1e3 - 窗口所有桶中最小的平均响应时间 / 1000ms这里是为了转换成秒
    return Number(
      Math.max(1, this.maxPass() * this.windows * (this.minRt() / 1000))
    );
  }

  // 滑动时间窗口内有多个桶
  // 找到请求数最多的那个
  // 每个桶占用的时间为 internal ms
  // qps指的是1s内的请求数，qps: maxPass * 1s/internal
  maxPass(): number {
    let maxPass = 1;
    // 当前时间窗口内请求数量最多的桶
    this.passCounter.reduce((b: Bucket) => {
      maxPass = Math.max(maxPass, b.sum);
    });
    return maxPass;
  }

  // 滑动时间窗口内有多个桶
  // 计算最小的平均响应时间
  // 因为需要计算近一段时间内系统能够处理的最大并发数/**
  minRt(): number {
    let minRt = 1000; // 默认1000ms
    this.rtCounter.reduce((b: Bucket) => {
      if (b.count <= 0) return;
      // 请求平均响应时间
      const avg = Math.round(b.sum / b.count);
      minRt = Math.min(minRt, avg);
    });
    return minRt;
  }
}

export class ShedderPromise {
  start: number; // 请求开始时间
  shedder: AdaptiveShedder;

  constructor(start: number, shedder: AdaptiveShedder) {
    this.start = start;
    this.shedder = shedder;
  }

  fail() {
    this.shedder.addFlying(-1);
  }

  pass() {
    // 响应时间，单位毫秒
    const now = new Date().getTime();
    const rt = now - this.start;
    this.shedder.addFlying(-1);
    this.shedder.passCounter.add(1);
    this.shedder.rtCounter.add(rt);
  }
}
