<template>
  <div class="page-wrap">
    <el-container>
      <el-header style="height: unset">
        <div class="header-box">
          <div v-if="config && config.list_title" class="title">
            {{ config.list_title || "" }}
          </div>
          <div class="title" v-else></div>
          <div>
            <el-button
              size="mini"
              plain
              type="primary"
              v-if="tableData && tableData.length"
              @click="exportExcel"
              >导出</el-button
            >
            <el-button
              size="mini"
              plain
              type="primary"
              @click="toReqSetting"
              title="编辑请求"
              v-if="showSettingBtn"
            >
              <i class="el-icon-edit-outline"></i>
            </el-button>
          </div>
        </div>
        <!-- 分组 -->
        <div
          class="group-box"
          v-if="
            groupByCols &&
            typeof groupByCols === 'object' &&
            Object.keys(groupByCols).length > 1
          "
        >
          <div
            class="group-box-item"
            v-for="(groupItem, key) in groupByCols"
            :key="key"
          >
            <el-radio-group
              @input="changeGroup($event, groupItem.list, key)"
              v-model="groupItem.value"
            >
              <el-radio
                :label="index"
                :value="item.col_name"
                :key="index"
                v-for="(item, index) in groupItem.list"
                @click.native="clickRadio($event, key, index)"
              >
                <span>{{ item.label }}</span>
              </el-radio>
            </el-radio-group>
          </div>
        </div>
        <!-- 筛选 -->
        <div v-if="filterCols && filterCols.length > 0">
          <el-form ref="form" :model="filterModel">
            <el-row>
              <el-col
                :xs="24"
                :sm="12"
                :md="8"
                :lg="6"
                :xl="4"
                v-for="(item, index) in filterCols"
                :key="index"
              >
                <el-form-item :label="item.label">
                  <el-date-picker
                    value-format="yyyy-MM-dd"
                    v-model="item.value"
                    type="daterange"
                    range-separator="至"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                    v-if="item.col_type === 'Date'"
                    @change="valueChange($event, item)"
                  >
                  </el-date-picker>
                  <el-date-picker
                    value-format="yyyy-MM-dd HH:mm:ss"
                    v-model="item.value"
                    type="datetimerange"
                    range-separator="至"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                    v-if="item.col_type === 'DateTime'"
                    @change="valueChange($event, item)"
                  >
                  </el-date-picker>
                  <el-input
                    v-model="item.value"
                    clearable
                    v-else-if="
                      item.col_type === 'String' ||
                      (item.col_type && item.col_type.indexOf('bx') === 0)
                    "
                    @change="valueChange($event, item)"
                  ></el-input>
                  <div
                    class="number-range-input"
                    v-else-if="
                      ['Money', 'Float', 'Int', 'Integer'].includes(
                        item.col_type
                      )
                    "
                  >
                    <el-input
                      v-model.number="item.value1"
                      clearable
                      @change="valueChange($event, item)"
                      type="number"
                    ></el-input>
                    <span class="marign-lr">-</span>
                    <el-input
                      v-model.number="item.value2"
                      clearable
                      @change="valueChange($event, item)"
                      type="number"
                    ></el-input>
                  </div>
                </el-form-item>
              </el-col>
              <!-- <el-col :xs="8" :sm="6" :md="4" :lg="2" :xl="1" align="right">
                <el-button type="primary" @click="resetFilter">重置</el-button>
              </el-col> -->
            </el-row>
          </el-form>
        </div>
      </el-header>
      <el-main>
        <!-- 图表区域 -->
        <div class="chart-container">
          <div class="chart-header">
            <span> </span>
            <div
              v-if="showChartSettings"
              class="chart-controls chart-controls-popover"
            >
              <div class="chart-controls-title">
                <span>设置</span>
                <el-button
                  type="text"
                  icon="el-icon-close"
                  @click="showChartSettings = false"
                  size="mini"
                ></el-button>
              </div>
              <div class="chart-controls-content">
                <div class="chart-control-item">
                  <span class="control-label">图表类型：</span>
                  <el-switch
                    v-model="chartType"
                    active-value="line"
                    inactive-value="bar"
                    active-text="折线"
                    inactive-text="柱状"
                    @change="updateChart"
                  ></el-switch>
                </div>
                <div class="chart-control-item" v-if="chartType === 'bar'">
                  <span class="control-label">堆叠：</span>
                  <el-switch
                    v-model="isStacked"
                    active-text="堆叠"
                    inactive-text="普通"
                    @change="updateChart"
                  ></el-switch>
                </div>
                <div class="chart-control-item" v-if="chartType === 'line'">
                  <span class="control-label">面积：</span>
                  <el-switch
                    v-model="isArea"
                    active-text="面积"
                    inactive-text="普通"
                    @change="updateChart"
                  ></el-switch>
                </div>
                <div class="chart-control-item">
                  <span class="control-label">图例：</span>
                  <el-switch
                    v-model="showLegend"
                    active-text="显示"
                    inactive-text="隐藏"
                    @change="updateChart"
                  ></el-switch>
                </div>
                <div class="chart-control-item">
                  <span class="control-label">数字单位：</span>
                  <el-switch
                    v-model="autoFormatNumber"
                    active-text="自动"
                    inactive-text="原始"
                    @change="updateChart"
                  ></el-switch>
                </div>
                <div class="chart-control-item">
                  <span class="control-label">单元格合并：</span>
                  <el-select
                    v-model="mergeMode"
                    placeholder="选择合并模式"
                    size="mini"
                    style="width: 140px"
                  >
                    <el-option label="不合并" value="none"></el-option>
                    <el-option label="只合并首列" value="first"></el-option>
                    <el-option
                      label="合并所有符合条件的列"
                      value="all"
                    ></el-option>
                  </el-select>
                </div>
              </div>
            </div>
            <el-button
              type="primary"
              icon="el-icon-setting"
              circle
              size="mini"
              class="chart-settings-btn"
              @click="showChartSettings = !showChartSettings"
              :title="showChartSettings ? '收起设置' : '展开设置'"
            ></el-button>
          </div>
          <div class="chart" v-show="hasCols">
            <div id="chart" class="chart-dom" ref="chartRef"></div>
          </div>
          <div v-if="hasCols === false" class="chart-empty-tip">
            <el-empty
              description="当前数据不满足生成图表的要求，请选择分组字段"
            ></el-empty>
          </div>
        </div>
      </el-main>
      <!-- <div v-else style="height: 0;flex-shrink:0;box-sizing:border-box;"></div> -->
      <el-main>
        <!-- 表格合并模式切换 -->
        <!-- <div
          class="table-merge-control"
          style="margin-bottom: 10px; text-align: right"
        >
          <span style="margin-right: 10px">表格合并模式：</span>
          <el-select
            v-model="mergeMode"
            placeholder="选择合并模式"
            style="width: 200px"
          >
            <el-option label="不合并" value="none"></el-option>
            <el-option label="只合并首列" value="first"></el-option>
            <el-option label="合并所有符合条件的列" value="all"></el-option>
          </el-select>
        </div> -->
        <!-- 数据 -->
        <el-table
          ref="elTable"
          :data="tableData"
          border
          stripe
          style="width: 100%"
          :span-method="objectSpanMethod"
          v-loading="onLoading"
          :header-cell-style="{
            background: '#f0f3f9',
            'font-weight': 'bold',
            color: '#000',
          }"
        >
          <el-table-column
            :prop="column.columns"
            :label="column.label"
            :formatter="cellValueFormatter"
            min-width="180"
            v-for="column in setSrvCols"
            :key="column.columns"
          >
            <template #header v-if="isGroupColumn(column)">
              <el-popover
                placement="bottom-start"
                :width="240"
                trigger="click"
                popper-class="group-col-filter-popover"
                :value="getGroupFilter(column).open"
                @input="(val) => (getGroupFilter(column).open = val)"
                @show="onGroupFilterShow(column)"
                @hide="onGroupFilterHide(column)"
              >
                <div class="group-col-filter">
                  <div class="group-col-filter__search">
                    <el-input
                      v-model="getGroupFilter(column).keyword"
                      size="mini"
                      placeholder="搜索选项"
                      clearable
                      :prefix-icon="undefined"
                    >
                      <i
                        slot="prefix"
                        class="el-input__icon el-icon-search"
                      ></i>
                    </el-input>
                  </div>
                  <div class="group-col-filter__actions">
                    <el-checkbox
                      :indeterminate="
                        getGroupFilter(column).selected.length > 0 &&
                        getGroupFilter(column).selected.length < getFilteredValues(column).length &&
                        getGroupFilter(column).selected.length < getGroupFilter(column).values.length
                      "
                      :value="
                        getFilteredValues(column).length > 0 &&
                        getGroupFilter(column).values.length > 0 &&
                        getGroupFilter(column).selected.length === getFilteredValues(column).length
                      "
                      @change="(val) => toggleAllGroupFilter(column, val)"
                    >
                      全选
                    </el-checkbox>
                    <el-button
                      type="text"
                      size="mini"
                      @click="resetGroupFilter(column)"
                    >
                      重置
                    </el-button>
                  </div>
                  <div class="group-col-filter__list" v-loading="getGroupFilter(column).loading">
                    <el-checkbox-group v-model="getGroupFilter(column).selected">
                      <el-checkbox
                        v-for="opt in getFilteredValues(column)"
                        :key="String(opt)"
                        :label="opt"
                        class="group-col-filter__item"
                      >
                        {{ opt === '' || opt === null || opt === undefined ? '(空)' : opt }}
                      </el-checkbox>
                    </el-checkbox-group>
                    <div
                      v-if="!getGroupFilter(column).loading && getFilteredValues(column).length === 0 && getGroupFilter(column).values.length > 0"
                      class="group-col-filter__empty"
                    >
                      无匹配项
                    </div>
                    <div
                      v-if="!getGroupFilter(column).loading && getGroupFilter(column).values.length === 0"
                      class="group-col-filter__empty"
                    >
                      暂无数据
                    </div>
                  </div>
                  <div class="group-col-filter__footer">
                    <el-button
                      size="mini"
                      @click="cancelGroupFilter(column)"
                    >
                      取消
                    </el-button>
                    <el-button
                      type="primary"
                      size="mini"
                      @click="confirmGroupFilter(column)"
                    >
                      确认
                    </el-button>
                  </div>
                </div>
                <div slot="reference" class="group-col-header">
                  <span>{{ column.label }}</span>
                  <i
                    class="el-icon-arrow-down group-col-header__icon"
                    :class="{
                      'is-active':
                        getGroupFilter(column).selected.length > 0 &&
                        getGroupFilter(column).selected.length < getGroupFilter(column).values.length
                    }"
                  ></i>
                </div>
              </el-popover>
            </template>
          </el-table-column>
        </el-table>
      </el-main>
      <el-footer v-if="page" style="padding: 20px; text-align: center">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="page.pageNo"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="page.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="page.total"
        >
        </el-pagination>
      </el-footer>
    </el-container>
    <login-dialog ref="loginRef"></login-dialog>
  </div>
</template>

<script>
// import * as XLSX from "xlsx";
// import dayjs from "dayjs";
import { $http } from "@/common/http";
import loginDialog from "@/components/login-dialog/index.vue";
import echarts from "@/utils/echarts.js";

export default {
  components: {
    loginDialog,
  },
  data() {
    return {
      config: null,
      srvReqJson: null,
      tableData: [],
      listV2: null,
      srvCols: [],
      _origin_srv_cols: [],
      page: null,
      groupCols: [],
      calcCols: [],
      groupByCols: {}, // 分组字段 可能重复
      groupByColsVal: {},
      onLoading: false,
      curGroup: null,
      current: "",
      filterCols: [],
      sum_row_data: {},
      // 图表相关
      chartType: "bar", // 图表类型：bar-柱状图，line-折线图
      isStacked: false, // 是否为堆叠柱状图
      isArea: false, // 是否为区域面积折线图
      chartInstance: null, // echarts实例
      showLegend: true, // 是否显示图例
      showChartSettings: false, // 是否显示图表设置面板
      autoFormatNumber: true, // 是否自动换算数字单位（万、亿）
      // 表格合并相关
      mergeMode: "first", // 合并模式：none-不合并，first-只合并首列，all-合并所有符合条件的列
      spanCache: {}, // 表格单元格合并预计算缓存 { colName: [{ rowspan, colspan }] }
      spanVersion: 0, // 合并缓存版本号，变化时强制 el-table 重新调用 span-method
      // 分组列表头下拉筛选：{ [colName]: { open, selected, values, allValues } }
      groupColFilter: {},
      // 分组列可选项请求的加载状态，避免重复打
      groupColOptionsLoading: false,
    };
  },
  computed: {
    showSettingBtn() {
      // 是否显示表定义详情按钮
      const current_login_user = sessionStorage.getItem("current_login_user");
      if (!current_login_user) {
        return false;
      }
      try {
        const user = JSON.parse(current_login_user);
        return user?.roles?.includes("admin") || user?.roles?.includes("rd");
      } catch (error) {
        return false;
      }
    },
    hasCols() {
      return (
        this.groupByCols &&
        Object.keys(this.groupByCols).filter(
          (key) => this.groupByCols[key].value > -1
        ).length > 0
      );
    },
    showChart() {
      return this.tableData && this.tableData.length > 0;
    },
    filterModel() {
      if (Array.isArray(this.filterCols) && this.filterCols.length > 0) {
        return this.filterCols.reduce((res, cur) => {
          res[cur.columns] = cur.value;
          return res;
        }, {});
      }
      return {};
    },
    colsMap() {
      return this.listV2?.srv_cols.reduce((res, cur) => {
        res[cur.columns] = cur;
        return res;
      }, {});
    },
    requestNo() {
      return this.$route.query?.requestNo;
    },
    serviceName() {
      return this.srvReqJson?.serviceName;
    },
    setSrvCols() {
      if (
        this.groupByCols &&
        Array.isArray(this.listV2?.srv_cols) &&
        this.listV2?.srv_cols.length > 0
      ) {
        let arr = this.srvReqJson?.group || [];
        arr = arr.filter((item) => item.type && item.type.indexOf("by") == -1);
        for (const key in this.groupByCols) {
          if (Object.hasOwnProperty.call(this.groupByCols, key)) {
            const item = this.groupByCols[key].list;
            if (
              typeof this.groupByCols[key].value === "number" &&
              this.groupByCols[key].value > -1
            ) {
              const info = item[this.groupByCols[key].value];
              if (info.row_json) {
                try {
                  let group = JSON.parse(info.row_json);
                  arr.push(group);
                } catch (error) {}
              }
            }
          }
        }

        const srvCols = [];
        if (arr.length) {
          arr.forEach((item) => {
            const col = this.listV2?.srv_cols.find(
              (g) => g.columns === item.colName || g.columns === item.col_name
            );
            if (col) {
              const colInfo = {
                ...col,
                seq: item.seq,
                label: item.aliasName || item.alias_name || col.label,
                columns: item.aliasName || item.alias_name || col.columns,
              };
              srvCols.push(colInfo);
            }
          });
        }
        return srvCols.sort((a, b) => a.seq - b.seq);
      }
      return [];
    },
  },
  methods: {
    /**
     * 判断当前列是否在 groupCols 中（只有当 groupCols.length > 1 时才显示筛选图标）
     */
    isGroupColumn(column) {
      if (!column || !Array.isArray(this.groupCols) || this.groupCols.length <= 1) {
        return false;
      }
      // 兼容 colName 和 aliasName 两种列名
      return this.groupCols.some(
        (gc) => gc.colName === column.columns || gc.aliasName === column.columns
      );
    },
    /**
     * 获取某分组列的下拉筛选状态（懒初始化）
     */
    getGroupFilter(column) {
      if (!this.groupColFilter[column.columns]) {
        this.$set(this.groupColFilter, column.columns, {
          open: false,
          values: [],
          selected: [],
          loading: false,
          keyword: "",
        });
      }
      return this.groupColFilter[column.columns];
    },
    /**
     * 根据 keyword 模糊过滤可选值
     * 匹配规则：包含 keyword 子串（不区分大小写）
     */
    getFilteredValues(column) {
      const filter = this.getGroupFilter(column);
      const keyword = (filter.keyword || "").trim().toLowerCase();
      if (!keyword) return filter.values || [];
      return (filter.values || []).filter((v) => {
        if (v === "" || v === null || v === undefined) {
          return "空".includes(keyword) || "(空)".includes(keyword);
        }
        return String(v).toLowerCase().includes(keyword);
      });
    },
    /**
     * 弹出筛选面板时，独立发请求拉取该 by 字段在当前过滤条件下的所有去重值
     * 下拉选项的取值范围与 tableData 解耦，筛选之后依然能展示全量
     */
    async onGroupFilterShow(column) {
      const filter = this.getGroupFilter(column);
      // 找到该列对应的 groupCol 配置（用 aliasName/columns 匹配）
      const gc = (this.groupCols || []).find(
        (g) => g.aliasName === column.columns || g.colName === column.columns
      );
      if (!gc) return;

      // 记录基线，用于 hide 时比对
      filter._baseline = filter.selected.slice();
      // 每次打开清空搜索关键字
      filter.keyword = "";
      // 标记为加载中（UI 上无 loading，但避免重复点击）
      filter.loading = true;
      try {
        const values = await this.fetchGroupColOptions(gc);
        filter.values = values;
        // 保留用户已选但仍在新值中的项；若无任何命中，视为全选默认态
        const kept = filter.selected.filter((v) => values.includes(v));
        filter.selected = kept.length > 0 ? kept : values.slice();
      } catch (e) {
        // 拉取失败时退化为空，避免 UI 卡死
        filter.values = [];
      } finally {
        filter.loading = false;
      }
    },
    /**
     * 独立请求：根据当前 srvReqJson 的过滤条件 + group 只保留这一个 by 字段，
     * 让后端返回该字段下的所有去重值
     */
    async fetchGroupColOptions(gc) {
      if (!this.srvReqJson?.serviceName) return [];
      // 拉取可选项时不要把 groupColFilter 自身作为 condition，避免"自己筛自己"
      const baseReq = this.buildListReq({ skipGroupColFilter: true });
      const req = {
        ...baseReq,
        // 只保留当前 by 字段
        group: [
          {
            colName: gc.colName,
            type: gc.type || "by",
            seq: gc.seq ?? 0,
            aliasName: gc.aliasName,
          },
        ],
        // 拉选项时只取当前字段，并给一个较大的 rownumber 覆盖完所有值
        page: { pageNo: 1, rownumber: 1000 },
        colNames: [gc.aliasName || gc.colName],
      };
      const url = `/${this.srvReqJson.mapp}/select/${this.srvReqJson.serviceName}`;
      const res = await $http.post(url, req);
      if (res?.data?.state !== "SUCCESS") return [];
      const rows = Array.isArray(res.data.data) ? res.data.data : [];
      // groupby 后返回字段名是 aliasName
      const key = gc.aliasName || gc.colName;
      const set = new Set();
      rows.forEach((row) => {
        const v = row[key];
        if (v !== undefined && v !== null) set.add(v);
        else set.add("");
      });
      return Array.from(set);
    },
    /**
     * 全选/取消全选
     * 作用域是"当前可见的过滤后列表"，而不是 values 全集
     */
    toggleAllGroupFilter(column, val) {
      const filter = this.getGroupFilter(column);
      const visible = this.getFilteredValues(column);
      if (val) {
        // 全选：合并 visible + 已选中的（保留 keyword 之外、用户主动选过的项）
        const merged = Array.from(new Set([...filter.selected, ...visible]));
        filter.selected = merged;
      } else {
        // 取消全选：只移除当前可见的项
        const visibleSet = new Set(visible);
        filter.selected = filter.selected.filter((v) => !visibleSet.has(v));
      }
    },
    /**
     * 重置：全部勾选 + 清空搜索关键字
     */
    resetGroupFilter(column) {
      const filter = this.getGroupFilter(column);
      filter.selected = filter.values.slice();
      filter.keyword = "";
    },
    /**
     * 确认：把当前 selected 与"可见项"求交集后提交为新的筛选条件
     * 解决"搜索后只剩 1 个却没生效"的 bug：
     *   selected 可能保留着旧的全集（搜索时 el-checkbox-group 不会自动剔除不可见项），
     *   此时 visible 与 selected 的差集即为"搜索意图"——视为变更
     */
    confirmGroupFilter(column) {
      const filter = this.getGroupFilter(column);
      const visible = this.getFilteredValues(column);
      const visibleSet = new Set(visible);
      // 实际生效值 = selected 与 visible 的交集
      // （selected 中不可见的项视为"被搜索过滤掉"）
      const effective = filter.selected.filter((v) => visibleSet.has(v));
      const baseline = filter._baseline || [];
      const changed =
        baseline.length !== effective.length ||
        baseline.some((v, i) => v !== effective[i]);
      // 同步回 selected
      filter.selected = effective;
      filter.open = false;
      if (changed) {
        this.applyGroupFilter();
      }
    },
    /**
     * 取消：把 selected 恢复到 _baseline，关闭弹层，不触发任何请求
     */
    cancelGroupFilter(column) {
      const filter = this.getGroupFilter(column);
      if (filter._baseline) {
        filter.selected = filter._baseline.slice();
      }
      filter.keyword = "";
      filter.open = false;
    },
    /**
     * 弹层从其他途径关闭（点外面 / ESC）：回滚到 baseline
     */
    onGroupFilterHide(column) {
      const filter = this.getGroupFilter(column);
      if (!filter) return;
      // 若已由确认/取消显式关闭，open 已经是 false，直接跳过
      if (!filter.open) return;
      // 兜底：当作取消处理
      if (filter._baseline) {
        filter.selected = filter._baseline.slice();
      }
      filter.keyword = "";
      filter.open = false;
    },
    /**
     * 选中值变化时，触发后端重新查询
     * 条件变化后必须从第 1 页开始拉取
     */
    applyGroupFilter() {
      if (this.page) {
        this.page.pageNo = 1;
      }
      this.getList();
    },
    /**
     * 兼容旧调用：数据刷新后无需主动同步可选值（采用独立请求后，values 始终是最新的）
     * 保留方法占位，避免外部调用报错
     */
    refreshGroupColFilters() {
      // noop
    },
    /**
     * 跳转请求定义详情页
     */
    toReqSetting() {
      const reqNo = this.config.default_srv_req_no;
      if (!reqNo) {
        this.$message.warning("请先配置默认请求");
        return;
      }
      const url = `/dataview/#/select-builder/${reqNo}`;
      window.open(url);
    },
    /**
     * 查询后端生成文件的状态
     * @param {*} uuid 后端返回的文件唯一标识
     * @param {string} app 应用编号
     */
    async getFileState(uuid, app) {
      const url = `/${app}/export/file/check?uuid=${uuid}`;
      const res = await $http(url);
      console.log(res.data);
      if (res.data.state === "SUCCESS") {
        return res.data.resultMessage;
      } else {
        return null;
      }
    },
    downloadexport(uuid) {
      let app = "lgs";
      if (this.srvReqJson?.mapp) {
        app = this.srvReqJson?.mapp;
      }
      const url = `${
        window.backendIpAddr
      }/${app}/downloadexport/${uuid}?bx_auth_ticket=${sessionStorage.getItem(
        "bx_auth_ticket"
      )}`;
      window.open(url);
      var loading = this.openLoading("文件准备中...");
      const downloadTimer = setInterval(() => {
        this.getFileState(uuid, app)
          .then((res) => {
            if (res === "完成") {
              loading.close();
              clearInterval(downloadTimer);
            }
          })
          .catch((err) => {
            console.log(err);
            loading.close();
            clearInterval(downloadTimer);
          });
      }, 1000);
    },
    exportExcel() {
      let app = "lgs";
      if (this.srvReqJson?.mapp) {
        app = this.srvReqJson?.mapp;
      }
      const url = `/${app}/export/${this.srvReqJson?.serviceName}`;
      const req = this.buildListReq();
      if (req.page) {
        delete req.page;
      }
      $http.post(url, req).then((res) => {
        if (res?.data?.data.uuid) {
          this.downloadexport(res?.data?.data.uuid);
        }
      });
    },
    resetFilter() {
      this.filterCols = this.filterCols.map((item) => {
        item.value = undefined;
        return item;
      });
    },
    valueChange(e, columnInfo) {
      this.getList();
    },
    clickRadio(e, key, index) {
      console.log(key, index);
      if (this.groupByCols[key].value === index) {
        e.preventDefault();

        this.groupByCols[key].value = -1;
        this.$set(this.groupByCols[key], "value", -1);
        this.changeGroup();
      }
    },
    changeGroup(val, cols) {
      const groupList = [];
      for (const key in this.groupByCols) {
        if (Object.hasOwnProperty.call(this.groupByCols, key)) {
          const item = this.groupByCols[key].list;
          if (
            typeof this.groupByCols[key].value === "number" &&
            this.groupByCols[key].value > -1
          ) {
            const info = item[this.groupByCols[key].value];
            if (info.row_json) {
              try {
                let group = JSON.parse(info.row_json);
                if (info?.alias_name) {
                  group.aliasName = info.alias_name;
                }
                groupList.push(group);
              } catch (error) {}
            }
          }
        }
      }
      this.curGroup = [...groupList, ...this.calcCols];
      this.getList();
    },
    computeSpanMap() {
      this.spanCache = {};
      this.spanVersion++; // 触发 el-table 重新调用 span-method
      if (this.mergeMode === "none" || !this.tableData.length) {
        return;
      }

      // 取分组列的"表格显示列名"（aliasName 优先），与 column.property 匹配
      // 按 seq 排序，保证与表格列的展示顺序一致（祖先块判断依赖列顺序）
      const sortedGroupCols = [...this.groupCols].sort(
        (a, b) => (a.seq ?? 0) - (b.seq ?? 0)
      );
      const mergeCols = sortedGroupCols.map(
        (item) => item.aliasName || item.colName
      );
      const firstMergeCol = mergeCols[0] || null;
      const lastIndex = this.tableData.length - 1;

      // 初始化缓存
      mergeCols.forEach((colName) => {
        this.spanCache[colName] = new Array(this.tableData.length).fill({
          rowspan: 1,
          colspan: 1,
        });
      });

      if (this.mergeMode === "first") {
        // 仅合并首列：复用 all 模式对首列的处理
        this.computeColSpans(
          firstMergeCol,
          0,
          lastIndex,
          mergeCols
        );
      } else if (this.mergeMode === "all") {
        // 按列顺序依次合并：每列的可合并作用域是"前序所有列的祖先块相同"
        mergeCols.forEach((colName, colIdx) => {
          this.computeColSpans(colName, 0, lastIndex, mergeCols, colIdx);
        });
      }
    },
    /**
     * 在 [start, end] 范围内，对 colName 找出连续相同值并写入 spanCache
     * "all" 模式下，仅当前面所有列在两行的祖先块起点一致时，本列才能合并
     * @param {string} colName 当前列的展示列名（aliasName 优先）
     * @param {number} start 起始行（含）
     * @param {number} end 结束行（含）
     * @param {string[]} mergeCols 全部参与合并的列名（按表格顺序）
     * @param {number} [colIdx] 当前列在 mergeCols 中的下标，缺省视为首列
     */
    computeColSpans(colName, start, end, mergeCols, colIdx) {
      if (start > end) return;
      const col = (this.groupCols || []).find(
        (g) => (g.aliasName || g.colName) === colName
      );
      if (!col) return;
      // 表格中实际数据键名：aliasName 优先
      const actualKey = col.aliasName || col.colName;
      // 前面列的键（用于判断祖先块）
      const prevKeys =
        typeof colIdx === "number"
          ? mergeCols.slice(0, colIdx).map((cn) => {
              const c = (this.groupCols || []).find(
                (g) => (g.aliasName || g.colName) === cn
              );
              return c ? c.aliasName || c.colName : cn;
            })
          : [];

      // 找 idx 所在合并块的起点（rowspan > 0 的行）
      const findBlockStart = (cache, idx) => {
        let s = idx;
        while (s > 0 && cache[s - 1] && cache[s - 1].rowspan === 0) s--;
        return s;
      };
      // 判断第 i 行与第 j 行是否属于"同一祖先块"
      // 即前面所有列在 i 和 j 行所在的合并块起点相同
      const sameAncestorBlock = (i, j) => {
        for (const k of prevKeys) {
          const cache = this.spanCache[k];
          if (!cache) continue;
          const startI = findBlockStart(cache, i);
          const startJ = findBlockStart(cache, j);
          if (startI !== startJ) return false;
        }
        return true;
      };

      let blockStart = start;
      for (let i = start; i <= end; i++) {
        const curVal = this.tableData[i][actualKey];
        const nextVal =
          i < end ? this.tableData[i + 1][actualKey] : Symbol("__END__");
        // 与下一行断开合并的条件：值不同，或祖先块不同
        if (nextVal !== curVal || !sameAncestorBlock(i, i + 1)) {
          const blockSize = i - blockStart + 1;
          for (let k = blockStart; k <= i; k++) {
            this.spanCache[colName][k] = {
              rowspan: k === blockStart ? blockSize : 0,
              colspan: 1,
            };
          }
          blockStart = i + 1;
        }
      }
    },

    objectSpanMethod({ row, column, rowIndex }) {
      // 读取 spanVersion 以建立响应式依赖，spanCache 重建后能自动重算
      // eslint-disable-next-line no-unused-vars
      const _v = this.spanVersion;
      if (this.mergeMode === "none") {
        return;
      }

      const colName = column.property;
      const cache = this.spanCache[colName];

      if (!cache || cache.length <= rowIndex) {
        return;
      }

      return cache[rowIndex];
    },
    handleSizeChange(val) {
      this.page.rownumber = val;
      this.getList();
    },
    handleCurrentChange(val) {
      this.page.pageNo = val;
      this.getList();
    },
    getListCfg() {
      const url = "/config/select/srvpage_cfg_com_list_select";
      const req = {
        serviceName: "srvpage_cfg_com_list_select",
        colNames: ["*"],
        condition: [
          {
            colName: "list_no",
            ruleType: "eq",
            value: this.requestNo,
          },
        ],
        page: { pageNo: 1, rownumber: 1 },
      };
      $http.post(url, req).then((res) => {
        if (res?.data?.state === "SUCCESS" && res.data.data.length > 0) {
          const config = res.data.data[0];
          if (config?.default_srv_req_json) {
            try {
              this.config = {
                ...config,
                srv_req_no: config.default_srv_req_no,
                filter_cols: config.filter_cols,
              };
              // 优先使用 default_srv_req_json（已规范化的标准格式）
              this.srvReqJson = JSON.parse(config.default_srv_req_json);
            } catch (error) {}
          }
          if (this.srvReqJson?.serviceName) {
            // this.page = this.srvReqJson.page
            this.getListV2(this.srvReqJson?.serviceName).then(() => {
              this.getList();
              // this.getGroupFields()
            });
          }
        } else if (res?.data?.resultCode === "0011") {
          this.$refs.loginRef.open();
        }
      });
    },
    getRequestCfg() {
      const url = "/config/select/srvpage_cfg_srv_call_select";
      const req = {
        serviceName: "srvpage_cfg_srv_call_select",
        colNames: ["*"],
        condition: [
          { colName: "srv_call_no", ruleType: "like", value: this.requestNo },
        ],
        page: { pageNo: 1, rownumber: 1 },
      };
      $http.post(url, req).then((res) => {
        if (res?.data?.state === "SUCCESS" && res.data.data.length > 0) {
          this.config = res.data.data[0];
          try {
            this.srvReqJson = JSON.parse(this.config?.srv_req_json);
          } catch (error) {}
          if (this.srvReqJson?.serviceName) {
            // this.page = this.srvReqJson.page
            this.getListV2(this.srvReqJson?.serviceName).then(() => {
              this.getList();
              // this.getGroupFields()
            });
          }
        }
      });
    },
    async getGroupFields() {
      const url = `/config/select/srvpage_cfg_srv_call_group_stats_select`;
      const req = {
        serviceName: "srvpage_cfg_srv_call_group_stats_select",
        colNames: ["*"],
        order: [{ colName: "seq", orderType: "asc" }],
        condition: [
          {
            colName: "srv_req_no",
            ruleType: "eq",
            value: this.config?.srv_req_no || this.requestNo,
          },
        ],
      };
      const res = await $http.post(url, req);
      if (Array.isArray(res.data.data)) {
        let groupFields = res.data.data;
        let cols = res.data.data.reduce((res, cur) => {
          if (!res.find((item) => item.columns === cur.col_name)) {
            let col = this.srvCols.find((e) => e.columns === cur.col_name);
            if (col) {
              res.push(col);
            }
          }
          return res;
        }, []);
        this.srvCols = cols;
        const groupType = [
          "by",
          "by_year",
          "by_month",
          "by_week",
          "by_date",
          "by_hour",
          "by_minute",
          "by_second",
          "by_month_of_year",
          "by_week_of_year",
          "by_date_of_year",
          "by_hour_of_date",
          "by_minute_of_date",
        ];
        const calcType = [
          "sum",
          "mix",
          "max",
          "avg",
          "count",
          "count_all",
          "distinct_count",
        ];
        this.calcCols = groupFields
          .filter((item) => calcType.includes(item.type_stat))
          .map((item) => {
            return {
              aliasName: item.alias_name,
              colName: item.col_name,
              type: item.type_stat,
              seq: item.seq,
            };
          });
        this.groupCols = groupFields
          .filter(
            (item) =>
              item.type_stat === "by" || item.type_stat?.startsWith("by_")
          )
          .map((item) => {
            return {
              aliasName: item.alias_name,
              colName: item.col_name,
              type: item.type_stat,
              seq: item.seq,
            };
          });
        this.groupByCols = groupFields
          .filter((item) => groupType.includes(item.type_stat))
          .reduce((res, cur) => {
            let fieldInfo = this._origin_srv_cols.find(
              (item) => item.columns === cur.col_name
            );
            if (fieldInfo) {
              cur.label = `按${fieldInfo.label}`;
              switch (cur.type_stat) {
                case "by_year":
                  cur.label = "按年";
                  break;
                case "by_month":
                  cur.label = "按月";
                  break;
                case "by_month_of_year":
                  cur.label = "按年月";
                  break;
                case "by_week":
                case "by_week_of_year":
                  cur.label = "按周";
                  break;
                case "by_date":
                case "by_date_of_year":
                  cur.label = "按日";
                  break;
              }
              if (res[cur.col_name]?.list) {
                res[cur.col_name].list.push({ ...cur });
              } else {
                res[cur.col_name] = {
                  list: [{ ...cur }],
                  key: cur.col_name,
                  value: 0,
                };
              }
            }
            return res;
          }, {});
        this.groupByColsVal = {};
        this.groupColFilter = {};
        for (const key in this.groupByCols) {
          this.groupByColsVal[key] = null;
          const groupItem = this.groupByCols[key];
          this.changeGroup(groupItem.value, groupItem.list, key);
          // this.groupByColsVal[key] = this.groupByCols[key]
        }
      }
    },
    async getListV2(serviceName) {
      let app = "lgs";
      if (this.srvReqJson?.mapp) {
        app = this.srvReqJson?.mapp;
      }
      const url = `/${app}/select/srvsys_service_columnex_v2_select?colsel_v2=${serviceName}`;
      const req = {
        serviceName: "srvsys_service_columnex_v2_select",
        colNames: ["*"],
        condition: [
          {
            colName: "service_name",
            value: serviceName,
            ruleType: "eq",
          },
          { colName: "use_type", value: "list", ruleType: "eq" },
        ],
        order: [{ colName: "seq", orderType: "asc" }],
      };
      const res = await $http.post(url, req);
      if (res?.data?.state === "SUCCESS") {
        this.listV2 = res.data.data;
        if (Array.isArray(res.data?.data?.srv_cols)) {
          this._origin_srv_cols = res.data?.data?.srv_cols;
          this.srvCols = res.data?.data?.srv_cols.filter(
            (item) => item.in_list === 1
          );
          if (
            Array.isArray(this.srvReqJson?.group) &&
            this.srvReqJson?.group.length > 0
          ) {
            const srvCols = [];
            this.srvReqJson?.group.forEach((item) => {
              const col = res.data?.data?.srv_cols.find(
                (e) => e.columns === item.colName || e.columns === item.col_name
              );
              if (col) {
                let colInfo = {
                  ...col,
                  columns: item.alias_name || item.col_name,
                  label: item.alias_name || item.label,
                };
                srvCols.push(colInfo);
              }
            });
            this.srvCols = srvCols;
            if (this.config.filter_cols) {
              const filter_cols = this.config.filter_cols.split(",");
              this.filterCols = this.srvCols.filter((item) =>
                filter_cols.includes(item.columns)
              );
              if (this.filterCols.length > 0) {
                this.filterCols.forEach((item) => {
                  this.$set(this.filterModel, item.columns, undefined);
                  if (
                    ["Money", "Float", "Int", "Integer"].includes(
                      item?.col_type
                    )
                  ) {
                    this.$set(item, "value1", undefined);
                    this.$set(item, "value2", undefined);
                  }
                });
              }
            }
          }
          await this.getGroupFields();
        }
      }
    },
    buildListReq(options = {}) {
      const { skipGroupColFilter = false } = options;
      const req = JSON.parse(JSON.stringify(this.srvReqJson));
      req.page = this.page || req.page;
      // 将 condition 规范化为标准格式（colName / ruleType / value）
      req.condition = (req.condition || []).map((item) => ({
        colName: item.colName || item.col_name,
        ruleType: item.ruleType || item.rule_type,
        value: item.value,
      }));
      // 将 group 规范化为标准格式（colName / type / seq / aliasName）
      req.group = (req.group || []).map((item) => ({
        colName: item.colName || item.col_name,
        type: item.type || item.type_stat,
        seq: item.seq,
        aliasName: item.aliasName || item.alias_name,
      }));
      // 将 order 规范化为标准格式（colName / orderType）
      req.order = (req.order || []).map((item) => ({
        colName: item.colName || item.col_name,
        orderType: item.orderType || item.order_type,
      }));
      if (Array.isArray(this.curGroup) && this.curGroup.length > 0) {
        req.group = this.curGroup;
      } else if (this.calcCols?.length) {
        req.group = [...this.calcCols];
      }
      if (Array.isArray(this.filterCols)) {
        const filterCondition = this.filterCols.reduce((res, item) => {
          const obj = { colName: item.columns, ruleType: "like", value: null };
          if (["Money", "Float", "Int", "Integer"].includes(item.col_type)) {
            if (item.value1) {
              const obj1 = { ...obj };
              obj1.ruleType = "ge";
              obj1.value = Number(item.value1);
              res.push(obj1);
            }
            if (item.value2) {
              const obj1 = { ...obj };
              obj1.ruleType = "le";
              obj1.value = Number(item.value2);
              res.push(obj1);
            }
          } else if (item.value !== undefined) {
            if (["DateTime", "Date"].includes(item.col_type)) {
              obj.ruleType = "between";
              obj.value = item.value;
            } else {
              obj.value = item.value;
            }
            res.push(obj);
          }
          return res;
        }, []);
        req.condition = [...(req.condition || []), ...filterCondition];
      }
      // 注入分组列下拉筛选条件（仅对 groupCols.length > 1 时有意义）
      if (
        !skipGroupColFilter &&
        Array.isArray(this.groupCols) &&
        this.groupCols.length > 1
      ) {
        const groupFilterConditions = [];
        const orRelationGroups = [];
        this.groupCols.forEach((gc) => {
          const filter = this.groupColFilter[gc.aliasName || gc.colName];
          if (!filter) return;
          if (
            !Array.isArray(filter.selected) ||
            filter.selected.length === 0 ||
            filter.selected.length === filter.values.length
          ) {
            return; // 未配置筛选或全选态，不加条件
          }
          const values = filter.selected
            .filter((v) => v !== "" && v !== null && v !== undefined)
            .map((v) => v);
          const hasEmpty = filter.selected.some(
            (v) => v === "" || v === null || v === undefined
          );
          if (values.length === 1 && !hasEmpty) {
            groupFilterConditions.push({
              colName: gc.colName,
              ruleType: "eq",
              value: values[0],
            });
          } else if (values.length > 1) {
            // 使用 relation_condition OR 方式替代 condition in
            orRelationGroups.push({
              relation: "OR",
              data: values.map((v) => ({
                colName: gc.colName,
                ruleType: "eq",
                value: v,
              })),
            });
          }
          // 仅选了空值时不下发条件，保持原样
        });
        if (groupFilterConditions.length) {
          req.condition = [
            ...(req.condition || []),
            ...groupFilterConditions,
          ];
        }
        if (orRelationGroups.length > 0) {
          const orCondition =
            orRelationGroups.length === 1
              ? orRelationGroups[0]
              : { relation: "AND", data: orRelationGroups };
          if (req.relation_condition && Object.keys(req.relation_condition).length > 0) {
            req.relation_condition = {
              relation: "AND",
              data: [req.relation_condition, orCondition],
            };
          } else {
            req.relation_condition = orCondition;
          }
        }
      }
      return req;
    },
    // 初始化图表
    initChart() {
      if (this.chartInstance) {
        this.chartInstance.dispose();
      }
      this.chartInstance = echarts.init(this.$refs.chartRef);
      this.updateChart();
      // 监听窗口大小变化
      window.addEventListener("resize", this.handleResize);
    },

    // 处理窗口大小变化
    handleResize() {
      if (this.chartInstance) {
        this.chartInstance.resize();
      }
    },

    // 更新图表
    updateChart() {
      // 如果没有选中的分组字段，销毁图表
      if (!this.hasCols) {
        this.destroyChart();
        return;
      }

      if (
        !this.chartInstance ||
        !this.tableData ||
        this.tableData.length === 0
      ) {
        return;
      }

      // 获取x轴和y轴字段
      const groupCols = this.groupCols.filter(
        (item) => this.groupByCols[item.colName]?.value !== -1
      );
      const xAxisField = this.getMinSeqField(groupCols);
      const calcCols = this.calcCols;
      if (!xAxisField || calcCols.length === 0) {
        return;
      }

      // 检查是否有第二个group字段用于分组
      let groupField = null;
      if (groupCols.length > 1) {
        // 获取seq第二小的字段作为分组字段
        const sortedGroupCols = [...groupCols].sort((a, b) => a.seq - b.seq);
        groupField = sortedGroupCols[1];
      }

      // 处理x轴数据
      const xAxisData = [
        ...new Set(
          this.tableData.map((item) => this.getFieldValue(item, xAxisField))
        ),
      ].sort();

      // 准备图表数据
      let seriesData = [];

      // 预设颜色数组
      const colors = [
        "#5470c6", // 深蓝色
        "#91cc75", // 浅绿色
        "#fac858", // 浅黄色
        "#ee6666", // 浅红色
        "#73c0de", // 浅蓝色
        "#3ba272", // 深绿色
        "#fc8452", // 浅橙色
        "#9a60b4", // 紫色
        "#ea7ccc", // 粉色
        "#5c616c", // 深灰色
        "#597ef7", // 亮蓝色
        "#53d9d1", // 青色
        "#a0a7e6", // 淡紫色
        "#f6b26b", // 橙色
        "#8e7cc3", // 紫罗兰色
        "#6aa84f", // 橄榄绿
        "#e69138", // 深橙色
        "#d5a6bd", // 淡粉色
        "#6fa8dc", // 天蓝色
        "#93c47d", // 薄荷绿
      ];

      if (groupField) {
        const groupValues = [
          ...new Set(
            this.tableData.map((item) => this.getFieldValue(item, groupField))
          ),
        ];

        seriesData = groupValues.map((groupVal, index) => {
          const groupData = this.tableData.filter(
            (item) => this.getFieldValue(item, groupField) === groupVal
          );

          const seriesItemData = xAxisData.map((xVal) => {
            const dataItem = groupData.find(
              (item) => this.getFieldValue(item, xAxisField) === xVal
            );
            const yAxisField = this.getMinSeqField(calcCols);
            return dataItem
              ? parseFloat(this.getFieldValue(dataItem, yAxisField)) || 0
              : 0;
          });

          return this.buildSeriesConfig({
            name: groupVal,
            data: seriesItemData,
            baseColor: colors[index % colors.length],
          });
        });
      } else if (calcCols.length > 1) {
        seriesData = calcCols.map((yAxisField, index) => {
          const seriesItemData = xAxisData.map((xVal) => {
            const dataItem = this.tableData.find(
              (item) => this.getFieldValue(item, xAxisField) === xVal
            );
            return dataItem
              ? parseFloat(this.getFieldValue(dataItem, yAxisField)) || 0
              : 0;
          });

          return this.buildSeriesConfig({
            name:
              yAxisField.aliasName ||
              this.colsMap?.[yAxisField.colName]?.label ||
              yAxisField.colName,
            data: seriesItemData,
            baseColor: colors[index % colors.length],
          });
        });
      } else {
        const yAxisField = this.getMinSeqField(calcCols);
        if (!yAxisField) {
          return;
        }

        const seriesItemData = xAxisData.map((xVal) => {
          const dataItem = this.tableData.find(
            (item) => this.getFieldValue(item, xAxisField) === xVal
          );
          return dataItem
            ? parseFloat(this.getFieldValue(dataItem, yAxisField)) || 0
            : 0;
        });

        seriesData = [
          this.buildSeriesConfig({
            name:
              yAxisField.aliasName ||
              this.colsMap?.[yAxisField.colName]?.label ||
              yAxisField.colName,
            data: seriesItemData,
            baseColor: "#5470c6",
            isSingle: true,
          }),
        ];
      }

      // 设置图表配置
      const yAxisField = this.getMinSeqField(calcCols);

      // 若所有系列的 name 均为数字，则按从小到大排序
      if (
        seriesData.length > 1 &&
        seriesData.every(
          (item) => item.name !== "" && item.name !== null && item.name !== undefined && !isNaN(Number(item.name))
        )
      ) {
        seriesData.sort((a, b) => Number(a.name) - Number(b.name));
      }

      // 强制将 series.name 转为字符串，避免数字类型导致 legend 联动失效（图例显示为灰色）
      seriesData.forEach((item) => {
        item.name = String(item.name);
      });

      // 当系列数量 >= 3 且为柱状图时，默认启用堆叠
      if (seriesData.length >= 3 && this.chartType === "bar" && !this.isStacked) {
        this.isStacked = true;
        seriesData.forEach((item) => {
          item.stack = "stackGroup";
        });
      }

      // 计算堆叠图的最大值
      let maxValue = 0;
      const isStackedChart =
        (this.isStacked && this.chartType === "bar") ||
        (this.chartType === "line" && this.isArea);

      if (isStackedChart && seriesData.length > 0) {
        // 计算每个x轴位置上的堆叠总和
        for (let i = 0; i < xAxisData.length; i++) {
          let stackSum = 0;
          for (let j = 0; j < seriesData.length; j++) {
            stackSum += seriesData[j].data[i] || 0;
          }
          if (stackSum > maxValue) {
            maxValue = stackSum;
          }
        }
      }
      seriesData = seriesData.filter(item => ![null, undefined,""].includes(item.name))
      const option = {
        // title: {
        //   text: this.config.list_title || "",
        //   left: "center",
        // },
        title: {
          text: !this.config.list_title
            ? `${
                xAxisField.aliasName ||
                this.colsMap?.[xAxisField.colName]?.label ||
                xAxisField.colName
              }${
                groupField
                  ? ` - ${
                      yAxisField.aliasName ||
                      this.colsMap?.[yAxisField.colName]?.label ||
                      yAxisField.colName
                    } (按${
                      groupField.aliasName ||
                      this.colsMap?.[groupField.colName]?.label ||
                      groupField.colName
                    }分组)`
                  : calcCols.length > 1
                  ? " (按聚合字段分组)"
                  : ` - ${
                      yAxisField.aliasName ||
                      this.colsMap?.[yAxisField.colName]?.label ||
                      yAxisField.colName
                    }`
              }`
            : null,
          left: "center",
        },
        tooltip: {
          trigger: "axis",
          formatter: (params) => {
            let result = params[0].name + "<br/>";
            params.forEach((item) => {
              const value = parseFloat(item.value);
              // 过滤掉数值为0或没有数值的项
              if (!isNaN(value) && value !== 0) {
                // 处理渐变色情况，获取原始颜色
                let color = item.color;
                if (typeof color === "object" && color.type === "linear") {
                  // 对于渐变色，使用第一个颜色停止点的颜色
                  color = color.colorStops[0].color;
                }
                result +=
                  '<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:' +
                  color +
                  '"></span>';
                result += item.seriesName + ": " + (this.autoFormatNumber ? this.formatNumber(value) : value) + "<br/>";
              }
            });
            return result;
          },
        },
        legend: {
          show: this.showLegend,
          data: seriesData.map((item) => item.name),
          bottom: 0,
        },
        xAxis: {
          type: "category",
          data: xAxisData,
          name:
            xAxisField.aliasName ||
            this.colsMap?.[xAxisField.colName]?.label ||
            xAxisField.colName,
          axisLabel: {
            interval: 0,
            // 标签过长时换行展示，避免被自动隐藏
            formatter: (value) => {
              if (value == null) return "";
              const str = String(value);
              const maxLen = 8;
              if (str.length <= maxLen) return str;
              // 优先在常见分隔符处断行
              const breakChars = ["（", "(", " "];
              for (const ch of breakChars) {
                const idx = str.indexOf(ch);
                if (idx > 0 && idx <= maxLen + 2) {
                  return str.slice(0, idx + 1) + "\n" + this.wrapText(str.slice(idx + 1), maxLen);
                }
              }
              return this.wrapText(str, maxLen);
            },
          },
        },
        yAxis: {
          type: "value",
          name:
            calcCols.length > 1
              ? "数值"
              : yAxisField.aliasName ||
                this.colsMap?.[yAxisField.colName]?.label ||
                yAxisField.colName,
          // max: isStackedChart && maxValue > 0 ? this.getNiceMax(maxValue) : undefined, // 使用合适的最大值
        },
        series: seriesData,
      };
      this.chartInstance.setOption(option, { notMerge: true });
    },

    getFieldValue(item, field) {
      // 兼容 colName 和 aliasName 两种字段名
      return item[field.colName] || item[field.aliasName];
    },

    /**
     * 数值格式化：自动换算单位，支持万、亿级显示
     * @param {number} value 原始数值
     * @returns {string|number} 格式化后的字符串（如 "213.78万"）或原始数字
     */
    formatNumber(value) {
      if (Math.abs(value) >= 100000000) {
        const num = value / 100000000;
        return Number.isInteger(num) ? num + "亿" : num.toFixed(2) + "亿";
      }
      if (Math.abs(value) >= 10000) {
        const num = value / 10000;
        return Number.isInteger(num) ? num + "万" : num.toFixed(2) + "万";
      }
      return value;
    },
    /**
     * 将字符串按 maxLen 宽度换行（字符宽度近似计算，中文算 1 宽度，英文算 0.5）
     * @param {string} text
     * @param {number} maxLen
     * @returns {string} 用 \n 拼接的多行
     */
    wrapText(text, maxLen = 8) {
      if (!text) return "";
      if (text.length <= maxLen) return text;
      const lines = [];
      let line = "";
      let width = 0;
      for (const ch of text) {
        // 中文 / 全角按 1 计，英文 / 数字按 0.5 计
        const w = ch.charCodeAt(0) > 127 ? 1 : 0.5;
        if (width + w > maxLen && line) {
          lines.push(line);
          line = ch;
          width = w;
        } else {
          line += ch;
          width += w;
        }
      }
      if (line) lines.push(line);
      return lines.join("\n");
    },

    /**
     * 表格单元格格式化：仅对数值型字段（Money/Float/Int/Integer）应用单位换算
     * @param {object} row 当前行数据
     * @param {object} column 列配置，包含 col_type 信息
     * @param {any} cellValue 单元格原始值
     * @returns {any} 格式化后的值
     */
    cellValueFormatter(row, column, cellValue) {
      // 优先使用 column 上直接挂载的 col_type，否则通过 colsMap 查找
      const colType = column.col_type || this.colsMap?.[column.property]?.col_type;
      if (["Money", "Float", "Int", "Integer"].includes(colType)) {
        const num = parseFloat(cellValue);
        if (!isNaN(num)) {
          // 根据开关决定是否换算单位
          return this.autoFormatNumber ? this.formatNumber(num) : num;
        }
      }
      return cellValue;
    },

    buildSeriesConfig({ name, data, baseColor, isSingle = false }) {
      const isStackedBar = this.isStacked && this.chartType === "bar";
      const isAreaLine = this.chartType === "line" && this.isArea;

      const config = {
        name,
        type: this.chartType,
        data,
        smooth: this.chartType === "line",
        [isSingle ? "barWidth" : "barMaxWidth"]: 50,
        stack: isStackedBar || isAreaLine ? "stackGroup" : undefined,
      };

      if (this.chartType === "bar") {
        config.color = baseColor;
        config.itemStyle = {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: baseColor },
            { offset: 1, color: baseColor + "80" },
          ]),
        };
      } else if (this.chartType === "line") {
        config.lineStyle = { color: baseColor };
        config.itemStyle = { color: baseColor };
        if (this.isArea) {
          config.areaStyle = {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: baseColor + "80" },
              { offset: 1, color: baseColor + "20" },
            ]),
          };
        }
      }

      return config;
    },

    // 获取seq最小的字段
    getMinSeqField(cols) {
      if (!cols || cols.length === 0) {
        return null;
      }
      return cols.reduce((min, col) => {
        return col.seq < min.seq ? col : min;
      });
    },

    /**
     * 获取一个最合适的最大值
     * @param {number} maxVal 原始最大值
     * @returns {number} 最合适的最大值
     */
    getNiceMax(maxVal) {
      if (maxVal === 0) return 0;

      const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
      const normalized = maxVal / magnitude;

      let niceNormalized;
      if (normalized <= 1) {
        niceNormalized = 1;
      } else if (normalized <= 2) {
        niceNormalized = 2;
      } else if (normalized <= 5) {
        niceNormalized = 5;
      } else {
        niceNormalized = 10;
      }

      return parseFloat((niceNormalized * magnitude).toFixed(2));
    },

    // 销毁图表
    destroyChart() {
      if (this.chartInstance) {
        this.chartInstance.dispose();
        this.chartInstance = null;
        window.removeEventListener("resize", this.handleResize);
      }
    },

    async getList(p) {
      const url = `/${this.srvReqJson.mapp}/select/${this.srvReqJson.serviceName}`;
      const req = this.buildListReq();
      this.onLoading = true;
      const res = await $http.post(url, req);
      this.onLoading = false;

      if (res?.data?.state === "SUCCESS") {
        this.tableData = res.data.data;
        this.page = res.data.page;
        if (res.data.sum_row_data) {
          this.sum_row_data = res.data.sum_row_data;
        } else {
          this.sum_row_data = null;
        }
        this.refreshGroupColFilters();
        this.computeSpanMap();
        // 更新图表
        this.$nextTick(() => {
          this.initChart();
        });
      }
    },
  },
  watch: {
    // 切换合并模式时立即重算并强制 el-table 重新布局
    mergeMode() {
      if (!this.tableData || !this.tableData.length) return;
      this.computeSpanMap();
      // 重新赋值 tableData（数组引用变）以强制 el-table 重新调用 span-method
      this.tableData = [...this.tableData];
      this.$nextTick(() => {
        // 进一步兜底：doLayout 触发布局重算
        if (this.$refs.elTable) {
          this.$refs.elTable.doLayout();
        }
      });
    },
  },
  mounted() {
    if (this.requestNo) {
      // this.getRequestCfg();
      this.getListCfg();
    } else {
      this.$message.error("缺少requestNo参数");
    }
  },

  beforeDestroy() {
    this.destroyChart();
  },
};
</script>

<style lang="scss" scoped>
.group-col-header {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  user-select: none;

  &__icon {
    font-size: 12px;
    color: #909399;
    transition: transform 0.2s, color 0.2s;

    &.is-active {
      color: #409eff;
    }
  }
}

.group-col-filter {
  &__search {
    margin-bottom: 8px;

    ::v-deep .el-input__inner {
      padding-left: 30px;
    }
  }

  &__actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 8px;
    border-bottom: 1px solid #ebeef5;
    margin-bottom: 6px;
  }

  &__list {
    max-height: 240px;
    overflow-y: auto;
  }

  &__item {
    display: flex;
    width: 100%;
    margin-right: 0;
    margin-bottom: 4px;
  }

  &__empty {
    color: #909399;
    font-size: 12px;
    text-align: center;
    padding: 16px 0;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding-top: 8px;
    border-top: 1px solid #ebeef5;
    margin-top: 6px;
  }
}
</style>

<style lang="scss">
.group-col-filter-popover {
  padding: 8px 12px !important;
}
</style>

<style lang="scss" scoped>
.page-wrap {
  padding: 10px;
  overflow: auto;
  background-color: #f5f7fa;
  ::v-deep .el-form-item {
    display: flex;
    margin-right: 10px;
    .el-form-item__content {
      flex: 1;
    }
    .el-date-editor .el-range-separator {
      min-width: 20px;
    }
  }
  .header-box {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  // padding: 20px;
  .el-container {
    // height: 100vh;
    gap: 10px;
  }
  .el-main {
    flex: unset;
    -webkit-box-flex: unset;
    overflow: unset;
    background-color: #fff;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
  .el-footer,
  .el-header {
    background-color: #fff;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
  .el-header {
    display: flex;
    flex-direction: row-reverse;
    align-items: center;
    justify-content: space-between;
    .title {
      flex: 1;
    }
  }

  .title {
    font-size: 18px;
    font-weight: bold;
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
  }

  .table-header {
    background-color: #f0f3f9;
    font-weight: bold;
  }
}

.group-box {
  padding: 0px;
  .group-box-item {
    margin-right: 40px;
    display: inline-block;
    padding: 10px 0;
    // border: 1px solid #eee;
  }
}

.el-input {
}

.el-date-editor.el-range-editor {
  width: 100%;
}

.number-range-input {
  display: flex;

  .marign-lr {
    margin: 0 10px;
  }
}

.chart-container {
  // margin-bottom: 20px;
  padding: 0px;
  // border: 1px solid #eee;
  border-radius: 4px;
  position: relative;

  .chart-header {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-bottom: 10px;
    font-weight: bold;
    gap: 10px;
  }

  .chart-controls {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    padding: 10px 15px;
    background-color: #f5f7fa;
    border-radius: 4px;
    border: 1px solid #e4e7ed;
  }

  .chart-controls-popover {
    position: fixed;
    right: 60px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 1000;
    flex-direction: column;
    align-items: flex-start;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
    min-width: 200px;
    background-color: rgba(245, 247, 250, 0.5);
    backdrop-filter: blur(10px);

    .chart-controls-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      padding-bottom: 8px;
      margin-bottom: 8px;
      border-bottom: 1px solid #e4e7ed;
      font-weight: bold;
      font-size: 14px;
    }

    .chart-controls-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;
      width: 100%;
    }

    .chart-control-item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;

      .control-label {
        min-width: 80px;
        text-align: right;
        font-size: 13px;
        color: #606266;
      }

      .el-switch {
        flex: 1;
      }
    }
  }

  .chart {
    width: 100%;
    height: 400px;
    .chart-dom {
      width: 100%;
      height: 100%;
    }
  }

  .chart-empty-tip {
    width: 100%;
    height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #fafafa;
    border: 1px dashed #d9d9d9;
    border-radius: 4px;
  }

  .chart-settings-btn {
    position: fixed;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 1000;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
      transform: translateY(-50%) scale(1.1);
    }
  }
}
</style>