<template>
  <div class="file-list">
    <template v-if="getFileList && getFileList.length">
      <div v-for="(item, index) in getFileList" :key="index" class="file-item">
        <span v-if="isImage(item)" @click="onPreView(item, index)">
          <i class="el-icon-picture m-r-1" title="预览"></i>
          <span>
            {{ item.src_name || item.name }}
          </span>
        </span>
        <span v-else-if="isPDF(item)" @click="onPreView(item, index)">
          <i class="el-icon-document m-r-1" title="预览"></i>
          <span>
            {{ item.src_name || item.name }}
          </span>
        </span>
        <span v-else>
          <i
            class="el-icon-download m-r-1"
            title="下载"
            @click="download(item.url)"
          >
          </i>
          <span @click="onPreView(item)">{{ item.src_name || "--" }}</span>
        </span>
      </div>
    </template>
    <template v-else-if="data && field && field.column && data[field.column]">
      {{ data[field.column] }}
    </template>
    <template v-else> </template>
    <!-- <viewer v-show="false" :images="imageList" ref="viewer">
      <img
        style="height: 1rem; width: 1rem"
        :class="'image-' + src.file_no"
        @error="onerror"
        @load="onerror(src.url)"
        :src="src.url"
        v-for="(src, index) in imageList"
        :key="index"
      />
    </viewer> -->
    <el-image
      style="width: 0; height: 0"
      :src="imgUrls[curIndex]"
      ref="elImage"
      :preview-src-list="imgUrls"
      v-if="imgUrls && imgUrls.length > 0"
    >
    </el-image>
  </div>
</template>

<script>
export default {
  props: {
    field: {
      type: Object,
      default: () => {
        return {};
      },
    },
    data: {
      type: Object,
      default: () => {
        return {};
      },
    },
    fileList: {
      type: Array,
      default: () => {
        return [];
      },
    },
  },
  data() {
    return {
      imgUrl: "",
      curIndex: -1,
    };
  },
  computed: {
    imgUrls() {
      return this.imageList?.map((item) => {
        return item.url;
      });
    },
    imageList() {
      return this.getFileList?.filter((item) => item.isImage === true);
    },
    getFileList() {
      if (
        this.field?._obj_info?.a_save_b_obj_col &&
        this.data[this.field._obj_info.a_save_b_obj_col]
      ) {
        let objStr = this.data[this.field._obj_info.a_save_b_obj_col];
        return JSON.parse(objStr).map((item) => {
          const fileUrl = this.serviceApi().downloadFile + item.fileurl;
          return {
            ...item,
            file_type: item.file_type || item.src_name.split(".").pop(),
            name: item.src_name,
            url: fileUrl,
            isImage: this.isImage(item),
          };
        });
      } else if (Array.isArray(this.fileList) && this.fileList.length) {
        return this.fileList;
      }
    },
  },
  methods: {
    onPreView(file = {}, index) {
      this.curIndex = index;
      if (this.isImage(file)) {
        this.$refs.elImage.showViewer = true;
      } else if (file.file_type === "pdf") {
        let pdfPreviewUrl = `/vpages/#/viewpdf?pdfsrc=${encodeURIComponent(
          file.url
        )}`;
        this.addTabByUrl(
          pdfPreviewUrl,
          file.src_name ? `【${file.src_name}】预览` : "文件预览"
        );
      } else {
        // window.location.href = file.url;
        this.$message({
          message:
            "只支持【pdf】/【jpg】/【png】格式预览，其他格式请点击左侧下载图标下载后查看",
          type: "warning",
        });
      }
    },
    isImage(item) {
      let fileType = item.file_type || item.src_name.split(".").pop();
      if (fileType) {
        fileType = fileType.toLowerCase();
      }
      const imgTypes = ["png", "jpg", "jpeg", "gif", "bmp", "webp", "svg"];
      return imgTypes.includes(fileType);
    },
    isPDF(item) {
      let fileType = item.file_type || item.src_name.split(".").pop();
      if (fileType) {
        fileType = fileType.toLowerCase().trim();
      }
      return fileType === "pdf";
    },
    onerror(e) {
      console.log("显示失败", e);
    },
  },
};
</script>

<style scoped lang="scss">
.file-list {
  flex-direction: column;
  justify-content: flex-start;
  max-height: 100px;
  width: 100%;
}
.file-item {
  width: 100%;
  &:hover {
    text-decoration: underline;
    color: #409eff;
    cursor: pointer;
  }
  .m-r-1 {
    margin-right: 2px;
  }
  .el-icon-download {
    transition: all 0.5s ease;
    &:hover {
      transform: scale(1.5);
    }
  }
}
</style>
