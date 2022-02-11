import { Bucket } from "./collection/rolling-window";

export class CpuOptions {
  cpuThreshold: number; // cpu负载临界值
  cpuBeta: number; // cpu滑动平均beta值，如0.95， 250ms计算一次，相当于历史20次cpu负载的平均值，时间周期约为5s
  duration: number; // cpu统计周期，单位ms
}

export class ShedderOptions {
  window?: number; // 滑动时间窗口大小， 默认5s
  buckets?: number; // 滑动时间窗口桶数量， 默认50个桶，每个桶100ms
  cpu?: CpuOptions;
  beta?: number; // 滑动权重 默认0.95
}

export class Monit {
  // cpu使用情况
  cpuUsage: number;
}

export class RollingWindowOptions {
  size: number; // 桶数量
  interval: number; // 桶时间间隔
  ignoreCurrent?: boolean; // 统计时是否忽略当前桶
}

export type WindowBucketsReduceFun = (b: Bucket) => void;
