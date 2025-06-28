<template>
  <div class="rich-editor" ref="rich-editor">
    <Toolbar
      style="border-bottom: 1px solid #ccc"
      :editor="editor"
      :defaultConfig="toolbarConfig"
      :mode="mode"
      v-if="editable"
    />
    <div
      v-if="!editable"
      v-html="recoverFileAddress(innerHtml)"
      class="w-full overflow-auto select-text"
      :style="{
        height: dialogFullscreen
          ? 'calc(100vh - 155px)'
          : 'calc(100vh - 30vh - 200px)',
      }"
    ></div>
    <Editor
      v-else
      v-model="innerHtml"
      :class="{ 'is-rich-text': true }"
      :style="{
        height: dialogFullscreen
          ? 'calc(100vh - 155px)'
          : 'calc(100vh - 30vh - 200px)',
      }"
      style="overflow-y: hidden; border-bottom: 1px solid #ccc"
      :defaultConfig="editorConfig"
      :disabled="!editable"
      :mode="mode"
      @click.stop
      @onCreated="onCreated"
      @customPaste="customPaste"
      :key="ticket + 2"
    />
    <el-image
      style="width: 0; height: 0; display: none; overflow: hidden"
      :src="previewImage"
      :preview-src-list="[previewImage]"
      ref="imagePreview"
      v-if="previewImage"
    >
    </el-image>
  </div>
</template>

<script>
import { Editor, Toolbar } from "@wangeditor/editor-for-vue";
import "@wangeditor/editor/dist/css/style.css";
export default {
  name: "FieldEditorRichText",
  components: { Editor, Toolbar },
  props: {
    value: {
      // 新增value prop
      type: String,
      default: "",
    },
    dialogFullscreen: {
      type: Boolean,
      default: false,
    },
    editable: {
      type: Boolean,
      default: true,
    },
    mode: {
      type: String,
      default: "default", // or 'simple'
    },
  },
  data() {
    return {
      innerHtml: this.recoverFileAddress(this.value), // 初始化来自prop的值
      toolbarConfig: {},
      editor: null,
      ticket: null,
      previewImage: null,
    };
  },
  computed: {
    editorConfig() {
      return {
        placeholder: "",
        readOnly: !this.editable,
        MENU_CONF: {
          uploadImage: this.uploadConfig,
          uploadVideo: this.uploadConfig,
        },
      };
    },
    uploadConfig() {
      const self = this;
      return {
        server:
          window.backendIpAddr + "/file/upload?bx_auth_ticket=" + this.ticket,
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
          bx_auth_ticket: this.ticket,
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
          } else {
            if (res?.resultCode === "0011") {
              //登录超时
              self.$message.error(res.resultMessage);
              self.$emit("needLogin", () => {
                self.ticket = sessionStorage.getItem("bx_auth_ticket");
              });
            }
          }
        },
      };
    },
  },
  watch: {
    value(newVal) {
      // 监听外部值变化
      if (newVal !== this.innerHtml) {
        this.innerHtml = this.recoverFileAddress(newVal);
      }
    },
    innerHtml(newVal) {
      // 监听内部值变化
      if (newVal === "<p><br></p>" && !this.value) return;
      this.$emit("input", newVal);
    },
  },
  methods: {
    onDblClick(event) {
      console.log(event, "onDblClick");
      if (event.target.nodeName === "IMG") {
        this.previewImage =
          event.target.currentSrc || event.target.href || null;
      } else {
        this.previewImage = null;
      }
      if (this.previewImage) {
        this.$nextTick(() => {
          this.$refs["imagePreview"].showViewer = true;
        });
      }
    },
    customPaste(editor, event) {
      // event 是 ClipboardEvent 类型，可以拿到粘贴的数据
      // 可参考 https://developer.mozilla.org/zh-CN/docs/Web/API/ClipboardEvent
      // const html = event.clipboardData.getData('text/html') // 获取粘贴的 html
      // event.preventDefault();
      let text = event.clipboardData.getData("text/plain"); // 获取粘贴的纯文本
      return true;
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
      this.$parent.$parent?.$parent?.$parent?.clearCellSelection();
      this.$refs?.["rich-editor"]
        ?.querySelector(".w-e-text-container")
        ?.addEventListener("dblclick", this.onDblClick);
    },
  },
  created() {
    this.ticket = sessionStorage.getItem("bx_auth_ticket");
    // this.$nextTick(() => {
    // this.$parent.$parent.$parent.$parent.clearCellSelection()
    // this.$parent.$parent.$parent.$refs.tableRef.clearCellSelectionCurrentCell()
    // });
  },
};
</script>

<style lang="scss" scoped>
.is-rich-text {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 10;
  -webkit-box-orient: vertical;
}
</style>
