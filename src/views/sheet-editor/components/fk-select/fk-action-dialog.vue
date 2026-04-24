<template>
  <el-dialog
    :title="title"
    :visible="visible"
    :width="width"
    :top="top"
    append-to-body
    :close-on-click-modal="false"
    :custom-class="customClass"
    @close="handleClose"
  >
    <iframe
      v-if="visible"
      :key="iframeKey"
      ref="actionIframe"
      :src="url"
      frameborder="0"
      class="fk-action-dialog__iframe"
      style="width: 100%; height: 70vh; border: none; display: block"
      @load="handleIframeLoad"
    ></iframe>
  </el-dialog>
</template>

<script>
export default {
  name: "FkActionDialog",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: "",
    },
    url: {
      type: String,
      default: "",
    },
    iframeKey: {
      type: [String, Number],
      default: 0,
    },
    width: {
      type: String,
      default: "90%",
    },
    top: {
      type: String,
      default: "5vh",
    },
    customClass: {
      type: String,
      default: "fk-action-dialog",
    },
  },
  mounted() {
    window.addEventListener("message", this.handleIframeMessage);
  },
  beforeDestroy() {
    window.removeEventListener("message", this.handleIframeMessage);
  },
  methods: {
    handleClose() {
      this.$emit("update:visible", false);
      this.$emit("close");
    },
    handleIframeLoad(event) {
      this.$emit("iframe-load", event);
    },
    handleIframeMessage(event) {
      const iframeWindow = this.$refs.actionIframe?.contentWindow;
      if (!iframeWindow || event.source !== iframeWindow) {
        return;
      }
      if (!event.data || typeof event.data !== "object") {
        return;
      }
      const { type, data } = event.data;
      this.$emit("message", event.data);

      switch (type) {
        case "FORM_READY":
          this.$emit("form-ready", data);
          break;
        case "ADD_SUCCESS":
          this.$emit("add-success", data);
          break;
        case "UPDATE_SUCCESS":
          this.$emit("update-success", data);
          break;
        case "CLOSE_DIALOG":
          this.$emit("update:visible", false);
          this.$emit("close-dialog", data);
          break;
        default:
          this.$emit("unknown-message", event.data);
          break;
      }
    },
  },
};
</script>

<style lang="scss">
.fk-action-dialog,
.fk-edit-dialog {
  .el-dialog__body {
    padding: 0 20px 20px;
    min-height: 70vh;
  }
}
</style>

<style lang="scss" scoped>
.fk-action-dialog__iframe {
  width: 100%;
  height: 70vh;
  border: none;
}
</style>
