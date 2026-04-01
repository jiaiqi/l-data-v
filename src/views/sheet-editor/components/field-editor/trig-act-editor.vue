<template>
  <div
    class="trig-act-editor"
    ref="editorRef"
    v-clickoutside="handleClickOutside"
  >
    <div class="cell-display">{{ displayValue }}</div>
    <div class="action-icons" v-if="actionButtons.length > 0">
      <div
        v-for="btn in actionButtons"
        :key="btn.key"
        class="action-btn"
        :class="btn.className"
        :title="btn.title"
        @click.stop="btn.handler"
      >
        <i :class="btn.icon"></i>
        <span class="btn-text">{{ btn.text }}</span>
      </div>
    </div>

    <el-dialog
      :title="addDialogTitle"
      :visible.sync="addDialogVisible"
      width="90%"
      top="5vh"
      append-to-body
      :close-on-click-modal="false"
      @close="handleAddDialogClose"
    >
      <iframe
        v-if="addDialogVisible"
        ref="addIframe"
        :src="addIframeUrl"
        frameborder="0"
        style="width: 100%; height: 70vh; border: none"
        @load="handleIframeLoad"
      ></iframe>
    </el-dialog>

    <el-dialog
      :title="historyDialogTitle"
      :visible.sync="historyDialogVisible"
      width="90%"
      top="5vh"
      append-to-body
      :close-on-click-modal="false"
    >
      <iframe
        v-if="historyDialogVisible"
        :key="historyIframeKey"
        ref="historyIframe"
        :src="historyIframeUrl"
        frameborder="0"
        style="width: 100%; height: 70vh; border: none"
      ></iframe>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: "TrigActEditor",
  directives: {
    clickoutside: {
      bind(el, binding, vnode) {
        el.clickOutsideEvent = function (event) {
          if (!(el === event.target || el.contains(event.target))) {
            binding.value(event, el);
          }
        };
        document.addEventListener("click", el.clickOutsideEvent);
      },
      unbind(el) {
        document.removeEventListener("click", el.clickOutsideEvent);
      },
    },
  },
  props: {
    value: {
      type: [String, Number],
      default: "",
    },
    row: {
      type: Object,
      required: true,
    },
    column: {
      type: Object,
      required: true,
    },
    fieldInfo: {
      type: Object,
    },
    app: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      addDialogVisible: false,
      historyDialogVisible: false,
      historyIframeKey: 0,
    };
  },
  computed: {
    trigAct() {
      return (
        this.fieldInfo?.trig_act ||
        this.column?.trig_act ||
        this.column?.__field_info?.trig_act
      );
    },
    fkConfig() {
      return this.trigAct?.fk || null;
    },
    addSrvConfig() {
      return this.trigAct?.add_srv || null;
    },
    selSrvConfig() {
      return this.trigAct?.sel_srv || null;
    },
    hasAddSrv() {
      return !!this.addSrvConfig?.srv &&this.addSrvConfig?.permission!==false;
    },
    hasSelSrv() {
      return !!this.selSrvConfig?.srv &&this.selSrvConfig?.permission!==false;
    },
    displayValue() {
      return this.value ?? "";
    },
    actionButtons() {
      const buttons = [];
      
      if (this.hasAddSrv) {
        buttons.push({
          key: "add",
          icon: "el-icon-plus",
          text: "新增",
          title: this.addDialogTitle,
          className: "btn-add",
          handler: this.openAddDialog,
        });
      }
      
      if (this.hasSelSrv) {
        buttons.push({
          key: "history",
          icon: "el-icon-time",
          text: "历史",
          title: this.historyDialogTitle,
          className: "btn-history",
          handler: this.openHistoryDialog,
        });
      }
      
      return buttons;
    },
    historyDialogTitle() {
      return this.selSrvConfig?.title || "历史记录";
    },
    addDialogTitle() {
      return this.addSrvConfig?.title || "新增记录";
    },
    historyIframeUrl() {
      if (!this.selSrvConfig?.srv || !this.fkConfig?.referenced_column_name) {
        return "";
      }
      const serviceName = encodeURIComponent(this.selSrvConfig.srv);
      const condCol = encodeURIComponent(this.fkConfig.referenced_column_name);
      const condValue = encodeURIComponent(
        this.row?.[this.fkConfig.column_name] ?? ""
      );
      let url = `/vpages/#/list/${serviceName}/${condCol}/${condValue}`;
      if (this.app) {
        url += `?srvApp=${encodeURIComponent(this.app)}`;
      }
      return url;
    },
    addIframeUrl() {
      if (!this.addSrvConfig?.srv) {
        return "";
      }
      const serviceName = this.addSrvConfig.srv;
      let url = `/vpages/#/add/${serviceName}`;
      if (this.fkConfig) {
        const refedCol = this.fkConfig.referenced_column_name;
        const currentCol = this.fkConfig.column_name;
        const operate_params = {
          data: [
            {
              [refedCol]: this.row[currentCol],
            },
          ],
        };
        url += `?operate_params=${JSON.stringify(operate_params)}`;
        if(this.app){
          url+=`&srvApp=${this.app}`
        }
      }
      return url;
    },
  },
  mounted() {
    console.log("trig-act-editor mounted", {
      fieldInfo: this.fieldInfo,
      column: this.column,
      trigAct: this.trigAct,
      hasAddSrv: this.hasAddSrv,
      hasSelSrv: this.hasSelSrv,
    });
    this.$emit("focus");

    window.addEventListener("message", this.handleIframeMessage);
  },
  beforeDestroy() {
    window.removeEventListener("message", this.handleIframeMessage);
  },
  methods: {
    handleClickOutside() {
      if (this.addDialogVisible || this.historyDialogVisible) {
        return;
      }
      this.$emit("blur");
    },
    openAddDialog() {
      this.addDialogVisible = true;
    },
    handleIframeLoad() {
      console.log("iframe loaded");
    },
    handleIframeMessage(event) {
      console.info("收到 iframe 消息:", event.data);

      if (event.source !== this.$refs.addIframe?.contentWindow) {
        return;
      }

      if (!event.data || typeof event.data !== "object") {
        return;
      }

      const { type, data } = event.data;

      switch (type) {
        case "ADD_SUCCESS":
          this.$message.success("添加成功");
          this.addDialogVisible = false;
          if (this.historyDialogVisible) {
            this.reloadHistoryIframe();
          }
          this.$emit("add-success", data);
          break;
        case "CLOSE_DIALOG":
          this.addDialogVisible = false;
          break;
        case "FORM_READY":
          console.log("表单已准备好");
          break;
        default:
          break;
      }
    },
    handleAddDialogClose() {
      console.log("添加弹窗关闭");
    },
    openHistoryDialog() {
      this.historyDialogVisible = true;
      this.reloadHistoryIframe();
    },
    reloadHistoryIframe() {
      this.historyIframeKey += 1;
    },
  },
};
</script>

<style lang="scss" scoped>
.trig-act-editor {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;

  .cell-display {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 0 4px;
  }

  .action-icons {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateX(calc(100% + 8px)) translateY(-50%);
    z-index: 9;
    display: flex;
    flex-direction: column;
    gap: 2px;
    background: #fff;
    border: 1px solid #dcdfe6;
    border-radius: 6px;
    padding: 6px 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

    .action-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 6px 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
      min-width: 50px;

      i {
        font-size: 18px;
        color: #409eff;
        margin-bottom: 2px;
        transition: color 0.2s ease;
      }

      .btn-text {
        font-size: 12px;
        color: #606266;
        white-space: nowrap;
        transition: color 0.2s ease;
      }

      &:hover {
        background: #f5f7fa;

        i {
          color: #66b1ff;
        }

        .btn-text {
          color: #409eff;
        }
      }

      &:active {
        background: #ecf5ff;
      }

      &.btn-add {
        i {
          color: #67c23a;
        }

        &:hover {
          i {
            color: #85ce61;
          }
        }
      }

      &.btn-history {
        i {
          color: #409eff;
        }

        &:hover {
          i {
            color: #66b1ff;
          }
        }
      }
    }
  }
}
</style>
