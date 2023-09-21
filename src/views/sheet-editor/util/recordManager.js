export class RecordManager {
    constructor(max) {
      this.historyIndex = -1;
      this.historyStore = [];
      this.max = max || 20;
    }

    getStore() {
      return this.historyStore;
    }

    push(d) {
      if (this.historyIndex >= 0) {
        // diff(d, this.historyStore[this.historyIndex]);
        if (
          d &&
          JSON.stringify(d) ===
            JSON.stringify(this.historyStore[this.historyIndex])
        ) {
          // 没有改动
          return;
        }
      }

      // 撤销后重新添加记录 删除撤销的记录
      if (this.historyIndex != this.historyStore.length - 1) {
        let dif = this.historyStore.length - this.historyIndex - 1;
        this.historyStore.splice(this.historyIndex, dif);
      }

      // 新增记录
      this.historyStore.push(d);
      this.historyIndex++;

      // 超出
      if (this.historyIndex.length > this.max) {
        this.historyStore.shift();
        this.historyIndex--;
      }
    }

    undo() {
      if (this.historyStore.length < 1 || this.historyIndex < 1) return;
      // if (this.historyStore.length == 0 || this.historyIndex < 0) return;
      this.historyIndex--;
      console.log(this.historyIndex);
      return this.historyStore[this.historyIndex];
    }

    redo() {
      if (
        this.historyStore.length == 0 ||
        this.historyIndex >= this.historyStore.length
      )
        return;
      this.historyIndex++;
      console.log(this.historyIndex);

      return this.historyStore[this.historyIndex];
    }
  }