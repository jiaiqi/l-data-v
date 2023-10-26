<template>
  <div class="file-list">
    <div class="edit-icon">
      <el-button size="mini" class="edit-btn" circle @click="showDialog"
        ><i class="el-icon-upload2"></i
      ></el-button>
    </div>
    <div class="file-no">{{ value || "" }}</div>

    <el-dialog title="文件上传" :visible.sync="dialogVisible">
      <el-upload
        class="upload-demo"
        :action="uploadAction"
        :on-preview="handlePreview"
        :on-remove="handleRemove"
        :before-remove="beforeRemove"
        :on-success="handleUploadSuccess"
        :headers="uploadHeaders"
        :data="uploadData"
        :limit="limit"
        :on-exceed="handleExceed"
        :file-list="fileList"
      >
        <el-button size="small" type="primary" v-if="!disabled"
          >点击上传</el-button
        >
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
  created() {},
  methods: {
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
      console.log(this.value);
      console.log(this.modelValue);
      debugger;
      const res = await $http.post(url, req);
      if (res?.data?.state === "SUCCESS") {
        this.fileList = res.data.data.map((item) => {
          return {
            name: item.src_name,
            file_type: item.file_type,
            url: `${window.backendIpAddr}/file/download?filePath=${item.fileurl}`,
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
        this.$nextTick(()=>{
          // this.getFileList();
        })
      }
    },
    handleRemove(file, fileList) {
      console.log(file, fileList);
      if(!fileList?.length){
        this.modelValue = null
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
        `当前限制选择 3 个文件，本次选择了 ${files.length} 个文件，共选择了 ${
          files.length + fileList.length
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
</style>
