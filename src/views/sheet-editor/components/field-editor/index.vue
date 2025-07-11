<template>
  <div
    class="editor-wrap"
    :class="{ focus: onfocus === true }"
    :style="setPosition"
    @click.stop=""
    v-if="
      setPosition && !['RichText', 'MultilineText'].includes(editorType) && show
    "
  >
    <el-date-picker
      v-model="modelValue"
      align="right"
      :type="editorType.toLowerCase()"
      placeholder="选择日期"
      :value-format="dateFormat"
      :clearable="false"
      @change="$emit('change', modelValue, row, column)"
      @blur="handleClose"
      v-if="['Date', 'DateTime'].includes(editorType)"
    >
    </el-date-picker>
    <finder
      class="finder"
      ref="finder"
      :row="row"
      :column="fieldInfo"
      :app="app"
      :operate-type="operateType"
      :field-info="fieldInfo"
      :detailButton="detailButton"
      v-model="modelValue"
      @change="onFinderChange"
      @focus="onfocus = true"
      @blur="onfocus = false"
      v-else-if="
        ['autocomplete', 'fk', 'fks', 'fkjsons', 'fkjson'].includes(editorType)
      "
    >
    </finder>
  </div>

  <el-dialog
    :visible="editorVisible"
    @close="handleClose"
    :before-close="handleClose"
    :close-on-click-modal="false"
    width="90vw"
    v-else-if="
      editorVisible && ['MultilineText', 'RichText'].includes(editorType)
    "
  >
    <div class="remark" v-if="fieldInfo && fieldInfo.remark">
      <el-popover placement="right bottom" width="800" v-model="visible">
        <div class="p-2 m-2 b-gray b-1px b-dashed rounded-sm">
          <div v-html="recoverFileAddress(fieldInfo.remark)"></div>
        </div>
        <div slot="reference" class="text-orange cursor-pointer inline-block">
          <i class="el-icon-warning"></i> 提示
        </div>
      </el-popover>
    </div>
    <div :style="setStyle">
      <rich-text-editor
        v-if="editorType === 'RichText'"
        v-model="modelValue"
        :mode="mode"
        :editable="editable"
        :dialogFullscreen="dialogFullscreen"
      ></rich-text-editor>
      <el-input
        type="textarea"
        :rows="10"
        :disabled="!editable"
        :placeholder="
          (column && column.__field_info && column.__field_info.placeholder) ||
          '请输入内容'
        "
        v-model="modelValue"
        v-else-if="editorType === 'MultilineText'"
      >
      </el-input>
      <div class="text-orange text-center" v-if="!disabled && !editable">
        <span class="mr-20px"> 当前字段不可编辑 </span>
        <el-button type="text" @click="dialogFullscreen = !dialogFullscreen">
          <i class="el-icon-full-screen" v-if="!dialogFullscreen"></i>
          <i class="el-icon-switch-button" v-else></i>
          <span v-if="!dialogFullscreen">全屏</span>
          <span v-else>退出全屏</span>
        </el-button>
      </div>
      <div
        class="text-center m-t-5 flex justify-between"
        v-if="!disabled && editable"
      >
        <div></div>
        <div class="flex-1 text-center">
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
            仅保存
            <span
              v-if="autoSaveTimeout && autoSaveTimeout > 0"
              class="text-xs"
              title="自动保存倒计时"
            >
              {{ autoSaveTimeout }}
            </span>
          </el-button>
        </div>
        <div></div>
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
import {
  isRichText,
  isFk,
  isFkAutoComplete,
  getFieldType,
} from "@/utils/sheetUtils.js";
import Finder from "./finder.vue";
import RichTextEditor from "./rich-text.vue";
export default {
  name: "FieldEditor",
  components: {
    RichTextEditor,
    Finder,
  },
  props: {
    value: {
      // v-model绑定 控制显示隐藏
      type: [String, Number],
      default: "",
    },
    show: {
      type: Boolean,
      default: false,
    },
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
      ticket: null,
      editor: null,
      mode: "default", // or 'simple'
      modelValue: "",
      unfold: false, //默认收起
      loadingFold: false,
      dialogFullscreen: false,
      editorVisible: this.show, // 控制对话框显示
      autoSaveInterval: null, //用于储存定时保存的定时器
      autoSaveTimeout: 0, //自动保存倒计时
      visible: false,
      onfocus: false,
    };
  },
  computed: {
    editorType() {
      if (this.show) {
        if (isRichText(this.fieldInfo)) {
          return "RichText";
        }
        if (isFkAutoComplete(this.fieldInfo)) {
          return "autocomplete";
        } else if (isFk(this.fieldInfo)) {
          return "fk";
        }
        return getFieldType(this.fieldInfo);
      }
    },
    fieldInfo() {
      return this.column?.__field_info;
    },
    operateType() {
      return this.row?.__flag || "update";
    },
    setPosition() {
      if (this.position && this.position.width && this.show) {
        let left = this.onfocus ? this.position.left : this.position.left + 3;
        let top = this.onfocus ? this.position.top : this.position.top + 3;
        let width = this.onfocus
          ? this.position.width
          : this.position.width - 8;
        let height = this.onfocus
          ? this.position.height
          : this.position.height - 8;
        const pos = {
          left: left + "px",
          top: top + "px",
          width: width + "px",
          height: height + "px",
        };
        return `left:${left}px;top:${top}px;width:${width}px;height:${height}px;`;
      } else {
        return "";
      }
    },
    hasChange() {
      return this.modelValue !== this.value;
    },
    setStyle() {
      let str = "";
      if (this.row?.__indent && this.column.isFirstCol) {
        str += `--row_indent:${this.row?.__indent}px;`;
      }
      return str;
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
    value: {
      immediate: true,
      handler(newVal = "") {
        if (this.modelValue !== newVal) {
          this.modelValue = newVal;
        }
      },
    },
    show: {
      immediate: true,
      handler(newVal) {
        // 监听外部值变化
        if (this.editorVisible !== newVal) {
          this.editorVisible = newVal;
          this.stopAutoSave();
        }
      },
    },
    editorVisible(newVal) {
      console.log("editorVisible:", newVal);
      if (newVal !== this.show) {
        this.$emit("update:show", newVal);
      }
      if (newVal) {
        window.addEventListener("dblclick", this.dblListener);
      } else {
        window.removeEventListener("dblclick", this.dblListener);
        this.srcList = [];
        this.url = "";
        this.initialIndex = 0;
        this.modelValue = "";
      }
    },
    modelValue(newVal) {
      if (newVal !== this.value) {
        this.autoSave();
      }
    },
    // column:{
    //   immediate: true,
    //   deep:true,
    //   handler(newVal) {

    //   },
    // }
  },
  methods: {
    triggerAutocomplete(val) {
      this.$refs.finder?.triggerAutocomplete?.(val);
    },
    onFinderChange(item = null) {
      if (isFk(this.fieldInfo)) {
        this.modelValue = item?.value || null;
        this.$emit("fk-change", item, this.row, this.column);
        return;
      }
      if (item && item?.option) {
        this.modelValue = item?.label || null;
      }
      if (isFkAutoComplete(this.fieldInfo)) {
        this.modelValue = item?.value || null;
        this.$emit("fk-autocomplete-change", item, this.row, this.column);
      }
      const colType = this.fieldInfo.col_type;
      if (["fks", "fkjson", "fkjsons"].includes(colType)) {
        this.$emit("fks-change", item, this.row, this.column);
      }
    },
    onKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        // 监听ctrl+s
        e.preventDefault();
        if (this.editorVisible && this.editable && this.hasChange) {
          this.$emit("save", this.modelValue, this.row, this.column, "save");
          this.stopAutoSave();
        }
      }
    },
    stopAutoSave() {
      if (this.autoSaveInterval) {
        clearInterval(this.autoSaveInterval);
      }
      this.autoSaveInterval = null;
      this.autoSaveTimeout = 0;
    },
    autoSave() {
      this.stopAutoSave();
      if (this.modelValue === this.value) {
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
  mounted() {
    document.addEventListener("keydown", this.onKeyDown);
    // this.$parent.$refs.tableRef.$el.querySelector('.ve-table-content-wrapper').appendChild(this.$el)
    // if (!['Date', 'DateTime', 'autocomplete', "fk", 'fks', 'fkjson', 'fkjsons'].includes(this.editorType)) {
    //   this.$parent.clearCellSelection()
    // }
  },
  beforeDestroy() {
    document.removeEventListener("keydown", this.onKeyDown);
    this.stopAutoSave();
    this.modelValue = "";
  },
};
</script>

<style lang="scss" scoped>
.editor-wrap {
  position: absolute;
  // overflow: hidden;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;

  ::v-deep .el-input {
    display: flex;
    align-items: center;
    height: 100%;

    .el-input__inner,
    .el-input__icon {
      display: flex;
      align-items: center;
      height: 100%;
    }

    .el-input__prefix {
      display: flex;
      align-items: center;
      left: 0;
    }

    .el-input__suffix {
      display: flex;
      align-items: center;
      right: 0;
    }
  }

  &.focus {
    border: 2px solid #4b89ff;
  }

  .finder {
    width: 100%;
  }

  ::v-deep .el-date-editor {
    height: 100%;
    line-height: 100%;
    background: transparent;

    .el-input__inner {
      height: 100%;
      line-height: 100%;
      background: transparent;
      padding-right: 0;
      padding-left: 20px;
      border: none;
    }
  }
}

// .fk-autocomplete {
//   z-index: 9;
//   position: fixed;
//   overflow: hidden;
// }

.remark {
  margin-top: -50px;
  line-height: 40px;
}
</style>
