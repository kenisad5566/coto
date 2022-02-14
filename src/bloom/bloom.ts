// for detailed see  https://pages.cs.wisc.edu/~cao/papers/summary-cache/node8.html and https://zhuanlan.zhihu.com/p/140545941
// m bit array length, n element number, k hash function num, generally use k = 0.7  * m / n

import { hash } from "./../util/util";

const maps = 14;
const setScript = `
for _, offset in ipairs(ARGV) do
	redis.call("setbit", KEYS[1], offset, 1)
end
`;
const testScript = `
for _, offset in ipairs(ARGV) do
	if tonumber(redis.call("getbit", KEYS[1], offset)) == 0 then
		return false
	end
end
return true
`;

export class Filter {
  public bits: number; // m bit num
  public bitSet: BitSetProvider; // store

  constructor(bits: number, bitSet: BitSetProvider) {
    this.bitSet = bitSet;
    this.bits = bits;
  }

  /**
   * add data into filter
   */
  async add(data: string | number) {
    const locations = this.getLocations(data);
    return await this.bitSet.set(locations);
  }

  /**
   * check if data is in filter
   * @param data
   * @returns
   */
  async exists(data: string | number): Promise<boolean> {
    const locations = this.getLocations(data);
    const isSet = await this.bitSet.check(locations);
    return isSet;
  }

  getLocations(data: string | number): number[] {
    const locations: number[] = [];
    for (let i = 0; i < maps; i++) {
      data = data + i.toString();
      const hashValue = hash(data);
      locations[i] = parseInt(hashValue, 10) % this.bits;
    }
    return locations;
  }
}

export class RedisBitSet implements BitSetProvider {
  public store: any; // redis instance
  public key: string;
  public bits: number;

  constructor(store: any, key: string, bits: number) {
    this.store = store;
    this.key = key;
    this.bits = bits;
  }

  buildOffsetArgs(offsets: number[]): number[] {
    const args: number[] = [];
    for (const offset of offsets) {
      if (offset > this.bits) throw new Error("too large offset");
      args.push(offset);
    }
    return args;
  }

  async check(locations: number[]): Promise<boolean> {
    const args = this.buildOffsetArgs(locations);
    const res = await this.store.eval(testScript, 1, [this.key, ...args]);
    if (res === 1) return true;
    return false;
  }

  async set(locations: number[]) {
    const args = this.buildOffsetArgs(locations);
    await this.store.eval(setScript, 1, [this.key, ...args]);
  }

  async del() {
    await this.store.del(this.key);
  }

  async expire(ttl: number) {
    await this.store.expire(this.key, ttl);
  }
}

export interface BitSetProvider {
  check(locations: number[]): Promise<boolean>;
  set(locations: number[]): void;
}
