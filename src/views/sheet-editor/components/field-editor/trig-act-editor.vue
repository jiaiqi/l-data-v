<template>
  <div
    class="trig-act-editor"
    ref="editorRef"
    v-clickoutside="handleClickOutside"
  >
    <div class="cell-display">{{ displayValue }}</div>
    <div class="action-icons">
      <i
        v-if="hasAddSrv"
        class="icon-add el-icon-plus"
        title="新增"
        @click.stop="openAddDialog"
      ></i>
      <i
        v-if="hasSelSrv"
        class="icon-history el-icon-time"
        title="历史记录"
        @click.stop="openHistoryDialog"
      ></i>
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
      return !!this.addSrvConfig?.srv;
    },
    hasSelSrv() {
      return !!this.selSrvConfig?.srv;
    },
    displayValue() {
      return this.value ?? "";
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
    transform: translateX(calc(100% + 5px)) translateY(-50%);
    z-index: 9;
    display: flex;
    align-items: center;
    gap: 4px;
    background: #fff;
    border: 1px solid #333;
    border-radius: 4px;
    padding: 4px;

    i {
      font-size: 16px;
      color: #409eff;
      cursor: pointer;
      padding: 2px;

      &:hover {
        color: #66b1ff;
      }
    }
  }
}
</style>
