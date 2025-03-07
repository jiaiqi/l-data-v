<template>
  <div
    class="date-picker"
    :style="setPosition"
    v-if="['Date', 'DateTime'].includes(editorType)"
  >
    <el-date-picker
      v-model="modelValue"
      align="right"
      :type="editorType.toLowerCase()"
      placeholder="选择日期"
      :value-format="dateFormat"
      @change="$emit('change', modelValue, row, column)"
      @blur="handleClose"
    >
    </el-date-picker>
  </div>

  <el-dialog
    :visible="editorVisible"
    @close="handleClose"
    :before-close="handleClose"
    :close-on-click-modal="false"
    width="90vw"
    v-else
  >
    <div :style="setStyle">
      <rich-text-editor
        v-if="editorType === 'RichText'"
        v-model="modelValue"
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
            $emit('change', modelValue, row, column);
            editorVisible = false;
          "
          >确认</el-button
        >
        <el-button
          type="primary"
          :disabled="!hasChange"
          @click="
            $emit('save', modelValue, row, column, 'save');
            stopAutoSave();
          "
        >
          保存
          <span
            v-if="autoSaveTimeout && autoSaveTimeout > 0"
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
    position: Object,
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
      modelValue: "",
      unfold: false, //默认收起
      loadingFold: false,
      dialogFullscreen: false,
      editorVisible: this.value, // 控制对话框显示
      autoSaveInterval: null, //用于储存定时保存的定时器
      autoSaveTimeout: 0, //自动保存倒计时
    };
  },
  computed: {
    setPosition() {
      if (this.position && this.position.width && this.value) {
        return {
          left: this.position.left+1 + "px",
          top: this.position.top+1 + "px",
          width: this.position.width -4 + "px",
          height: this.position.height - 4+ "px",
        };
      } else {
        return {
          display: "none",
        };
      }
    },
    hasChange() {
      return this.modelValue !== this.html;
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
      } else return this.column?.__field_info?.col_type;
    },
    dateFormat() {
      if (this.editorType === "Date") {
        return "yyyy-MM-dd";
      } else if (this.editorType === "DateTime") {
        return "yyyy-MM-dd HH:mm:ss";
      }
    },
  },
  watch: {
    html: {
      immediate: true,
      handler(newVal = "") {
        if (this.modelValue !== newVal) {
          this.modelValue = newVal;
        }
      },
    },
    value(newVal) {
      // 监听外部值变化
      this.editorVisible = newVal;
      this.stopAutoSave();
    },
    editorVisible(newVal) {
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
    modelValue(newVal) {
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
      this.autoSaveInterval = null;
      this.autoSaveTimeout = 0;
    },
    autoSave() {
      this.stopAutoSave();
      if (this.modelValue === this.html) {
        console.log("没有需要保存的内容");
        return;
      }
      this.autoSaveTimeout = 60 * 3;
      this.autoSaveInterval = setInterval(() => {
        this.autoSaveTimeout--;
        console.log(`自动保存倒计时：${this.autoSaveTimeout}`);
        if (this.autoSaveTimeout <= 0) {
          this.autoSaveTimeout = 0;
          clearInterval(this.autoSaveInterval);
          console.log("即将进行自动保存");
          // this.saveData({ isAutoSave: true });
          this.$emit("save", this.modelValue, this.row, this.column, "save");
        }
      }, 1000);
    },
    handleOpen(params = {}) {},
    handleClose() {
      // 对话框关闭处理
      this.editorVisible = false;
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
.date-picker {
  z-index: 9;
  position: fixed;
  // border: 1px solid #4B89FF;
  overflow: hidden;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  ::v-deep .el-date-editor{
    background: transparent;
    .el-input__inner{
    background: transparent;
      border: none;
    }
  }
}
.top-tip {
  margin-top: -40px;
}
</style>
