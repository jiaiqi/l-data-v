<template>
  <div
    class="render-html"
    :class="{
      'is-rich-text': useEditor,
      'link-to-detail': linkToDetail,
      'disabled-wrap': allowWrap !== true,
    }"
    :style="setStyle"
    :title="getTextFromHtml(html)"
    v-loading="loadingFold"
    @dblclick="showRichEditor"
  >
    <div class="flex w-full">
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
      <div v-if="isFks && selected">
        <el-tag
          style="margin-right: 4px; margin-bottom: 2px"
          size="mini"
          :type="['', 'success', 'warning', 'danger'][tIndex % 4]"
          v-for="(tag, tIndex) in getFkJson"
          :key="tIndex"
          >{{ tag || "" }}
        </el-tag>
      </div>
      <div
        class="text"
        v-html="recoverFileAddress(html)"
        style=""
        v-else-if="useEditor && html"
      ></div>
      <a
        class="text"
        v-else-if="keyDispCol && column.columns === keyDispCol"
        :title="linkToDetail ? '点击查看详情' : ''"
        @click="toDetail"
        >{{ html }}</a
      >
      <span
        class="text"
        style=""
        v-else-if="![null, undefined, ''].includes(html)"
        :title="linkToDetail ? '点击查看详情' : ''"
        @click="toDetail"
      >
        {{ html }}
      </span>
      <div
        class="old-value"
        v-else-if="[null, undefined, ''].includes(html) && oldValue"
        v-html="recoverFileAddress(oldValue)"
      ></div>
    </div>
    <el-button
      size="mini"
      class="edit-btn"
      circle
      @click.stop="showRichEditor"
      v-if="useEditor && !disabled"
      ><i class="el-icon-edit"></i
    ></el-button>
    <el-button
      size="mini"
      class="edit-btn"
      circle
      @click.stop="showTextarea"
      v-if="'MultilineText' === column.col_type && !disabled"
      ><i class="el-icon-edit"></i
    ></el-button>

    <el-dialog
      :fullscreen="dialogFullscreen"
      :title="editable ? '编辑' : '详情'"
      :visible.sync="dialogTableVisible"
      :close-on-press-escape="false"
      :close-on-click-modal="false"
      :destroy-on-close="true"
      append-to-body
      width="80vw"
      custom-class="editor-dialog"
      :key="ticket"
    >
      <!-- <Toolbar
        style="border-bottom: 1px solid #ccc"
        :editor="editor"
        :defaultConfig="toolbarConfig"
        :mode="mode"
        v-if="editable && useEditor && dialogTableVisible"
        :key="ticket + 1"
      /> -->
      <div
        v-if="useEditor && dialogTableVisible && !editable"
        v-html="recoverFileAddress(innerHtml)"
        class="w-full overflow-auto"
        :style="{ height: dialogFullscreen ? 'calc(100vh - 155px)' : '300px' }"
      ></div>
      <!-- <Editor
        v-else-if="useEditor && dialogTableVisible"
        v-model="innerHtml"
        :class="{ 'is-rich-text': true }"
        :style="{ height: dialogFullscreen ? 'calc(100vh - 155px)' : '300px' }"
        style="overflow-y: hidden; border-bottom: 1px solid #ccc"
        :defaultConfig="editorConfig"
        :disabled="!editable"
        :mode="mode"
        @click.stop
        @onCreated="onCreated"
        @customPaste="customPaste"
        :key="ticket + 2"
      /> -->
      <el-input
        type="textarea"
        :rows="10"
        :disabled="!editable"
        :placeholder="(column && column.placeholder) || '请输入内容'"
        v-model="innerHtml"
        v-else
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
      <div class="text-center m-t-5" v-if="!disabled && editable">
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
    <el-image
      style="width: 0; height: 0; overflow: hidden"
      :src="url"
      :preview-src-list="srcList"
      :initial-index="initialIndex"
      id="imgPreview"
    >
    </el-image>
  </div>
</template>

<script>
import { Editor, Toolbar } from "@wangeditor/editor-for-vue";
import "@wangeditor/editor/dist/css/style.css";
import cloneDeep from "lodash/cloneDeep";
import { isFk, isFkAutoComplete, getFieldType } from "@/utils/sheetUtils";
import { getTextFromHtml } from "../util/common";
// 展示富文本 Note RichText类型
export default {
  components: { Editor, Toolbar },
  props: {
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
    allowWrap: Boolean,
  },
  watch: {
    dialogTableVisible(newVal) {
      this.$emit("onpopup", newVal);
      if (newVal) {
        window.addEventListener("dblclick", this.dblListener);
      } else {
        window.removeEventListener("dblclick", this.dblListener);
        this.srcList = [];
        this.url = "";
        this.initialIndex = 0;
      }
    },
    row: {
      deep: true,
      immediate: true,
      handler(newVal) {
        this.unfold = newVal?.__unfold ? true : false;
        this.loadingFold = false;
      },
    },
    html: {
      immediate: true,
      handler(newVal, oldVal) {
        if (newVal !== oldVal) {
          // // 处理fk冗余
          // if (isFk(this.column)&&newVal) {
          //   this.getMatchedValue(newVal).then(res=>{
          //     if(res?.value){
          //       this.onFkSelect(res);
          //     }
          //   });
          // }
        }
        if (["fks", "fkjson", "fkjsons"].includes(this.colType)) {
          this.initSelected();
        }
      },
    },
  },
  created() {
    this.ticket = sessionStorage.getItem("bx_auth_ticket");
    if (this.row?.__flag === "add") {
      const redundant = this.column?.redundant;
      const dependField = redundant?.dependField;
      const refedCol = redundant?.refedCol;
      if (dependField && refedCol) {
        if (this.row[`_${dependField}_init_val`]) {
          this.getFkOptions(
            this.column.redundant_options,
            this.row[`_${dependField}_init_val`]
          );
        }
      }
    }
    this.$emit("created", this);
  },
  computed: {
    getFkJson() {
      let val = this.html;
      let result = [];

      let colType = this.colType;

      let fmt = this.column?.fmt;
      let valueCol = fmt && fmt.primary_col;
      let dispCol = fmt && fmt.disp_col;
      switch (colType) {
        case "fks":
          result = val ? val.split(",") : [];
          break;
        case "fkjson":
          try {
            result = val ? JSON.parse(val) : {};
          } catch (error) {
            console.log(error);
          }
          if (result && result[dispCol]) {
            result = [result[dispCol] || result[valueCol]];
          }
          break;
        case "fkjsons":
          try {
            result = val ? JSON.parse(val) : [];
          } catch (error) {}
          if (Array.isArray(result) && result.length > 0) {
            result = result.map((item) => item[dispCol] || item[valueCol]);
          }
          break;
      }
      return result;
    },
    isFks() {
      return ["fks", "fkjson", "fkjsons"].includes(this.colType);
    },
    linkToDetail() {
      return (
        this.$parent?.column?.linkToDetail === true &&
        this.row?.__flag !== "add" &&
        this.detailButton?.permission
      );
    },
    colType() {
      return this.column?.col_type;
    },
    setStyle() {
      let str = "";
      if (this.useEditor) {
        // str += `min-height:40px;`;
      }
      if (this.row?.__indent && this.column.isFirstCol) {
        str += `--row_indent:${this.row?.__indent}px;`;
      }
      return str;
    },
    useEditor() {
      return ["Note", "RichText", "snote"].includes(this.column.col_type);
    },
    showUnfold() {
      // 显示展开收起图标
      return this.listType === "treelist" && this.row?.is_leaf === "否";
    },
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
  data() {
    return {
      getTextFromHtml,
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
      selected: null,
    };
  },
  methods: {
    getEditorType() {
      if (isFkAutoComplete(this.column)) {
        return "autocomplete";
      } else if (isFk(this.column)) {
        return "fk";
      }
      return getFieldType(this.column);
    },
    getOptionListV3() {
      const operateType = this.row?.__flag || "update";
      const editorType = this.getEditorType();
      if (isFk(this.column)) {
        return this.column?.option_list_v3;
      } else if (editorType === "autocomplete") {
        return this.column?.[`_${operateType}_option_list`];
      }
    },
    getOptionListFinal() {
      let result = null;
      const option_list_v3 = this.getOptionListV3();
      if (Array.isArray(option_list_v3) && option_list_v3.length) {
        const data = this.row || {};
        result = option_list_v3.find(
          (item) =>
            !item.conds?.length ||
            item.conds?.every(
              (cond) =>
                data?.[cond.case_col] &&
                cond.case_val?.includes?.(data?.[cond.case_col])
            )
        );
      }
      return result;
    },
    getOptionReq(inputVal) {
      if (!isFk(this.column)) {
        return;
      }
      let optionsV2 = this.getOptionListFinal();
      if (!optionsV2?.refed_col) {
        return;
      }
      let refedCol = optionsV2?.refed_col || optionsV2?.key_disp_col;
      let req = {
        serviceName: optionsV2.serviceName,
        srvApp: optionsV2.srv_app || null,
        colNames: ["*"],
        condition: [],
        page: {
          pageNo: 1,
          rownumber: 50,
        },
        relation_condition: {},
      };
      if (optionsV2?.key_disp_col) {
        req.relation_condition = {
          relation: "OR",
          data: [
            {
              colName: optionsV2.key_disp_col,
              ruleType: "[like]",
              value: inputVal || "",
            },
            {
              colName: refedCol,
              ruleType: "[like]",
              value: inputVal || "",
            },
          ],
        };
      } else {
        req.condition.push({
          colName: refedCol,
          ruleType: "[like]",
          value: inputVal,
        });
      }
      const conditions = optionsV2?.conditions || optionsV2?.condition || [];
      if (conditions?.length) {
        const formModel = this.row;
        conditions.forEach((item) => {
          const obj = {
            colName: item.colName,
            ruleType: item.ruleType,
          };
          if (item.value?.indexOf("data.") === 0) {
            obj.value = formModel[item.value.replace("data.", "")];
          } else if (
            item.value &&
            item.value.startsWith("'") &&
            item.value.endsWith("'")
          ) {
            obj.value = item.value.replace(/'/g, "");
          } else {
            obj.ruleType = "like";
            obj.value = item.value;
          }
          if (obj.value) {
            req.condition.push(obj);
          }
        });
      }
      return req;
    },
    async getMatchedValue(queryString) {
      const optionListFinal = this.getOptionListFinal();
      let req = cloneDeep(this.getOptionReq());
      if (optionListFinal?.serviceName && req) {
        if (req["relation_condition"]) {
          req.relation_condition.data[0].value = queryString;
          req.relation_condition.data[1].value = queryString;
          req.relation_condition.data[0].ruleType = "eq";
          req.relation_condition.data[1].ruleType = "eq";
        } else if (req["condition"]) {
          req["condition"][0].ruleType = "eq";
          req["condition"][0].value = queryString;
        }
        const url = `/${this.app}/select/${req.serviceName}`;
        const response = await this.$http.post(url, req);
        if (response && response.data && response.data.data?.length) {
          const data = response.data.data[0];
          const valueCol = optionListFinal.refed_col;
          const labelCol = optionListFinal.key_disp_col;
          data.label = data[labelCol];
          data.value = data[valueCol];
          return data;
        }
      }
    },
    onFkSelect(selected = null) {
      this.selected = selected || null;
      this.$emit("change", {
        rawData: selected,
        value: selected?.value,
      });
    },
    initSelected() {
      let obj = {};
      if (["fkjson", "fkjsons"].includes(this.colType) && this.html) {
        try {
          obj = JSON.parse(this.html);
        } catch (error) {
          console.log(error);
        }
      }
      let fmt = this.column?.fmt;
      let valueCol = fmt && fmt.primary_col;
      if (this.html)
        switch (this.colType) {
          case "fkjson":
            if (obj && obj[valueCol]) {
              this.selected = obj[valueCol];
            }
            break;
          case "fkjsons":
            if (Array.isArray(obj)) {
              this.selected = obj
                .map((item) => item[valueCol])
                .filter((item) => item && item);
            }
            break;
          case "fk":
            this.selected = this.html;
            break;
          case "fks":
            this.selected = this.html.split(",");
            break;
        }
    },
    buildAutocompltetReq(optionsV2, val) {
      let refedCol = optionsV2?.refed_col || optionsV2?.key_disp_col;
      let req = {
        serviceName: optionsV2.serviceName,
        srvApp: optionsV2.srv_app || null,
        colNames: ["*"],
        condition: [
          {
            colName: refedCol,
            ruleType: "eq",
            value: val,
          },
        ],
        page: {
          pageNo: 1,
          rownumber: 50,
        },
      };

      if (optionsV2?.conditions?.length) {
        const formModel = this.row;
        optionsV2.conditions.forEach((item) => {
          const obj = {
            colName: item.colName,
            ruleType: item.ruleType,
          };
          if (item.value?.indexOf("data.") === 0) {
            obj.value = formModel[item.value.replace("data.", "")];
          } else if (
            item.value &&
            item.value.startsWith("'") &&
            item.value.endsWith("'")
          ) {
            obj.value = item.value.replace(/'/g, "");
          } else {
            obj.ruleType = "like";
            obj.value = item.value;
          }
          if (obj.value) {
            req.condition.push(obj);
          }
        });
      }
      return req;
    },
    async getFkOptions(optionsV2, val) {
      let req = this.buildAutocompltetReq(optionsV2, val);
      if (req) {
        const valColumn = optionsV2.refed_col;
        const labelCol = optionsV2.key_disp_col;
        const url = `/${this.app}/select/${req.serviceName}`;
        this.$http.post(url, req).then((response) => {
          if (response && response.data && response.data.data) {
            let options = response.data.data;
            if (Array.isArray(options) && options.length) {
              const data = {
                option: options[0],
                value: options[0][valColumn],
                label: options[0][labelCol],
              };
              this.$emit("change", data);
            }
          }
          // 调用 callback 返回建议列表的数据
        });
      }
    },
    toDetail() {
      if (this.linkToDetail) {
        let address = `/vpages/#/detail/${this.serviceName}/${this.row.id}?srvApp=${this.app}`;
        let tab_title = this.detailButton.service_view_name;
        let disp_col = this.detailButton._disp_col;
        let disp_value = this.row[disp_col]; //详情页面上的标签
        tab_title = tab_title.replace("查询", "");
        if (disp_value != null && disp_value != undefined && disp_value != "") {
          tab_title = disp_value + "(" + tab_title + "详情)";
        } else {
          tab_title = tab_title + "详情";
        }
        let page = {
          title: tab_title,
          url: address,
          icon: "",
          app: this.app,
        };
        if (window.top.tab) {
          window.top.tab.addTab(page);
        } else {
          // 没有tab实例，在浏览器中打开新标签页
          const page = window.open(address);
          setTimeout(() => {
            page.document.title = tab_title;
          }, 500);
        }
      }
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
    changeFold() {
      this.loadingFold = true;
      console.time("展开折叠操作完成");
      this.$emit("unfold", !this.unfold, (res) => {
        console.timeEnd("展开折叠操作完成");
        this.loadingFold = false;
        this.unfold = this.row?.__unfold ?? !this.unfold;
      });
    },
    showTextarea() {
      this.$emit("event", "showRichEditor");
    },
    showRichEditor(event) {
      if (this.useEditor) {
        this.$emit("event", "showRichEditor");
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
  min-height: 20px;
  text-align: left;
  --w-e-textarea-bg-color: transparent;
  max-height: 80px;
  position: relative;
  display: flex;
  height: 100%;
  white-space: normal;
  &.disabled-wrap {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    height: 24px;
    .flex.w-full,
    .text,
    ::v-deep p {
      width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
  .text {
    width: 100%;

    ::v-deep p {
      margin: 0;
    }
  }

  .old-value {
    text-decoration: line-through;
    color: #f00;
  }

  // overflow-y: auto;
  &.is-rich-text {
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
  right: 0;
  display: none;
  z-index: 9999;
  font-size: 12px;
  padding: 4px;
}

.editor-dialog {
  z-index: 999;
}

.link-to-detail {
  a.text {
    color: #409eff;
  }

  .text {
    display: contents;
    transition: all 0.2s ease;

    &:hover {
      color: #409eff;
      // text-decoration: underline;
      // text-decoration-color: #409eff;
      // text-underline-offset: 0.5em;
      cursor: pointer;
      // &::after{
      //   content: '';
      //   width: 100%;
      //   height: 1px;
      //   position: absolute;
      //   bottom: -2px;
      //   background-color: #409eff;
      // }
    }
  }
}
</style>
