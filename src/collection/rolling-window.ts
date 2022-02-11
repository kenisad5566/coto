import { RollingWindowOptions, WindowBucketsReduceFun } from "../type";

/**
 * 滑动窗口桶
 */
export class RollingWindow {
  // 滑动窗口数量
  private size: number;

  // 窗口，数据容器
  public win: Windoww; // toto window type

  // 滑动窗口单元时间间隔 ms
  private interval: number;

  // 游标，用于等位当前应该写入的bucket
  public offset: number;

  /**
   * 汇总数据时，是否忽略当前正在写入桶的数据
   *  某些场景下因为当前正在写入的桶数据并没有完整经过时间窗口间隔
   * 	可能会导致当前桶的统计并不准确
   */
  private ignoreCurrent: boolean;

  /**
   * 最后写入桶的时间
   * 用于计算下一次写入数据间隔最后一次写入数据的之间经过了多少个时间间隔
   */
  private lastTime: number;

  constructor(options: RollingWindowOptions) {
    const { size, interval, ignoreCurrent = false } = options;
    this.size = size;
    this.interval = interval;
    this.ignoreCurrent = ignoreCurrent;
    this.offset = 0;
    this.win = new Windoww(size);
    this.lastTime = Date.now();
  }

  /**
   * 添加数据
   * @param v 数据
   */
  add(v: number) {
    this.updateOffset();
    this.win.add(this.offset, v);
  }

  /**
   * 更新游标
   * 实现窗口滑动
   */
  updateOffset() {
    // 经过span个桶的时间没有写入数据
    const now = Date.now(); // 当前时间戳，毫秒
    const span = this.span();
    // 还在同一单元时间内不需要更新
    if (span <= 0) return;

    // 既然经过了span个桶的时间没有写入数据
    // 那么这些桶内的数据就不应该继续保留了，属于过期数据清空即可
    // 可以看到这里全部用的 % 取余操作，可以实现按照下标周期性写入
    // 如果超出下标了那就从头开始写，确保新数据一定能够正常写入
    // 类似循环数组的效果// 依然经过了span个桶的时间没有写入数据
    const offset = this.offset;
    const lastTime = now - ((now - this.lastTime) % this.interval);

    for (let i = 0; i < span; i++)
      this.win.resetBucket((offset + i + 1) % this.size);

    // 更新offset
    this.offset = (offset + span) % this.size;

    // 更新lastTime
    // 这里这样写，是为了保证每个lastTime与当前桶左边界的时间值的偏移量是一样的

    this.lastTime = lastTime;
  }

  /**
   * 计算当前距离最后一次写入数据经过多少个单元时间间隔
   * 实际上就是经过多少个桶
   * 过期的桶数量
   */
  span(): number {
    const offset = Math.floor((Date.now() - this.lastTime) / this.interval);
    if (0 <= offset && offset < this.size) return offset;

    // 大于时间窗口，返回窗口大小
    return this.size;
  }

  // 归纳汇总数据
  reduce(fun: WindowBucketsReduceFun) {
    let diff;
    const span = this.span();
    // 当前时间截止前，未过期的桶的数量
    if (span === 0 && this.ignoreCurrent) {
      diff = this.size - 1;
    } else {
      diff = this.size - span;
    }

    if (diff > 0) {
      // rw.offset - rw.offset+span之间的桶数据是过期的不应该计入统计
      const offset = (this.offset + span + 1) % this.size;
      // 汇总数据
      this.win.reduce(offset, diff, fun);
    }
  }
}

export class Bucket {
  // 当前桶内值之和
  sum: number;
  // 当前桶的add总次数
  count: number;

  constructor() {
    this.sum = 0;
    this.count = 0;
  }

  /**
   * 向桶添加数据
   * @param v
   */
  add(v: number) {
    this.sum += v;
    this.count++;
  }

  /**
   * 桶数据清零
   */
  reset() {
    this.sum = 0;
    this.count = 0;
  }
}

//时间窗口，实际存数据的位置
export class Windoww {
  // 桶，一个桶表示一个时间间隔
  buckets: Bucket[];

  // 窗口大小
  size: number;

  constructor(size: number) {
    this.size = size;
    this.buckets = [];
    for (let i = 0; i < this.size; i++) this.buckets.push(new Bucket());
  }

  /**
   * 添加数据
   * @param offset : 游标，定位写入bucket位置;
   * @param v 行为数据
   */
  add(offset: number, v: number) {
    this.buckets[this.getCurrentBucketIndex(offset)].add(v);
  }

  /**
   * 汇总数据
   * @param start
   * @param count
   * @param fun 自定义的bucket统计函数
   */
  reduce(start: number, count: number, fun: WindowBucketsReduceFun) {
    for (let i = 0; i < count; i++) {
      fun(this.buckets[this.getCurrentBucketIndex(start + i)]);
    }
  }

  /**
   * 清理特定的bucket
   * @param offset : 游标;
   */
  resetBucket(offset: number) {
    this.buckets[this.getCurrentBucketIndex(offset)].reset();
  }

  private getCurrentBucketIndex(offset: number): number {
    return Math.floor(offset % this.size);
  }
}
