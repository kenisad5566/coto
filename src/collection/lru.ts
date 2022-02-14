// lru cache
export class LRUCache {
  public map: any = {};
  public head: TwoDirectionListNode | null = null;
  public tail: TwoDirectionListNode | null = null;
  public capacity = 0;
  public num = 0;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.head = new TwoDirectionListNode();
    this.tail = new TwoDirectionListNode();
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get(key: string): string | null {
    if (!this.map[key]) return null;
    const node = this.map[key];
    this.moveToHead(node);
    return node.val;
  }

  put(key: string, value: string): void {
    if (this.map[key]) {
      // 有key，移到头部
      const node = this.map[key];
      this.moveToHead(node);
      node.val = value;
    } else {
      const node = new TwoDirectionListNode(key, value);
      this.map[key] = node;
      this.addToHead(node);
      this.num++;

      if (this.num > this.capacity) {
        // 满了

        if (this.tail?.prev && this.tail.prev.k) {
          delete this.map[this.tail.prev.k];
        }
        if (this.tail?.prev) this.removeNode(this.tail.prev);
        this.num--;
      }
    }
  }

  public addToHead(node: TwoDirectionListNode) {
    node.next = (this.head as any).next;
    (this.head as any).next.prev = node;
    (this.head as any).next = node;
    node.prev = this.head;
  }

  public removeNode(node: TwoDirectionListNode) {
    (node.prev as any).next = node.next;
    (node.next as any).prev = node.prev;
  }

  public moveToHead(node: TwoDirectionListNode) {
    this.removeNode(node);
    this.addToHead(node);
  }
}

class TwoDirectionListNode {
  public val: string;
  public k: string;
  public next: TwoDirectionListNode | null = null;
  public prev: TwoDirectionListNode | null = null;
  constructor(
    key: any = null,
    val: any = null,
    next: TwoDirectionListNode | null = null,
    prev: TwoDirectionListNode | null = null
  ) {
    this.k = key;
    this.val = val;
    this.next = next;
    this.prev = prev;
  }
}
