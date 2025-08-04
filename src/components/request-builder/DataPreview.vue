<template>
  <el-card class="preview-box" shadow="hover">
    <div slot="header" class="preview-title">
      <div class="title">{{ title }}</div>
      <div class="header-actions">
        <el-button
          @click="showColumnSelector = true"
          type="text"
          size="small"
          icon="el-icon-setting"
          class="column-setting-btn"
          v-if="allAvailableColumns.length > 0"
        >
          字段设置
        </el-button>
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
        <el-dropdown 
          @command="handleExportCommand"
          v-if="loaded && !isEmpty"
          trigger="click"
        >
          <el-button
            type="primary"
            size="small"
            icon="el-icon-download"
            class="export-button"
          >
            导出为Excel<i class="el-icon-arrow-down el-icon--right"></i>
          </el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="current">导出当前页</el-dropdown-item>
            <el-dropdown-item command="all">导出全部数据</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>
    </div>
    
    <!-- 字段选择器对话框 -->
    <el-dialog
      title="字段设置"
      :visible.sync="showColumnSelector"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="column-selector">
        <div class="selector-header">
          <el-checkbox
            :indeterminate="isIndeterminate"
            v-model="checkAll"
            @change="handleCheckAllChange"
          >
            全选
          </el-checkbox>
          <span class="selected-count">
            已选择 {{ localCheckedColumns.length }} / {{ allAvailableColumns.length }} 个字段
          </span>
        </div>
        <el-divider></el-divider>
        <el-checkbox-group v-model="localCheckedColumns" class="column-list">
          <div 
            v-for="column in allAvailableColumns" 
            :key="column.columns"
            class="column-item"
          >
            <el-checkbox :label="column.columns">
              <span class="column-label">
                {{ column.aliasName || column.label || column.columns }}
              </span>
              <span class="column-name" v-if="column.aliasName || column.label">
                ({{ column.columns }})
              </span>
            </el-checkbox>
          </div>
        </el-checkbox-group>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="handleCancelColumnSelection">取消</el-button>
        <el-button @click="handleResetColumns">重置</el-button>
        <el-button type="primary" @click="handleConfirmColumnSelection">确定</el-button>
      </div>
    </el-dialog>

    <div class="preview-content">
      <!-- 显示当前选中的字段数量 -->
      <div class="field-info" v-if="allAvailableColumns.length > 0 && currentCheckedColumns.length > 0">
        <span class="field-count">
          <i class="el-icon-view"></i>
          当前显示 {{ currentCheckedColumns.length }} / {{ allAvailableColumns.length }} 个字段
        </span>
        <el-button 
          type="text" 
          size="mini" 
          @click="showColumnSelector = true"
          class="quick-setting-btn"
        >
          快速设置
        </el-button>
      </div>
      
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
            :key="only.columns"
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
import { getCurrentInstance, reactive, computed, ref, watch } from "vue";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { $http } from "@/common/http";
import { useRoute, useRouter } from "@/common/vueApi.js";

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
  "columns-change", // 新增：字段变化事件
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
const isExporting = ref(false);

// 字段选择相关状态
const showColumnSelector = ref(false);
const allAvailableColumns = ref([]);
const localCheckedColumns = ref([]);
const currentCheckedColumns = ref([]);

// 全选状态
const checkAll = computed({
  get() {
    return localCheckedColumns.value.length === allAvailableColumns.value.length && allAvailableColumns.value.length > 0;
  },
  set(val) {
    // 这里不需要实现，因为我们用 handleCheckAllChange 处理
  }
});

// 半选状态
const isIndeterminate = computed(() => {
  const checkedCount = localCheckedColumns.value.length;
  return checkedCount > 0 && checkedCount < allAvailableColumns.value.length;
});

// 监听props.checkedColumns变化
watch(() => props.checkedColumns, (newVal) => {
  if (Array.isArray(newVal)) {
    currentCheckedColumns.value = [...newVal];
  }
}, { immediate: true });

// 处理全选/取消全选
const handleCheckAllChange = (val) => {
  if (val) {
    localCheckedColumns.value = allAvailableColumns.value.map(col => col.columns);
  } else {
    localCheckedColumns.value = [];
  }
};

// 确认字段选择
const handleConfirmColumnSelection = () => {
  if (localCheckedColumns.value.length === 0) {
    proxy.$message.warning("请至少选择一个字段");
    return;
  }
  
  currentCheckedColumns.value = [...localCheckedColumns.value];
  showColumnSelector.value = false;
  
  // 触发字段变化事件
  emit("columns-change", currentCheckedColumns.value);
  
  // 重新获取数据以应用新的字段选择
  handleRefresh();
  
  proxy.$message.success(`已选择 ${localCheckedColumns.value.length} 个字段`);
};

// 取消字段选择
const handleCancelColumnSelection = () => {
  localCheckedColumns.value = [...currentCheckedColumns.value];
  showColumnSelector.value = false;
};

// 重置字段选择
const handleResetColumns = () => {
  localCheckedColumns.value = allAvailableColumns.value.map(col => col.columns);
};

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
  
  // 处理列配置
  const allColumns = res.data.mdata || props.columnsOption || [];
  allAvailableColumns.value = allColumns;
  
  // 如果是第一次加载且没有预设的选中列，默认选中所有列
  if (currentCheckedColumns.value.length === 0 && allColumns.length > 0) {
    currentCheckedColumns.value = allColumns.map(col => col.columns);
    localCheckedColumns.value = [...currentCheckedColumns.value];
  }
  
  // 根据选中的列过滤显示的列
  let finalColumns = allColumns;
  if (Array.isArray(currentCheckedColumns.value) && currentCheckedColumns.value.length > 0) {
    finalColumns = allColumns.filter((item) => currentCheckedColumns.value.includes(item.columns));
  }
  
  tableTitle.value = finalColumns;
}

async function handleRefresh() {
  pageInfo.pageNo = 1;
  pageInfo.rownumber = 10;
  tableTitle.value = [];
  tableData.value = [];
  await getTableData(initReq.value);
}

// 导出当前页Excel方法
const exportCurrentPageExcel = () => {
  if (!tableData.value || tableData.value.length === 0) {
    proxy.$message.warning("表格数据为空");
    return;
  }
  try {
    let time = dayjs().format("YYYYMMDDHHmmss");
    let fileName = props.serviceName + "_当前页_" + time;
    // 将预览表格中的数据导出为excel
    let wb = XLSX.utils.table_to_book(document.querySelector("#out-table"));
    XLSX.writeFile(wb, `${fileName}.xlsx`);
    proxy.$message.success("当前页数据导出成功");
  } catch (error) {
    console.error("导出Excel失败:", error);
    proxy.$message.error("导出Excel失败");
  }
};

// 导出全部数据Excel方法
const exportAllDataExcel = async () => {
  if (isExporting.value) {
    proxy.$message.warning("正在导出中，请稍候...");
    return;
  }
  
  isExporting.value = true;
  proxy.$message.info("开始导出全部数据，请稍候...");
  
  try {
    // 构建请求参数，获取全部数据
    const req = {
      colNames: ["*"],
      ...initReq.value,
      serviceName: props.serviceName,
      page: {
        pageNo: 1,
        rownumber: pageInfo.total || 999999, // 设置一个很大的数字来获取全部数据
      },
    };
    
    if (!props?.columnsOption?.length) {
      req.mdata = true;
    }

    // 请求全部数据
    const res = await $http.post(requestUrl.value, req);
    
    if (res.data.resultCode === "0011") {
      isExporting.value = false;
      return emit("open-login");
    }
    
    if (res.data.state !== "SUCCESS") {
      isExporting.value = false;
      if (res.data.resultMessage) {
        proxy.$message.error(res.data.resultMessage);
      }
      return;
    }

    const allData = res.data.data;
    if (!allData || allData.length === 0) {
      isExporting.value = false;
      proxy.$message.warning("没有数据可导出");
      return;
    }

    // 获取列配置 - 只导出当前选中的字段
    const allColumns = res.data.mdata || props.columnsOption || [];
    let finalColumns = allColumns;
    if (Array.isArray(currentCheckedColumns.value) && currentCheckedColumns.value.length > 0) {
      finalColumns = allColumns.filter((item) => currentCheckedColumns.value.includes(item.columns));
    }

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    
    // 准备表头
    const headers = finalColumns.map(col => col.aliasName || col.label || col.columns);
    
    // 准备数据
    const exportData = allData.map(row => {
      const rowData = [];
      finalColumns.forEach(col => {
        rowData.push(row[col.columns] || '');
      });
      return rowData;
    });
    
    // 将表头和数据合并
    const wsData = [headers, ...exportData];
    
    // 创建工作表
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // 设置列宽
    const colWidths = finalColumns.map(col => ({
      wch: Math.max(col.width ? col.width / 10 : 15, (col.aliasName || col.label || col.columns).length + 2)
    }));
    ws['!cols'] = colWidths;
    
    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, "全部数据");
    
    // 生成文件名
    let time = dayjs().format("YYYYMMDDHHmmss");
    let fileName = `${props.title || props.serviceName}_全部数据_${time}.xlsx`;
    
    // 导出文件
    XLSX.writeFile(wb, fileName);
    
    proxy.$message.success(`全部数据导出成功，共 ${allData.length} 条记录，${finalColumns.length} 个字段`);
    
  } catch (error) {
    console.error("导出全部数据失败:", error);
    proxy.$message.error("导出全部数据失败: " + (error.message || "未知错误"));
  } finally {
    isExporting.value = false;
  }
};

// 处理导出命令
const handleExportCommand = (command) => {
  emit("export");
  if (command === "current") {
    exportCurrentPageExcel();
  } else if (command === "all") {
    exportAllDataExcel();
  }
};

// 处理导出（保持向后兼容）
const handleExport = () => {
  emit("export");
  exportCurrentPageExcel();
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
    
    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .column-setting-btn {
      color: #606266;
      &:hover {
        color: #409eff;
      }
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
    
    .field-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background-color: #f8f9fa;
      border-radius: 4px;
      margin-bottom: 12px;
      font-size: 13px;
      
      .field-count {
        color: #606266;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      
      .quick-setting-btn {
        font-size: 12px;
        padding: 0;
      }
    }

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

// 字段选择器样式
.column-selector {
  .selector-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
    
    .selected-count {
      font-size: 13px;
      color: #606266;
    }
  }
  
  .column-list {
    max-height: 300px;
    overflow-y: auto;
    
    .column-item {
      display: block;
      margin-bottom: 8px;
      padding: 4px 0;
      
      .el-checkbox {
        width: 100%;
        
        .el-checkbox__label {
          width: calc(100% - 20px);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
      }
      
      .column-label {
        font-weight: 500;
        color: #303133;
      }
      
      .column-name {
        font-size: 12px;
        color: #909399;
        margin-left: 8px;
      }
    }
  }
}

.dialog-footer {
  text-align: right;
  
  .el-button {
    margin-left: 8px;
  }
}
</style>
