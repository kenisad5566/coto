import { Redis } from "ioredis";

const setScript = `
for _, offset in ipairs(ARGV) do
	redis.call("setbit", KEYS[1], offset, 1)
end
`;

const unSetScript = `
for _, offset in ipairs(ARGV) do
	redis.call("setbit", KEYS[1], offset, 0)
end
`;

const testScript = `
local ret = ""
for _, offset in ipairs(ARGV) do
	if tonumber(redis.call("getbit", KEYS[1], offset)) == 1 then
		ret = ret .. offset .. ","
	end
end
if ret == "" then
	return ret
end
return string.sub(ret, 1, string.len(ret)-1)
`;

const testWithPrefixScript = `
local ret = ""
local prefix = ARGV[1]
local join = ARGV[2]
local offset = ARGV[3]

for _, key in ipairs(KEYS) do
	if tonumber(redis.call("getbit", prefix..join..key, offset)) == 1 then
		ret = ret .. key .. ","
	end
end
if ret == "" then
	return ret
end
return string.sub(ret, 1, string.len(ret)-1)
`;

export const bitMapSet = async (
  store: Redis,
  key: string,
  offsets: number[]
) => {
  await store.eval(setScript, 1, [key, ...offsets]);
};

export const bitMapUnSet = async (
  store: Redis,
  key: string,
  offsets: number[]
) => {
  await store.eval(unSetScript, 1, [key, ...offsets]);
};

export const bitMapTest = async (
  store: Redis,
  key: string,
  offsets: number[]
): Promise<number[]> => {
  const ret = await store.eval(testScript, 1, [key, ...offsets]);
  return ret ? ret.split(",").map((i: number) => Number(i)) : [];
};

export const bitMapTestBatch = async (
  store: Redis,
  symbols: number[] | string[],
  prefix: string,
  join: string,
  offset: number
): Promise<number[]> => {
  const ret = await store.eval(testWithPrefixScript, symbols.length, [
    ...symbols,
    prefix,
    join,
    offset,
  ]);
  return ret ? ret.split(",").map((i: number) => Number(i)) : [];
};
