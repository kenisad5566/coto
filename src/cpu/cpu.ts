import { cpuUsage as cpuUse } from "process";
import { CpuOptions, Monit } from "../type";

/**
 * 每个250ms统计cpu使用情况
 *
 */

// 上次cpu使用时间
let lastCpuUsage = 0;
const monit: Monit = { cpuUsage: 0 };

/**
 * 统计cpu负载
 * @param options
 * @param monit
 */
export const cpuUsage = (options: CpuOptions) => {
  // 该进程用户态总cpu使用时间
  const nowCpuUsage = cpuUse().user;
  // 本次统计周期使用量
  const curUsage = lastCpuUsage ? nowCpuUsage - lastCpuUsage : nowCpuUsage;
  // 滑动平均计算平均使用量
  monit.cpuUsage =
    monit.cpuUsage * options.cpuBeta + curUsage * (1 - options.cpuBeta); // cpu = cpuᵗ⁻¹ * beta + cpuᵗ * (1 - beta)

  // 保存本次用户态总使用时间;
  lastCpuUsage = nowCpuUsage;
  setTimeout(() => {
    cpuUsage(options);
  }, options.duration);
};

/**
 * 检查cpu是否超过临界值
 * @param options
 * @param monit
 * @returns
 */
export const systemOverLoadChecker = (cpuThreshold: number): boolean => {
  if (Number(monit.cpuUsage) >= cpuThreshold) return true;
  return false;
};
