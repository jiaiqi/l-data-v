<template>
  <!-- <div style="border: 1px solid #ccc">
    <Toolbar
      style="border-bottom: 1px solid #ccc"
      :editor="editor"
      :defaultConfig="toolbarConfig"
      :mode="mode"
    />
    <Editor
      style="height: 500px; overflow-y: hidden"
      v-model="html"
      :defaultConfig="editorConfig"
      :mode="mode"
      @onCreated="onCreated"
      @customPaste="customPaste"
    />
  </div> -->
</template>

<script>
import Vue from "vue";
// import { Editor, Toolbar } from "@wangeditor/editor-for-vue";
// import "@wangeditor/editor/dist/css/style.css";

export default Vue.extend({
  // components: { Editor, Toolbar },
  data() {
    return {
      editor: null,
      html: "<p>hello</p>",
      toolbarConfig: {},
      editorConfig: {
        placeholder: "请输入内容...",
      },
      mode: "default", // or 'simple'
    };
  },
  methods: {
    customPaste(editor, event) {
      // event 是 ClipboardEvent 类型，可以拿到粘贴的数据
      // 可参考 https://developer.mozilla.org/zh-CN/docs/Web/API/ClipboardEvent

      // const html = event.clipboardData.getData('text/html') // 获取粘贴的 html
      const text = event.clipboardData.getData("text/plain"); // 获取粘贴的纯文本
      if (/<[^>]+>/.test(str)) {
        // 包含html标签
        editor.dangerouslyInsertHtml(text);
        event.preventDefault();
        return false;
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
  mounted() {
    // 模拟 ajax 请求，异步渲染编辑器
    setTimeout(() => {
      this.html = "<p>模拟 Ajax 异步设置内容 HTML</p>";
    }, 1500);
  },
  beforeDestroy() {
    const editor = this.editor;
    if (editor == null) return;
    editor.destroy(); // 组件销毁时，及时销毁编辑器
  },
});
</script>

<style lang="scss" scoped></style>
