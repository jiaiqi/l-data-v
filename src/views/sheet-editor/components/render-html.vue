<template>
  <div
    class="render-html"
    :class="{ 'is-rich-text': useEditor }"
    :style="setStyle"
    v-loading="loadingFold"
    @dblclick="showRichEditor"
  >
    <div class="flex">
      <div
        class="prefix-icon"
        v-if="showUnfold && column.isFirstCol"
        @click="changeFold"
      >
        <div class="fold-icon el-icon-minus" v-if="unfold === true"></div>
        <div class="unfold-icon el-icon-plus" v-else></div>
      </div>
      <div
        class="prefix-icon cursor-initial"
        v-else-if="column.isFirstCol"
      ></div>
      <div v-html="html" style="min-height: 50px"></div>
      <div class="old-value" v-if="!html&&oldValue" v-html="oldValue"></div>
    </div>
    <el-button
      size="mini"
      class="edit-btn"
      circle
      @click.stop="showRichEditor"
      v-if="useEditor"
      ><i class="el-icon-edit"></i
    ></el-button>
    <el-button
      size="mini"
      class="edit-btn"
      circle
      @click.stop="showTextarea"
      v-if="'MultilineText' === column.col_type"
      ><i class="el-icon-edit"></i
    ></el-button>

    <el-dialog
      :title="editable ? '编辑' : '详情'"
      :visible.sync="dialogTableVisible"
      :close-on-press-escape="false"
      :close-on-click-modal="false"
      :destroy-on-close="true"
      append-to-body
      width="80vw"
      custom-class="editor-dialog"
    >
      <Toolbar
        style="border-bottom: 1px solid #ccc"
        :editor="editor"
        :defaultConfig="toolbarConfig"
        :mode="mode"
        v-if="editable && useEditor"
      />
      <Editor
        v-if="useEditor"
        v-model="innerHtml"
        style="height: 500px; overflow-y: hidden; border-bottom: 1px solid #ccc"
        :defaultConfig="editorConfig"
        :disabled="!editable"
        :mode="mode"
        @click.stop
        @onCreated="onCreated"
        @customPaste="customPaste"
      />
      <el-input
        type="textarea"
        :rows="10"
        :disabled="!editable"
        placeholder="请输入内容"
        v-model="innerHtml"
        v-else
      >
      </el-input>
      <div class="text-orange text-center" v-if="!editable">
        当前字段不可编辑
      </div>
      <div class="text-center m-t-5" v-if="editable">
        <el-button
          type="primary"
          @click="
            $emit('change', innerHtml);
            dialogTableVisible = false;
          "
          >确认</el-button
        >
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { Editor, Toolbar } from "@wangeditor/editor-for-vue";
import "@wangeditor/editor/dist/css/style.css";

// 展示富文本 Note RichText类型
export default {
  components: { Editor, Toolbar },
  props: {
    html: [String, Number],
    oldValue: [String, Number],
    editable: Boolean,
    row: Object,
    column: Object,
    listType: String,
    app: String,
  },
  computed: {
    colType() {
      return this.column?.col_type;
    },
    setStyle() {
      let str = "";
      if (this.useEditor) {
        str += `min-height:40px;`;
      }
      if (this.row?.__indent && this.column.isFirstCol) {
        str += `--row_indent:${this.row?.__indent}px;`;
      }
      return str;
    },
    useEditor() {
      return ["Note", "RichText"].includes(this.column.col_type);
    },
    showUnfold() {
      // 显示展开收起图标
      return this.listType === "treelist" && this.row?.is_leaf === "否";
    },
  },
  data() {
    const uploadConfig = {
      server:
        window.backendIpAddr +
        "/file/upload?bx_auth_ticket=" +
        sessionStorage.bx_auth_ticket,
      // form-data fieldName ，默认值 'wangeditor-uploaded-image'
      fieldName: "file",
      // 单个文件的最大体积限制，默认为 2M
      maxFileSize: 10 * 1024 * 1024, // 10M
      // 最多可上传几个文件，默认为 100
      maxNumberOfFiles: 1,
      // 选择文件时的类型限制，默认为 ['image/*'] 。如不想限制，则设置为 []
      // allowedFileTypes: ["image/*"],
      // 自定义上传参数，例如传递验证的 token 等。参数会被添加到 formData 中，一起上传到服务端。
      meta: {
        serviceName: "srv_bxfile_service",
        interfaceName: "add",
        app_no:
          top?.pathConfig?.application ||
          sessionStorage.getItem("current_app") ||
          "oa",
      },
      // 自定义增加 http  header
      headers: {
        bx_auth_ticket: sessionStorage.getItem("bx_auth_ticket"),
      },
      // 跨域是否传递 cookie ，默认为 false
      withCredentials: true,
      // 超时时间，默认为 10 秒
      timeout: 100 * 1000, //100 秒
      customInsert(res, insertFn) {
        // JS 语法
        // res 即服务端的返回结果
        // 从 res 中找到 url alt href ，然后插入图片
        if (res.fileurl) {
          const url = `${window.backendIpAddr}/file/download?filePath=${res.fileurl}`;
          insertFn(url);
        }
      },
    };
    return {
      dialogTableVisible: false,
      editorConfig: {
        placeholder: "",
        readOnly: !this.editable,
        MENU_CONF: {
          uploadImage: uploadConfig,
          uploadVideo: uploadConfig,
        },
      },
      toolbarConfig: {},
      editor: null,

      mode: "default", // or 'simple'
      innerHtml: "",
      unfold: false, //默认收起
      loadingFold: false,
    };
  },
  methods: {
    changeFold() {
      this.loadingFold = true;
      this.$emit("unfold", !this.unfold, (res) => {
        this.loadingFold = false;
        this.unfold = !this.unfold;
      });
    },
    showTextarea() {
      this.dialogTableVisible = true;
      this.innerHtml = this.html;
      this.$emit("onfocus");
    },
    showRichEditor(event) {
      if (this.useEditor) {
        this.dialogTableVisible = true;
        this.innerHtml = this.html;
        this.editor?.focus();
        this.$emit("onfocus");
        // 阻止冒泡 拦截表格组件的双击事件
        event.stopPropagation();
      }
    },
    customPaste(editor, event) {
      // event 是 ClipboardEvent 类型，可以拿到粘贴的数据
      // 可参考 https://developer.mozilla.org/zh-CN/docs/Web/API/ClipboardEvent
      // const html = event.clipboardData.getData('text/html') // 获取粘贴的 html
      // event.preventDefault();
      let text = event.clipboardData.getData("text/plain"); // 获取粘贴的纯文本
      // editor.dangerouslyInsertHtml(text);
      // return false
      // if (/<[^>]+>/.test(text)) {
      //   // 包含html标签
      //   // editor.insertText(text);
      //   text = `<p><br></p>${text}<p><br></p>`;
      //   console.log(editor.getHtml());
      //   editor.dangerouslyInsertHtml(text);
      //   console.log(editor.getHtml());
      //   event.preventDefault();
      //   // 阻止默认的粘贴行为
      //   return false;
      // } else {
      //   // 继续执行默认的粘贴行为
      //   return true;
      // }
    },
    onCreated(editor) {
      this.editor = Object.seal(editor); // 一定要用 Object.seal() ，否则会报错
    },
  },
};
</script>

<style lang="scss" scoped>
.prefix-icon {
  width: 20px;
  cursor: pointer;
  &.cursor-initial {
    cursor: initial;
  }
}
.render-html {
  margin-left: var(--row_indent);
  // min-height: 40px;
  text-align: left;
  --w-e-textarea-bg-color: transparent;
  max-height: 200px;
  position: relative;
  .old-value{
    text-decoration: line-through;
    color: #f00;
  }
  // overflow-y: auto;
  .is-rich-text {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 10;
    -webkit-box-orient: vertical;
  }
  .detail-btn {
    position: absolute;
    top: 0;
    right: 20px;
    display: none;
    z-index: 9999;
  }
  &:hover {
    .detail-btn {
      display: block;
    }
  }
  &:hover {
    .edit-btn {
      display: block;
    }
  }
}
.edit-btn {
  position: absolute;
  top: 0;
  right: 20px;
  display: none;
  z-index: 9999;
}
.editor-dialog {
  z-index: 999;
}
</style>
