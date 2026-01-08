<template>
  <el-card class="preview-box" shadow="hover">
    <!-- 标题栏 -->
    <div slot="header" class="preview-title">
      <div class="title-section">
        <h3 class="title">{{ title }}</h3>
        <el-tag
          v-if="loaded && !isEmpty"
          size="small"
          type="info"
          class="data-count-tag"
        >
          共 {{ pageInfo.total }} 条数据
        </el-tag>
      </div>
      <div class="header-actions">
        <!-- 字段调整按钮 -->
        <!-- <el-tooltip content="字段调整" placement="top">
          <el-button
            @click="showColumnSelector = true"
            type="text"
            size="small"
            icon="el-icon-setting"
            class="column-setting-btn"
            v-if="allAvailableColumns.length > 0"
          >
            字段调整
          </el-button>
        </el-tooltip> -->

        <!-- 新页面打开按钮 -->
        <el-tooltip content="在新页面中打开" placement="top">
          <el-button
            @click="openNewPage"
            type="text"
            size="small"
            icon="el-icon-link"
            class="new-page-btn"
            v-if="showOpenNewPage"
          >
            新页面打开
          </el-button>
        </el-tooltip>

        <!-- 刷新按钮 -->
        <el-button
          @click="handleRefresh"
          type="primary"
          size="small"
          icon="el-icon-refresh"
          class="refresh-button"
          :loading="refreshing"
        >
          {{ refreshing ? "刷新中" : "刷新" }}
        </el-button>

        <!-- 导出按钮 -->
        <el-dropdown
          @command="handleExportCommand"
          v-if="loaded && !isEmpty"
          trigger="click"
          class="export-dropdown"
        >
          <el-button
            type="primary"
            size="small"
            icon="el-icon-download"
            class="export-button"
            :loading="isExporting"
          >
            {{ isExporting ? "导出中..." : "导出Excel" }}
            <i
              class="el-icon-arrow-down el-icon--right"
              v-if="!isExporting"
            ></i>
          </el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="current" icon="el-icon-document">
              导出当前页 ({{ tableData.length }} 条)
            </el-dropdown-item>
            <el-dropdown-item command="all" icon="el-icon-folder">
              导出全部数据 ({{ pageInfo.total }} 条)
            </el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>
    </div>

    <!-- 字段调整对话框 -->
    <el-dialog
      title="字段调整"
      :visible.sync="showColumnSelector"
      width="600px"
      :close-on-click-modal="false"
      class="column-selector-dialog"
    >
      <div class="column-selector">
        <div class="selector-header">
          <div class="header-left">
            <el-checkbox
              :indeterminate="isIndeterminate"
              v-model="checkAll"
              @change="handleCheckAllChange"
            >
              全选
            </el-checkbox>
            <el-button
              type="text"
              size="mini"
              @click="handleInvertSelection"
              class="invert-btn"
            >
              反选
            </el-button>
          </div>
          <div class="selected-count">
            已选择
            <span class="count-number">{{ localCheckedColumns.length }}</span> /
            {{ allAvailableColumns.length }}
            个字段
          </div>
        </div>

        <!-- 搜索框 -->
        <el-input
          v-model="columnSearchText"
          placeholder="搜索字段名称..."
          size="small"
          prefix-icon="el-icon-search"
          clearable
          class="column-search"
        />

        <el-divider></el-divider>

        <!-- 字段列表 -->
        <div class="column-list-container">
          <el-checkbox-group v-model="localCheckedColumns" class="column-list">
            <div
              v-for="column in filteredColumns"
              :key="column.columns"
              class="column-item"
              :class="{
                'column-item-checked': localCheckedColumns.includes(
                  column.columns
                ),
              }"
            >
              <el-checkbox :label="column.columns" class="column-checkbox">
                <div class="column-info">
                  <span class="column-label">
                    {{ column.label || column.columns }}
                  </span>
                  <span class="column-name" v-if="column.columns">
                    {{ column.columns }}
                  </span>
                  <span class="column-type" v-if="column.type">
                    {{ column.type }}
                  </span>
                </div>
              </el-checkbox>
            </div>
          </el-checkbox-group>

          <!-- 空状态 -->
          <div v-if="filteredColumns.length === 0" class="empty-search">
            <i class="el-icon-search"></i>
            <p>未找到匹配的字段</p>
          </div>
        </div>
      </div>

      <div slot="footer" class="dialog-footer">
        <div class="footer-left">
          <el-button @click="handleResetColumns" size="small">
            <i class="el-icon-refresh-left"></i>
            重置
          </el-button>
        </div>
        <div class="footer-right">
          <el-button @click="handleCancelColumnSelection" size="small"
            >取消</el-button
          >
          <el-button
            type="primary"
            @click="handleConfirmColumnSelection"
            size="small"
            :disabled="localCheckedColumns.length === 0"
          >
            确定 ({{ localCheckedColumns.length }})
          </el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 内容区域 -->
    <div class="preview-content">
      <!-- 字段信息栏 -->
      <!-- <div
        class="field-info-bar"
        v-if="
          allAvailableColumns.length > 0 && currentCheckedColumns.length > 0
        "
      >
        <div class="field-info">
          <el-tag size="mini" type="success">
            <i class="el-icon-view"></i>
            显示 {{ currentCheckedColumns.length }}/{{
              allAvailableColumns.length
            }}
            字段
          </el-tag>
          <el-tag size="mini" type="info" v-if="loaded && !isEmpty">
            <i class="el-icon-document"></i>
            当前页 {{ tableData.length }} 条
          </el-tag>
        </div>
        <el-button
          type="text"
          size="mini"
          @click="showColumnSelector = true"
          class="quick-setting-btn"
        >
          <i class="el-icon-setting"></i>
          字段调整
        </el-button>
      </div> -->

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="10" animated />
      </div>

      <!-- 表格 -->
      <el-table
        :data="tableData"
        stripe
        border
        highlight-current-row
        v-else-if="tableData && tableTitle && tableData.length > 0"
        id="out-table"
        size="small"
        class="data-table"
        @sort-change="handleSortChange"
      >
        <template v-for="(column, index) in tableTitle">
          <el-table-column
            :key="column.columns"
            :prop="column.columns"
            :label="column.aliasName || column.label"
            show-overflow-tooltip
            :min-width="column.width || 150"
            :fixed="index < 2 ? 'left' : false"
          >
            <template slot="header">
              <div class="table-header">
                <span>
                  <!-- <template v-if="column.aliasName">
                    {{ column.aliasName }}
                  </template> -->
                  <template>
                    {{ column.label || column.columns }}
                  </template>
                </span>
                <el-tooltip
                  v-if="column.aliasName || column.label"
                  :content="column.columns"
                  placement="top"
                >
                  <i class="el-icon-info table-header-info"></i>
                </el-tooltip>
              </div>
            </template>
            <template slot-scope="scope">
              <span>
                {{ scope.row[column.columns] || "" }}
              </span>
              <!-- <span>
                {{
                  scope.row[column.aliasName] || scope.row[column.columns] || ""
                }}
              </span> -->
            </template>
          </el-table-column>
        </template>
      </el-table>

      <!-- 空状态 -->
      <div class="empty-state" v-else-if="loaded && isEmpty">
        <div class="empty-icon">
          <i class="el-icon-data-analysis"></i>
        </div>
        <h4>暂无数据</h4>
        <p>请点击刷新按钮获取数据或检查请求参数是否正确</p>
        <el-button type="primary" @click="handleRefresh" class="retry-btn">
          <i class="el-icon-refresh"></i>
          重新获取数据
        </el-button>
      </div>

      <div class="empty-state" v-else-if="loaded === false">
        <div class="empty-icon">
          <i class="el-icon-data-analysis"></i>
        </div>
        <h4>等待数据加载</h4>
        <p>请点击预览按钮获取数据</p>
        <el-button type="primary" @click="handleRefresh" class="retry-btn">
          <i class="el-icon-view"></i>
          开始预览
        </el-button>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination-container" v-if="tableData.length > 0">
      <div class="pagination-info">
        <span>共 {{ pageInfo.total }} 条记录</span>
      </div>
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="pageInfo.pageNo"
        :page-sizes="[10, 20, 50, 100, 200]"
        :page-size="pageInfo.rownumber"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pageInfo.total"
        background
        class="pagination"
      />
    </div>
  </el-card>
</template>

<script setup>
import {
  getCurrentInstance,
  reactive,
  computed,
  ref,
  watch,
  nextTick,
} from "vue";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { $http } from "@/common/http";
import { useRoute, useRouter } from "@/common/vueApi.js";
import cloneDeep from "lodash/cloneDeep";

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
  height: {
    type: [String, Number],
    default: "auto",
  },
});

// 定义emits
const emit = defineEmits([
  "export",
  "size-change",
  "current-change",
  "open-login",
  "columns-change",
  "sort-change",
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
const loading = ref(false);
const refreshing = ref(false);
const tableData = ref([]);
const isExporting = ref(false);

// 字段选择相关状态
const showColumnSelector = ref(false);
const allAvailableColumns = ref([]);
const localCheckedColumns = ref([]);
const currentCheckedColumns = ref([]);
const columnSearchText = ref("");

// 表格高度计算
const tableHeight = computed(() => {
  if (props.height === "auto") return undefined;
  return typeof props.height === "number"
    ? props.height
    : parseInt(props.height);
});

// 过滤后的字段列表
const filteredColumns = computed(() => {
  if (!columnSearchText.value) return allAvailableColumns.value;
  const searchText = columnSearchText.value.toLowerCase();
  return allAvailableColumns.value.filter((column) => {
    const label = (
      column.aliasName ||
      column.label ||
      column.columns
    ).toLowerCase();
    const name = column.columns.toLowerCase();
    return label.includes(searchText) || name.includes(searchText);
  });
});

// 全选状态
const checkAll = computed({
  get() {
    return (
      localCheckedColumns.value.length === allAvailableColumns.value.length &&
      allAvailableColumns.value.length > 0
    );
  },
  set(val) {
    // 这里不需要实现，因为我们用 handleCheckAllChange 处理
  },
});

// 半选状态
const isIndeterminate = computed(() => {
  const checkedCount = localCheckedColumns.value.length;
  return checkedCount > 0 && checkedCount < allAvailableColumns.value.length;
});

// 监听props.checkedColumns变化
watch(
  () => props.checkedColumns,
  (newVal) => {
    if (Array.isArray(newVal)) {
      currentCheckedColumns.value = [...newVal];
    }
  },
  { immediate: true }
);

// 处理全选/取消全选
const handleCheckAllChange = (val) => {
  if (val) {
    localCheckedColumns.value = allAvailableColumns.value.map(
      (col) => col.columns
    );
  } else {
    localCheckedColumns.value = [];
  }
};

// 反选
const handleInvertSelection = () => {
  const allColumnNames = allAvailableColumns.value.map((col) => col.columns);
  localCheckedColumns.value = allColumnNames.filter(
    (name) => !localCheckedColumns.value.includes(name)
  );
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
  columnSearchText.value = "";
};

// 重置字段选择
const handleResetColumns = () => {
  localCheckedColumns.value = allAvailableColumns.value.map(
    (col) => col.columns
  );
  proxy.$message.info("已重置为全部字段");
};

// 处理排序变化
const handleSortChange = (sortInfo) => {
  emit("sort-change", sortInfo);
};

async function getTableData(req = {}) {
  // 保留上次的请求参数，分页切换时不丢失过滤条件
  if (req && Object.keys(req).length > 0) {
    initReq.value = req;
  } else if (!req || Object.keys(req).length === 0) {
    req = initReq.value || {};
  }

  if(req?.group?.length){
    localCheckedColumns.value = req.group.map((item) => item.aliasName || item.alias_name || item.colName || item.columns || item.col_name);
    currentCheckedColumns.value = [...localCheckedColumns.value];
  }

  loading.value = true;

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

  try {
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
        if (pageInfo.pageNo === 1) {
          proxy.$message.warning("暂无数据");
        }
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

    // 如果请求中带有分组/聚合配置，则仅显示这些字段
    const groupItems = Array.isArray(req?.group)
      ? req.group.filter((item) => item && item.type)
      : [];

    // 处理分组/聚合字段，将每个配置项视为独立字段
    const processedColumns = [];
    const processedColumnKeys = new Set();

    if (groupItems.length > 0) {
      groupItems.forEach((item) => {
        const alias = item.aliasName || item.alias_name;
        const name = item.colName || item.columns || item.col_name;
        const colObj = allColumns.find((c) => c.columns === name);

        if (colObj) {
          // 深拷贝原始字段配置
          const newCol = cloneDeep(colObj);

          // 如果有别名，将其视为新字段
          if (alias) {
            newCol.columns = alias;
            newCol.label = alias;
            newCol.originalColumns = name; // 保存原始字段名
          }

          // 确保字段键唯一
          const key = newCol.columns;
          if (!processedColumnKeys.has(key)) {
            processedColumnKeys.add(key);
            processedColumns.push(newCol);
          }
        }
      });

      // 只显示分组/聚合配置的字段
      allAvailableColumns.value = processedColumns;
    } else {
      // 没有分组/聚合配置，显示所有原始字段
      allAvailableColumns.value = allColumns;
      // 重置处理后的列
      processedColumns.length = 0;
      processedColumnKeys.clear();
    }

    // 如果是第一次加载且没有预设的选中列，默认选中所有可用列
    if (
      currentCheckedColumns.value.length === 0 &&
      allAvailableColumns.value.length > 0
    ) {
      currentCheckedColumns.value = allAvailableColumns.value.map(
        (col) => col.columns
      );
      localCheckedColumns.value = [...currentCheckedColumns.value];
    }

    // 根据选中的列过滤显示的列
    let finalColumns;

    if (groupItems.length > 0) {
      // 对于分组/聚合配置，先获取有序列的处理后列
      const orderedColumns = [];
      groupItems.forEach((item) => {
        const alias = item.aliasName || item.alias_name;
        const colKey = alias || item.colName || item.columns || item.col_name;
        const col = processedColumns.find((c) => c.columns === colKey);
        if (col) {
          // 设置序列
          if (item.seq) {
            col.seq = item.seq;
          }
          // 添加到有序列表
          orderedColumns.push(col);
        }
      });
      // 如果有序列配置，按序列排序
      if (
        orderedColumns.some(
          (col) => col._group?.seq || col._aggregation?.seq || col.seq
        )
      ) {
        orderedColumns.sort(
          (a, b) =>
            (a._group?.seq || a._aggregation?.seq || a.seq || 0) -
            (b._group?.seq || b._aggregation?.seq || b.seq || 0)
        );
      }

      // 根据当前选中的列过滤显示的列
      finalColumns = orderedColumns.filter((item) =>
        currentCheckedColumns.value.includes(item.columns)
      );
    } else {
      // 没有分组/聚合配置，根据选中的列过滤
      finalColumns = allColumns.filter((item) =>
        currentCheckedColumns.value.includes(item.columns)
      );
    }

    tableTitle.value = finalColumns;
  } catch (error) {
    console.error("获取数据失败:", error);
    proxy.$message.error("获取数据失败: " + (error.message || "未知错误"));
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
}

async function handleRefresh() {
  refreshing.value = true;
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

  // 使用通知而不是消息，避免被其他消息覆盖
  const notification = proxy.$notify({
    title: "导出进度",
    message: "开始导出全部数据，请稍候...",
    type: "info",
    duration: 0,
  });

  try {
    // 构建请求参数，获取全部数据
    const req = {
      colNames: ["*"],
      ...initReq.value,
      serviceName: props.serviceName,
      page: {
        pageNo: 1,
        rownumber: pageInfo.total || 999999,
      },
    };

    if (!props?.columnsOption?.length) {
      req.mdata = true;
    }

    // 请求全部数据
    const res = await $http.post(requestUrl.value, req);

    if (res.data.resultCode === "0011") {
      notification.close();
      isExporting.value = false;
      return emit("open-login");
    }

    if (res.data.state !== "SUCCESS") {
      notification.close();
      isExporting.value = false;
      if (res.data.resultMessage) {
        proxy.$message.error(res.data.resultMessage);
      }
      return;
    }

    const allData = res.data.data;
    if (!allData || allData.length === 0) {
      notification.close();
      isExporting.value = false;
      proxy.$message.warning("没有数据可导出");
      return;
    }

    // 更新进度
    notification.message = "正在处理数据...";

    // 获取列配置 - 只导出当前选中的字段
    const allColumns = res.data.mdata || props.columnsOption || [];
    // 结合请求的分组/聚合配置来确定导出字段
    const groupItems = Array.isArray(initReq.value?.group)
      ? initReq.value.group.filter((item) => item && item.type)
      : [];

    // 处理分组/聚合字段，支持别名
    let finalColumns = [];
    const processedColumnKeys = new Set();

    if (groupItems.length > 0) {
      // 处理分组/聚合配置的字段，支持别名
      groupItems.forEach((item) => {
        const alias = item.aliasName || item.alias_name;
        const name = item.colName || item.columns || item.col_name;
        const colObj = allColumns.find((c) => c.columns === name);

        if (colObj) {
          // 深拷贝原始字段配置
          const newCol = cloneDeep(colObj);

          // 如果有别名，将其视为新字段
          if (alias) {
            newCol.columns = alias;
            newCol.label = alias;
            newCol.originalColumns = name; // 保存原始字段名
          }

          // 确保字段键唯一
          const key = newCol.columns;
          if (!processedColumnKeys.has(key)) {
            processedColumnKeys.add(key);
            finalColumns.push(newCol);
          }
        }
      });

      // 按照配置顺序排序
      const orderedColumns = [];
      groupItems.forEach((item) => {
        const alias = item.aliasName || item.alias_name;
        const colKey = alias || item.colName || item.columns || item.col_name;
        const col = finalColumns.find((c) => c.columns === colKey);
        if (col) {
          orderedColumns.push(col);
        }
      });

      finalColumns = orderedColumns;
    } else if (
      Array.isArray(currentCheckedColumns.value) &&
      currentCheckedColumns.value.length > 0
    ) {
      // 没有分组/聚合配置，根据选中的列过滤
      finalColumns = allColumns.filter((item) =>
        currentCheckedColumns.value.includes(item.columns)
      );
    } else {
      // 默认显示所有列
      finalColumns = allColumns;
    }

    // 创建工作簿
    const wb = XLSX.utils.book_new();

    // 准备表头
    const headers = finalColumns.map(
      (col) => col.aliasName || col.label || col.columns
    );

    // 准备数据
    const exportData = allData.map((row) => {
      const rowData = [];
      finalColumns.forEach((col) => {
        rowData.push(row[col.columns] || "");
      });
      return rowData;
    });

    // 将表头和数据合并
    const wsData = [headers, ...exportData];

    // 创建工作表
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // 设置列宽
    const colWidths = finalColumns.map((col) => ({
      wch: Math.max(
        col.width ? col.width / 10 : 15,
        (col.aliasName || col.label || col.columns).length + 2
      ),
    }));
    ws["!cols"] = colWidths;

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, "全部数据");

    // 生成文件名
    let time = dayjs().format("YYYYMMDDHHmmss");
    let fileName = `${props.title || props.serviceName}_全部数据_${time}.xlsx`;

    // 更新进度
    notification.message = "正在生成文件...";

    // 导出文件
    XLSX.writeFile(wb, fileName);

    notification.close();
    proxy.$notify({
      title: "导出成功",
      message: `全部数据导出成功，共 ${allData.length} 条记录，${finalColumns.length} 个字段`,
      type: "success",
      duration: 3000,
    });
  } catch (error) {
    notification.close();
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
  await getTableData(initReq.value);
  emit("size-change", val);
};

// 处理当前页变化
const handleCurrentChange = async (val) => {
  pageInfo.pageNo = val;
  await getTableData(initReq.value);
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
};

const getNewPageUrl = computed(() => {
  return `/dataview/#/report/${props.reqNo}`;
});
</script>

<style scoped lang="scss">
.preview-box {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 20px;
  transition: all 0.3s ease;
  width: calc(100% - 40px);

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1) !important;
  }

  .preview-title {
    padding: 0 4px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .title-section {
      display: flex;
      align-items: center;
      gap: 12px;

      .title {
        font-size: 18px;
        font-weight: 600;
        color: #1f2937;
        margin: 0;
      }

      .data-count-tag {
        background-color: #f3f4f6;
        color: #6b7280;
        border: none;
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .column-setting-btn,
    .new-page-btn {
      color: #6b7280;
      transition: all 0.2s;
      padding-left: 12px;
      padding-right: 12px;

      &:hover {
        color: #3b82f6;
        background-color: #eff6ff;
      }
    }

    .refresh-button,
    .export-button {
      transition: all 0.2s;
      border-radius: 6px;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      }

      &.el-button--primary {
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        border-color: #3b82f6;
      }
    }
  }

  .preview-content {
    .field-info-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);
      border-radius: 8px;
      margin-bottom: 16px;
      border: 1px solid #e2e8f0;

      .field-info {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .quick-setting-btn {
        font-size: 12px;
        padding: 4px 8px;
        color: #6b7280;

        &:hover {
          color: #3b82f6;
        }
      }
    }

    .loading-container {
      padding: 20px;
    }

    .data-table {
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #e5e7eb;
      min-height: 400px;

      ::v-deep .el-table__header {
        th {
          background-color: #f9fafb !important;
          color: #374151;
          font-weight: 600;
          padding: 12px 0;
          border-bottom: 2px solid #e5e7eb;
        }
      }

      ::v-deep .el-table__body {
        td {
          padding: 10px 0;
          border-bottom: 1px solid #f3f4f6;
        }
      }

      ::v-deep .el-table__row {
        transition: background-color 0.2s;

        &:hover > td {
          background-color: #f8fafc !important;
        }
      }

      .table-header {
        display: flex;
        align-items: center;
        gap: 4px;

        .table-header-info {
          font-size: 12px;
          color: #9ca3af;
          cursor: help;
        }
      }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
      background: linear-gradient(135deg, #fafbfc, #f8fafc);
      border-radius: 12px;
      border: 2px dashed #e5e7eb;

      .empty-icon {
        margin-bottom: 16px;

        i {
          font-size: 64px;
          color: #d1d5db;
        }
      }

      h4 {
        margin: 0 0 8px;
        font-size: 18px;
        color: #374151;
        font-weight: 600;
      }

      p {
        margin: 0 0 20px;
        font-size: 14px;
        color: #6b7280;
        line-height: 1.5;
      }

      .retry-btn {
        border-radius: 8px;
        padding: 10px 20px;
      }
    }
  }
}

.pagination-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0 0;
  border-top: 1px solid #f0f0f0;
  margin-top: 20px;

  .pagination-info {
    font-size: 14px;
    color: #6b7280;
  }

  .pagination {
    ::v-deep .el-pagination.is-background .el-pager li:not(.disabled).active {
      background-color: #3b82f6;
      border-color: #3b82f6;
    }

    ::v-deep .el-pagination.is-background .el-pager li:not(.disabled):hover {
      color: #3b82f6;
    }

    ::v-deep .el-pagination__jump {
      margin-left: 16px;
    }
  }
}

// 字段选择器样式
.column-selector-dialog {
  ::v-deep .el-dialog {
    border-radius: 12px;
  }

  ::v-deep .el-dialog__header {
    padding: 20px 20px 0;
    border-bottom: 1px solid #f0f0f0;
  }

  ::v-deep .el-dialog__body {
    padding: 20px;
  }
}

.column-selector {
  .selector-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .invert-btn {
      font-size: 12px;
      color: #6b7280;
      padding: 0;

      &:hover {
        color: #3b82f6;
      }
    }

    .selected-count {
      font-size: 13px;
      color: #6b7280;

      .count-number {
        font-weight: 600;
        color: #3b82f6;
      }
    }
  }

  .column-search {
    margin-bottom: 16px;
  }

  .column-list-container {
    max-height: 400px;
    overflow-y: auto;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    padding: 8px;

    .column-list {
      .column-item {
        display: block;
        margin-bottom: 4px;
        padding: 8px 12px;
        border-radius: 6px;
        transition: all 0.2s;

        &:hover {
          background-color: #f8fafc;
        }

        &.column-item-checked {
          background-color: #eff6ff;
          border: 1px solid #dbeafe;
        }

        .column-checkbox {
          width: 100%;

          ::v-deep .el-checkbox__label {
            width: calc(100% - 20px);
            padding-left: 8px;
          }
        }

        .column-info {
          display: flex;
          gap: 20px;
        }

        .column-label {
          font-weight: 500;
          color: #1f2937;
          font-size: 14px;
        }

        .column-name {
          font-size: 12px;
          color: #6b7280;
          font-family: "Monaco", "Menlo", monospace;
        }

        .column-type {
          font-size: 11px;
          color: #9ca3af;
          background-color: #f3f4f6;
          padding: 2px 6px;
          border-radius: 4px;
          align-self: flex-start;
        }
      }
    }

    .empty-search {
      text-align: center;
      padding: 40px 20px;
      color: #9ca3af;

      i {
        font-size: 32px;
        margin-bottom: 8px;
        display: block;
      }

      p {
        margin: 0;
        font-size: 14px;
      }
    }
  }
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  margin: 0 -20px -20px;

  .footer-left,
  .footer-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .preview-box {
    padding: 16px;

    .preview-title {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;

      .header-actions {
        width: 100%;
        justify-content: flex-end;
      }
    }

    .pagination-container {
      flex-direction: column;
      gap: 12px;

      .pagination-info {
        order: 2;
      }
    }
  }

  .column-selector-dialog {
    ::v-deep .el-dialog {
      width: 95% !important;
      margin: 5vh auto;
    }
  }
}
</style>
