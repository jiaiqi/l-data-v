<template>
  <el-card class="preview-box" shadow="hover">
    <div slot="header" class="preview-title">
      <div class="title">{{ title }}</div>
      <div>
        <span
          class="new-page-btn"
          @click="openNewPage"
          v-if="showOpenNewPage"
        >
          新页面打开
        </span>
        <el-button
          @click="handleRefresh"
          type="primary"
          size="small"
          icon="el-icon-refresh"
          class="refresh-button"
        >
          刷新
        </el-button>
        <el-button
          @click="handleExport"
          type="primary"
          size="small"
          icon="el-icon-download"
          class="export-button"
          v-if="loaded && !isEmpty"
          >导出为Excel</el-button
        >
      </div>
    </div>
    <div class="preview-content">
      <el-table
        :data="tableData"
        stripe
        border
        highlight-current-row
        v-if="tableData && tableTitle && tableData.length > 0"
        id="out-table"
        size="small"
      >
        <template v-for="(only, i) in tableTitle">
          <el-table-column
            :prop="only.columns"
            :label="only.aliasName || only.label"
            show-overflow-tooltip
            :min-width="only.width || 150"
          ></el-table-column>
        </template>
      </el-table>
      <div class="empty-data" v-if="loaded && isEmpty">
        <i class="el-icon-data-analysis"></i>
        <p>暂无数据，请点击预览按钮获取数据或检查请求参数是否正确</p>
      </div>
      <div class="empty-data" v-else-if="loaded === false">
        <i class="el-icon-data-analysis" @click="handleRefresh"></i>
        <p>请点击预览按钮获取数据</p>
      </div>
    </div>
    <div class="pagination">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="pageInfo.pageNo"
        :page-sizes="[10, 50, 100, 200]"
        :page-size="pageInfo.rownumber"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pageInfo.total"
        background
        v-if="tableData.length > 0"
      ></el-pagination>
    </div>
  </el-card>
</template>

<script setup>
import { getCurrentInstance, reactive, computed, ref } from "vue";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { $http } from "@/common/http";
import { useRoute, useRouter } from "@/common/vueApi.js";

// 定义组件名称
// defineOptions({
//   name: "DataPreview",
// });

// 定义props
const props = defineProps({
  reqNo: {
    type: String,
    default: "",
  },
  appName: {
    type: String,
    default: "",
  },
  serviceName: {
    type: String,
    default: "",
  },
  columnsOption: {
    type: Array,
    default: () => [],
  },
  title: {
    type: String,
    default: "",
  },
  checkedColumns: {
    type: Array,
    default: () => [],
  },
});

// 定义emits
const emit = defineEmits([
  "export",
  "size-change",
  "current-change",
  "open-login",
]);

// 获取当前实例以访问$message
const { proxy } = getCurrentInstance();

const requestUrl = computed(() => {
  return `/${props.appName}/select/${props.serviceName}`;
});
const pageInfo = reactive({
  pageNo: 1,
  rownumber: 10,
  total: 0,
});

const tableTitle = ref([]);
const initReq = ref(null);
const isEmpty = ref(false);
const loaded = ref(false);
const tableData = ref([]);

async function getTableData(req = {}) {
  if (req) {
    initReq.value = req;
  }
  req = {
    colNames: ["*"],
    ...req,
    serviceName: props.serviceName,
    page: {
      pageNo: pageInfo.pageNo,
      rownumber: pageInfo.rownumber || 10,
    },
  };
  if (!props?.columnsOption?.length) {
    req.mdata = true;
  }
  // if (props.columnsOption?.length) {
  //   tableTitle.value = props.columnsOption;
  // } else {
  // req.mdata = true;
  // }
  // 获取预览数据
  tableTitle.value = [];
  const res = await $http.post(requestUrl.value, req);
  loaded.value = true;
  if (res.data.resultCode === "0011") {
    return emit("open-login");
  }
  if (res.data.state === "SUCCESS") {
    if (res.data.data?.length === 0) {
      tableData.value = [];
      isEmpty.value = true;
      proxy.$message.warning("暂无数据");
    } else {
      isEmpty.value = false;
    }
  } else {
    if (res.data.resultMessage) {
      proxy.$message.warning(res.data.resultMessage);
    }
    return false;
  }
  let pageData = res.data.page; //获取分页信息
  pageInfo.pageNo = pageData.pageNo;
  pageInfo.rownumber = pageData.rownumber;
  pageInfo.total = pageData.total;
  tableData.value = res.data.data;
  // if (res.data.mdata) {
  tableTitle.value = res.data.mdata;
  // }
  //表头数组
  let tableAllTitleData = req?.group || [];
  const allColumns = res.data.mdata || props.columnsOption || [];
  let finalColumns = allColumns;
  if(Array.isArray(props.checkedColumns) && props.checkedColumns.length){
    finalColumns = allColumns.filter((item) => props.checkedColumns.includes(item.columns));
  }
   tableTitle.value = finalColumns;
  // if (tableAllTitleData.length === 0) {
  //   tableTitle.value = finalColumns;
  // } else if (allColumns.length) {
  //   tableTitle.value = [];
  //   tableAllTitleData.forEach((item) => {
  //     if (item.type) {
  //       allColumns.forEach((col) => {
  //         //
  //         if (item.colName === col.columns) {
  //           tableTitle.value.push(col);
  //         }
  //       });
  //     } else {
  //       tableTitle.value = allColumns;
  //     }
  //   });
  //   let obj = {};
  //   let newArr = [];
  //   newArr = tableTitle.value.reduce((item, next) => {
  //     obj[next.columns] ? " " : (obj[next.columns] = true && item.push(next));
  //     return item;
  //   }, []);

  //   tableTitle.value = newArr;
  // }
}
async function handleRefresh() {
  pageInfo.pageNo = 1;
  pageInfo.rownumber = 10;
  tableTitle.value = [];
  tableData.value = [];
  await getTableData(initReq.value);
}
// 导出Excel方法
const exportExcel = () => {
  if (!tableData.value || tableData.value.length === 0) {
    proxy.$message.warning("表格数据为空");
    return;
  }
  try {
    let time = dayjs().format("YYYYMMDDHHmmss");
    let fileName = props.serviceName + time;
    // 将预览表格中的数据导出为excel
    let wb = XLSX.utils.table_to_book(document.querySelector("#out-table"));
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  } catch (error) {
    console.error("导出Excel失败:", error);
    proxy.$message.error("导出Excel失败");
  }
};

// 处理导出
const handleExport = () => {
  emit("export");
  exportExcel();
};

// 处理页面大小变化
const handleSizeChange = async (val) => {
  pageInfo.rownumber = val;
  await getTableData();
  emit("size-change", val);
};

// 处理当前页变化
const handleCurrentChange = async (val) => {
  pageInfo.pageNo = val;
  await getTableData();
  emit("current-change", val);
};

const handleGetData = async (req) => {
  await getTableData(req);
};
defineExpose({
  handleGetData,
});
const route = useRoute();
const showOpenNewPage = computed(() => {
  return route && route.name?.includes("report") !== true;
});

const openNewPage = () => {
  window.open(getNewPageUrl.value, "_blank");
}
const getNewPageUrl = computed(() => {
  return `/dataview/#/report/${props.reqNo}`;
  return {
    name: "report3",
    params: {
      reportNo: props.reqNo,
    },
  };
});
</script>

<style scoped lang="scss">
.preview-box {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  padding: 16px;
  transition: all 0.3s ease;
  width: 100%;
  &:hover {
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08) !important;
  }

  .preview-title {
    padding: 0 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .title {
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }
    .new-page-btn {
      cursor: pointer;
      font-size: 13px;
      transition: all 0.3s;
      &:hover {
        color: #409eff;
        transform: translateY(-2px);
      }
    }
    .export-button,
    .refresh-button {
      transition: all 0.3s;
      margin-left: 10px;
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      &.el-button--primary {
        background: linear-gradient(135deg, #1989fa, #096dd9);
        border-color: #409eff;
      }
    }
  }

  .preview-content {
    width: 100%;
    border-radius: 5px;
    overflow: hidden;

    .el-table {
      border-radius: 4px;
      overflow: hidden;

      ::v-deep th {
        background-color: #f5f7fa !important;
        color: #606266;
        font-weight: 500;
        padding: 10px 0;
      }

      ::v-deep td {
        padding: 8px 0;
      }

      ::v-deep .el-table__row:hover > td {
        background-color: #f0f7ff !important;
      }
    }

    .empty-data {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 0;
      color: #909399;
      background-color: #fafafa;
      border-radius: 4px;

      i {
        font-size: 48px;
        margin-bottom: 10px;
        color: #c0c4cc;
      }

      p {
        font-size: 14px;
      }
    }
  }

  .export-button {
    margin: 0;
  }
}

.pagination {
  width: 100%;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 5rem;
  padding-top: 16px;

  ::v-deep .el-pagination.is-background .el-pager li:not(.disabled).active {
    background-color: #409eff;
    color: #fff;
  }

  ::v-deep .el-pagination.is-background .el-pager li:not(.disabled):hover {
    color: #409eff;
  }
}
</style>
