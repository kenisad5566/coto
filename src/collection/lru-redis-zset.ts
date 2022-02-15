import { Redis } from "ioredis";

export class ZsetLru {
  private capacity: number;
  private store: Redis;
  private storeZsetKey: string;
  private storeHashKey: string;

  constructor(store: Redis, storeKey: string, capacity: number) {
    this.store = store;
    this.capacity = capacity;
    if (capacity <= 0) throw new Error("zset lru capacity should more than 0");
    this.storeZsetKey = storeKey;
    this.storeHashKey = this.storeZsetKey + "_hash_map";
  }

  /**
   * set key value
   * @param key zset key
   * @param value cache key
   */
  public async put(key: string, value: string) {
    await this.store.zadd(
      this.storeZsetKey,
      new Date().getTime().toString(),
      key
    );
    await this.store.hset(this.storeHashKey, key, value);
    if ((await this.store.zcard(this.storeZsetKey)) > this.capacity) {
      const removeKey = await this.store.zrevrange(
        this.storeZsetKey,
        this.capacity,
        -1
      ); // get need remove key
      await this.store.hdel(this.storeHashKey, removeKey); // del hash value
      await this.store.zremrangebyrank(this.storeZsetKey, 0, 0); // remove zset key member
    }
  }

  /**
   * visit key, resort members
   * @param key
   * @returns
   */
  public async get(key: string): Promise<string | null> {
    if (!(await this.memberExists(key))) return null;
    const value = await this.store.hget(this.storeHashKey, key);
    if (!value) return null;
    await this.put(key, value); // update key rank
    return value;
  }

  /**
   * list all members
   * @returns string[]
   */
  public async list(): Promise<string[]> {
    return (await this.store.zrange(this.storeZsetKey, 0, -1)).reverse();
  }

  /**
   * detect member exists
   * @param key
   * @returns
   */
  public async memberExists(key: string): Promise<boolean> {
    if (await this.store.zscore(this.storeZsetKey, key)) return true;
    return false;
  }

  /**
   * zset lru members number
   * @returns
   */
  public async lenth(): Promise<number> {
    return await this.store.zcard(this.storeZsetKey);
  }

  /**
   * set expire time
   * @param num
   */
  public async expire(num: number) {
    await this.store.expire(this.storeZsetKey, num);
    await this.store.expire(this.storeHashKey, num);
  }

  /**
   * delete
   */
  public async del() {
    await this.store.del(this.storeZsetKey);
    await this.store.del(this.storeHashKey);
  }
}
