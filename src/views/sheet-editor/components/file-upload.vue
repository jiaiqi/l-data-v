<template>
  <div class="file-list">
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
      <!-- <div slot="tip" class="el-upload__tip">
            只能上传jpg/png文件，且不超过500kb
          </div> -->
    </el-upload>
  </div>
</template>

<script>
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
      if (this.html) {
        data.file_no = this.html;
      }
      return data;
    },
    modelValue:{
      set(val){
        this.$emit('change',val)
      },
      get(){
        return this.value
      }
    }
  },
  data() {
    return {
      fileList: [],
    };
  },

  methods: {
    handleUploadSuccess(response, file, fileList) {
      if (response?.file_no) {
        this.innerHtml = response?.file_no;
        this.$emit("change", response?.file_no);
      }
    },
    handleRemove(file, fileList) {
      console.log(file, fileList);
    },
    handlePreview(file) {
      console.log(file);
    },
    handleExceed(files, fileList) {
      this.$message.warning(
        `当前限制选择 3 个文件，本次选择了 ${files.length} 个文件，共选择了 ${
          files.length + fileList.length
        } 个文件`
      );
    },
    beforeRemove(file, fileList) {
      return this.$confirm(`确定移除 ${file.name}？`);
    },
  },
};
</script>

<style lang="scss" scoped></style>
