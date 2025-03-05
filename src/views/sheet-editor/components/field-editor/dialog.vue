<template>
  <el-dialog
    :visible="dialogVisible"
    @close="handleClose"
    :before-close="handleClose"
    :close-on-click-modal="false"
    width="90vw"
  >
    <div :style="setStyle">
      <!-- <div v-if="autoSaveTimeout && autoSaveTimeout > 0" class="top-tip">
        <span> 自动保存倒计时：{{ autoSaveTimeout }} </span>
      </div> -->
      <rich-text-editor
        v-if="editorType === 'RichText'"
        v-model="innerHtml"
        :mode="mode"
        :editable="editable"
        :dialogFullscreen="dialogFullscreen"
      ></rich-text-editor>
      <div class="text-orange text-center" v-if="!disabled && !editable">
        <span class="mr-20px"> 当前字段不可编辑 </span>
        <el-button type="text" @click="dialogFullscreen = !dialogFullscreen">
          <i class="el-icon-full-screen" v-if="!dialogFullscreen"></i>
          <i class="el-icon-switch-button" v-else></i>
          <span v-if="!dialogFullscreen">全屏</span>
          <span v-else>退出全屏</span>
        </el-button>
      </div>
      <div class="text-center m-t-5" v-if="!disabled && editable">
        <el-button
          type="primary"
          plain
          @click="
            $emit('change', innerHtml, row, column);
            dialogVisible = false;
          "
          >确认</el-button
        >
        <el-button
          type="primary"
          :disabled="!hasChange"
          @click="
            $emit('save', innerHtml, row, column, 'save');
            stopAutoSave()
          "
        >
          保存
          <span v-if="autoSaveTimeout && autoSaveTimeout > 0"
            class="text-xs"
            title="自动保存倒计时"
            >
            {{ autoSaveTimeout }}
          </span>
        </el-button>
      </div>
    </div>

    <el-image
      style="width: 0; height: 0; overflow: hidden"
      :src="url"
      :preview-src-list="srcList"
      :initial-index="initialIndex"
      id="imgPreview"
    >
    </el-image>
  </el-dialog>
</template>

<script>
import RichTextEditor from "./rich-text.vue";
export default {
  name: "FieldEditorDialog",
  components: {
    RichTextEditor,
  },
  props: {
    value: {
      // v-model绑定
      type: Boolean,
      default: false,
    },
    html: [String, Number],
    oldValue: [String, Number],
    editable: Boolean,
    disabled: Boolean,
    row: Object,
    column: Object,
    listType: String,
    app: String,
    serviceName: String,
    detailButton: Object,
    keyDispCol: String,
  },
  data() {
    return {
      url: "",
      srcList: [],
      initialIndex: 0,
      dialogTableVisible: false,
      ticket: null,
      toolbarConfig: {},
      editor: null,
      mode: "default", // or 'simple'
      innerHtml: "",
      unfold: false, //默认收起
      loadingFold: false,
      dialogFullscreen: false,
      dialogVisible: this.value, // 控制对话框显示
      autoSaveInterval: null, //用于储存定时保存的定时器
      autoSaveTimeout: 0, //自动保存倒计时
    };
  },
  computed: {
    hasChange() {
      return this.innerHtml !== this.html;
    },
    setStyle() {
      let str = "";
      if (this.row?.__indent && this.column.isFirstCol) {
        str += `--row_indent:${this.row?.__indent}px;`;
      }
      return str;
    },
    editorType() {
      if (
        ["Note", "RichText", "snote"].includes(
          this.column?.__field_info?.col_type
        )
      ) {
        return "RichText";
      }
    },
  },
  watch: {
    html: {
      immediate: true,
      handler(newVal = "") {
        if (this.innerHtml !== newVal) {
          this.innerHtml = newVal;
        }
      },
    },
    value(newVal) {
      // 监听外部值变化
      this.dialogVisible = newVal;
      this.stopAutoSave();
    },
    dialogVisible(newVal) {
      // 触发v-model更新
      this.$emit("input", newVal);
      if (newVal) {
        window.addEventListener("dblclick", this.dblListener);
      } else {
        window.removeEventListener("dblclick", this.dblListener);
        this.srcList = [];
        this.url = "";
        this.initialIndex = 0;
      }
    },
    innerHtml(newVal) {
      if (newVal !== this.html) {
        this.autoSave();
      }
    },
  },
  methods: {
    stopAutoSave() {
      if (this.autoSaveInterval) {
        clearInterval(this.autoSaveInterval);
      }
      this.autoSaveInterval = null
      this.autoSaveTimeout = 0
    },
    autoSave() {
      this.stopAutoSave();
      if (this.innerHtml === this.html) {
        console.log("没有需要保存的内容");
        return;
      }
      this.autoSaveTimeout = 60;
      this.autoSaveInterval = setInterval(() => {
        this.autoSaveTimeout--;
        console.log(`自动保存倒计时：${this.autoSaveTimeout}`);
        if (this.autoSaveTimeout <= 0) {
          this.autoSaveTimeout = 0;
          clearInterval(this.autoSaveInterval);
          console.log("即将进行自动保存");
          // this.saveData({ isAutoSave: true });
          this.$emit("save", this.innerHtml, this.row, this.column, "save");
        }
      }, 1000);
    },
    handleOpen(params = {}) {},
    handleClose() {
      // 对话框关闭处理
      this.dialogVisible = false;
      this.$emit("close");
    },
    dblListener(eve) {
      console.log(eve);
      if (
        eve.target?.offsetParent?.className.indexOf("w-e-image-container") >
          -1 &&
        eve.target.currentSrc
      ) {
        this.url = eve.target.currentSrc;
        const arr = [];
        let imgIndex = 0;
        document
          .querySelectorAll(".w-e-image-container")
          .forEach((item, index) => {
            item.children.forEach((iItem) => {
              if (iItem.tagName === "IMG" && iItem.src) {
                arr.push(iItem.src);
                if (iItem.src === eve.target.currentSrc) {
                  imgIndex = index;
                }
              }
            });
          });
        this.srcList = arr;
        // 图片预览初始图片index
        this.initialIndex = imgIndex;
        setTimeout(() => {
          document.getElementById("imgPreview")?.click();
        }, 200);
        eve.stopPropagation();
        eve.preventDefault();
      }
    },
  },
  beforeDestroy() {
    this.stopAutoSave();
  },
};
</script>

<style lang="scss" scoped>
.top-tip {
  margin-top: -40px;
}
</style>
