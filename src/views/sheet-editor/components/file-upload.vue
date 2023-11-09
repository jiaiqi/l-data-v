<template>
  <div class="file-list">
    <div class="edit-icon">
      <el-button size="mini" class="edit-btn" circle @click="showDialog"><i class="el-icon-upload2"></i></el-button>
    </div>
    <div v-if="isImage && getImageUrl">
      <el-image style="width: 100px; height: 100px" :src="getImageUrl" :preview-src-list="srcList"
        @click.native="getFileList()">
      </el-image>
    </div>
    <div class="file-no" v-else>{{ value || "" }}</div>

    <el-dialog title="文件上传" :visible.sync="dialogVisible" @close="hideDialog">
      <div id="imgbox" contenteditable="true"></div>
      <el-upload :disabled="disabled" class="upload-demo" :action="uploadAction" :on-preview="handlePreview"
        :on-remove="handleRemove" :before-remove="beforeRemove" :on-success="handleUploadSuccess" :headers="uploadHeaders"
        :data="uploadData" :limit="limit" :on-exceed="handleExceed" :file-list="fileList"
        :list-type="isImage ? 'picture-card' : 'text'" ref="upload">
        <!-- <div v-if="!disabled && isImage">
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击上传</em>
          </div>
        </div> -->
        <div size="small" type="primary" v-if="isImage && !disabled">点击或粘贴上传</div>
        <el-button size="small" type="primary" v-else-if="!disabled">点击上传</el-button>
        <div class="" v-else @click.prevent.stop="">没有编辑权限</div>
      </el-upload>
    </el-dialog>
  </div>
</template>

<script>
import { $http } from "../../../common/http";

export default {
  props: {
    limit: {
      type: Number,
      default: 999,
    },
    disabled: Boolean,
    app: String,
    column: Object,
    row: Object,
    value: [String, Number],
  },
  computed: {
    srcList() {
      if (this.fileList?.length) {
        return this.fileList.map((item) => item.url).reverse();
      } else if (this.getImageUrl) {
        return [this.getImageUrl];
      }
    },
    getImageUrl() {
      if (this.value) {
        return (
          window.backendIpAddr +
          `/file/download?fileNo=${this.value
          }&bx_auth_ticket=${sessionStorage.getItem("bx_auth_ticket")}`
        );
      }
    },
    isImage() {
      return this.column?.col_type === "Image";
    },
    uploadAction() {
      return window.backendIpAddr + "/file/upload";
    },
    uploadHeaders() {
      return {
        bx_auth_ticket: sessionStorage.getItem("bx_auth_ticket"),
      };
    },
    uploadData() {
      const data = {
        serviceName: "srv_bxfile_service",
        interfaceName: "add",
        app_no: this.app,
        table_name: this.column?.table_name,
        columns: this.column?.columns,
      };
      if (this.modelValue) {
        data.file_no = this.modelValue;
      }
      return data;
    },
    modelValue: {
      set(val) {
        this.$emit("change", val);
      },
      get() {
        return this.value;
      },
    },

  },
  data() {
    return {
      fileList: [],
      dialogVisible: false,
    };
  },
  created() { },
  methods: {
    hideDialog() {
    
    },
    showDialog() {
      if (this.modelValue) {
        this.getFileList();
      }
      this.dialogVisible = true;
    },
    async getFileList() {
      const url = `/file/select/srvfile_attachment_select?srvfile_attachment_select`;
      const req = {
        serviceName: "srvfile_attachment_select",
        colNames: ["*"],
        condition: [
          { colName: "file_no", value: this.modelValue, ruleType: "eq" },
        ],
      };
      const res = await $http.post(url, req);
      if (res?.data?.state === "SUCCESS") {
        this.fileList = res.data.data.map((item) => {
          return {
            name: item.src_name,
            file_type: item.file_type,
            url: `${window.backendIpAddr}/file/download?filePath=${item.fileurl}&bx_auth_ticket=${sessionStorage.getItem('bx_auth_ticket')}`,
            fileurl: item.fileurl,
          };
        });
        if (this.fileList.length === 0) {
          this.$emit("change", null);
        }
      }
    },
    handleUploadSuccess(response, file, fileList) {
      if (response?.file_no) {
        this.modelValue = response?.file_no;
        this.$nextTick(() => {
          // this.getFileList();
        });
      }
    },
    handleRemove(file, fileList) {
      console.log(file, fileList);
      if (!fileList?.length) {
        this.modelValue = null;
      }
    },
    handlePreview(file) {
      console.log(file);
      window.open(file.url);

      // switch (file.file_type) {
      //   case "pdf":
      //     this.$message({
      //       dangerouslyUseHTMLString: true,
      //       message: `<iframe
      //         src="${file.url}?bx_auth_ticket=${sessionStorage.getItem('bx_auth_ticket')}"
      //         frameborder="0"
      //         style="height: 800px; width: 100%"
      //       ></iframe>`,
      //     });
      //     break;

      //   default:
      //     break;
      // }
    },
    handleExceed(files, fileList) {
      this.$message.warning(
        `当前限制选择 3 个文件，本次选择了 ${files.length} 个文件，共选择了 ${files.length + fileList.length
        } 个文件`
      );
    },
    beforeRemove(file, fileList) {
      return this.$confirm(`确定移除 ${file.name}？`)
        .then(() => {
          debugger;
          const url = `/file/delete`;
          const req = { fileurl: file.fileurl };
          $http.post(url, req).then((res) => {
            if (res?.data?.resultCode === "SUCCESS") {
              this.$message.success(`删除成功！`);
              this.getFileList();
            } else {
              this.$message.error(res.data.resultMessage || res.data.state);
            }
          });
        })
        .catch(() => {
          this.$message({
            type: "info",
            message: "已取消删除",
          });
        });
    },
    uploadImgFromPaste(file, type, info) {
      /**调用element的上传方法 需要把base64转换成file上传**/
      let a = this.dataURLtoBlob(file);
      let b = this.blobToFile(a, info);
      const upload = this.$refs.upload
      upload.handleStart(b);
      setTimeout(() => {
        upload.submit();
        this.loading = true;
      })
    },
    dataURLtoBlob(dataurl) {
      //将base64转换为blob
      var arr = dataurl.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]),
        n = bstr.length,
        u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    },
    blobToFile(theBlob, fileInfo) {
      // 将blob转换为file
      theBlob.lastModifiedDate = new Date();
      theBlob.name = fileInfo?.name || `${new Date().getTime()}.jpeg`;
      return theBlob;
    },

    listenPasteEvent() {
      let _this = this;
      const pasteEvent = (event) => {
        if(!this.dialogVisible){
          return
        }
        if (event.clipboardData || event.originalEvent) {
          let clipboardData = (event.clipboardData || event.originalEvent.clipboardData);
          if (clipboardData.items) {
            let items = clipboardData.items,
              len = items.length,
              blob = null;
            //items.length比较有意思，初步判断是根据mime类型来的，即有几种mime类型，长度就是几（待验证）
            //如果粘贴纯文本，那么len=1，如果粘贴网页图片，len=2, items[0].type = 'text/plain', items[1].type = 'image/*'
            //如果使用截图工具粘贴图片，len=1, items[0].type = 'image/png'
            //如果粘贴纯文本+HTML，len=2, items[0].type = 'text/plain', items[1].type = 'text/html'
            //阻止默认行为即不让剪贴板内容在div中显示出来
            event.preventDefault();
            //在items里找粘贴的image,据上面分析,需要循环
            for (let i = 0; i < len; i++) {
              if (items[i].type.indexOf("image") !== -1) {
                blob = items[i].getAsFile();
              }
            }
            if (blob !== null) {
              let reader = new FileReader();
              reader.onload = function (event) {
                // event.target.result 即为图片的Base64编码字符串
                let base64_str = event.target.result
                //可以在这里写上传逻辑 直接将base64编码的字符串上传（可以尝试传入blob对象，看看后台程序能否解析）
                _this.uploadImgFromPaste(base64_str, 'paste', { name: blob.name, type: blob.type, size: blob.size });
              }
              reader.readAsDataURL(blob);
            }
          }
        }
      }
      document.addEventListener('paste', pasteEvent)
    },
  },
  mounted() {
    if (this.isImage) {
        this.listenPasteEvent()
      }
  },


};
</script>

<style lang="scss">
.file-list {
  text-align: left;
  min-height: 30px;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  .edit-icon {
    position: absolute;
    bottom: 10px;
    right: 20px;
    // top: calc(50% - 20px);
    // right: calc(50% - 10px);
    width: 20px;
    height: 20px;
    display: none;
  }

  &:hover {
    .edit-icon {
      cursor: pointer;
      display: block;
    }
  }

  .el-upload-list__item-name {
    text-align: left;
  }
}

.upload-demo {
  min-height: 200px;
}
</style>
