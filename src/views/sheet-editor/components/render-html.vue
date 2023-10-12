<template>
  <!-- <div v-html="html" class="render-html">
  
  </div> -->
  <div class="render-html">
    <!-- <Editor
      :value="html"
      style="height: 100%"
      :defaultConfig="editorConfig"
      :mode="mode"
    /> -->
    <div v-html="html"></div>
    <el-button
      size="mini"
      class="edit-btn"
      circle
      @click.stop.capture.prevent="showDialog"
      ><i class="el-icon-edit"></i
    ></el-button>

    <el-dialog
      :title="editable?'编辑':'详情'"
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
        v-if="editable"
      />
      <Editor
        v-model="innerHtml"
        style="height: 500px; overflow-y: hidden; border-bottom: 1px solid #ccc"
        :defaultConfig="editorConfig"
        :mode="mode"
        @click.stop
        @onCreated="onCreated"
        @customPaste="customPaste"
      />
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
    editable: Boolean,
    row: Object,
    column: Object,
  },
  computed: {
    // innerHtml: {
    //   get() {
    //     return this.html;
    //   },
    //   set(newValue) {
    //     this.$emit("input", newValue);
    //   },
    // },
  },
  data() {
    return {
      dialogTableVisible: false,
      editorConfig: {
        placeholder: "",
        readOnly: !this.editable,
        MENU_CONF: {
          uploadImage: {
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
            allowedFileTypes: ["image/*"],

            // 自定义上传参数，例如传递验证的 token 等。参数会被添加到 formData 中，一起上传到服务端。
            meta: {
              serviceName: "srv_bxfile_service",
              interfaceName: "add",
              app_no: "oa",
              // bx_auth_ticket:sessionStorage.getItem("bx_auth_ticket"),
              // token: "xxx",
              // otherKey: "yyy",
            },

            // 将 meta 拼接到 url 参数中，默认 false
            metaWithUrl: false,

            // 自定义增加 http  header
            headers: {
              bx_auth_ticket: sessionStorage.getItem("bx_auth_ticket"),
              // Accept: "text/x-json",
              // otherKey: "xxx",
            },
            // 跨域是否传递 cookie ，默认为 false
            withCredentials: true,
            // 超时时间，默认为 10 秒
            timeout: 100 * 1000, //100 秒
            onSuccess(file, res) {
              // TS 语法
              // onSuccess(file, res) {          // JS 语法
              console.log(`${file.name} 上传成功`, res);
            },
            // async customUpload(file, insertFn) {
            //   // file 即选中的文件
            //   // 自己实现上传，并得到图片 url alt href
            //   // 最后插入图片
            //   insertFn(url, alt, href);
            // },
            customInsert(res, insertFn) {
              // JS 语法
              // res 即服务端的返回结果
              // 从 res 中找到 url alt href ，然后插入图片
              if (res.fileurl) {
               const url = `${window.backendIpAddr}/file/download?filePath=${res.fileurl}`;
                insertFn(url,res.src_name);
              }
            },
          },
        },
      },
      toolbarConfig: {},
      editor: null,

      mode: "default", // or 'simple'
      innerHtml: "",
    };
  },
  methods: {
    showDialog() {
      console.log("showDialog", this.dialogTableVisible);
      this.dialogTableVisible = true;
      this.innerHtml = this.html;
    },
    customPaste(editor, event) {
      // event 是 ClipboardEvent 类型，可以拿到粘贴的数据
      // 可参考 https://developer.mozilla.org/zh-CN/docs/Web/API/ClipboardEvent
      // const html = event.clipboardData.getData('text/html') // 获取粘贴的 html
      const text = event.clipboardData.getData("text/plain"); // 获取粘贴的纯文本
      if (/<[^>]+>/.test(text)) {
        // 包含html标签
        // editor.setHtml(text);
        editor.dangerouslyInsertHtml(text);
        event.preventDefault();
        return false;
      } else {
        return true;
      }
      // const rtf = event.clipboardData.getData('text/rtf') // 获取 rtf 数据（如从 word wsp 复制粘贴）
      // const html = event.clipboardData.getData("text/html");

      // 同步
      // editor.insertText("xxx");

      // // 异步
      // setTimeout(() => {
      //   editor.insertText("yy");
      // }, 1000);

      // 阻止默认的粘贴行为

      // 继续执行默认的粘贴行为
      // return true
    },
    onCreated(editor) {
      this.editor = Object.seal(editor); // 一定要用 Object.seal() ，否则会报错
    },
  },
};
</script>

<style lang="scss" scoped>
.render-html {
  min-height: 50px;
  text-align: left;
  --w-e-textarea-bg-color: transparent;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 10;
  -webkit-box-orient: vertical;
  max-height: 200px;
  position: relative;
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
