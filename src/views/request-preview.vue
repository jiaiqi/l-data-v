<template>
  <div class="page-wrap">
    <el-container>
      <el-header style="height: unset">
        <div class="title">
          <div v-if="config && config.list_title">
            {{ config.list_title || "" }}
          </div>
          <div class="title" v-else></div>
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
            v-if="showSettingBtn"
          >
            <i class="el-icon-setting"></i>
          </el-button>
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
                  <!-- <el-input v-model.number="item.value" type="number"
                    v-else-if="['Money', 'Float', 'Int', 'Integer'].includes(item.col_type)"
                    @change="valueChange($event, item)"></el-input> -->
                  <!-- <el-input-number v-model="item.value" clearable label="描述文字"
                    v-else-if="['Money', 'Float'].includes(item.col_type)"
                    @change="valueChange($event, item)"></el-input-number>
                  <el-input-number v-model="item.value" clearable v-else-if="['Int', 'Integer'].includes(item.col_type)"
                    @change="valueChange($event, item)"></el-input-number> -->
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
            min-width="180"
            v-for="column in setSrvCols"
            :key="column.columns"
          >
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
      // 表格合并相关
      mergeMode: "first", // 合并模式：none-不合并，first-只合并首列，all-合并所有符合条件的列
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
        // this.listV2?.srv_cols.filter((item) => {
        //   let group = arr.find(
        //     (g) => g.colName === item.columns || g.col_name === item.columns
        //   );
        //   if (group?.seq) {
        //     item.seq = group.seq;
        //   }
        //   return !!group;
        // });
        return srvCols.sort((a, b) => a.seq - b.seq);
      }
    },
  },
  methods: {
    /**
     * 跳转请求定义详情页
     */
    toReqSetting() {
      const reqNo= this.config.default_srv_req_no;
      if(!reqNo){
        alert("请先配置默认请求");
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
      return;
      if (!this.tableData?.length) {
        alert("表格数据为空");
        return;
      } else {
        let time = dayjs().format("-YYYYMMDDHHmmss");
        let fileName = this.config.list_title + time + ".xlsx";
        // 将预览表格中的数据导出为excel
        let wb = XLSX.utils.table_to_book(this.$refs.elTable?.$el);
        XLSX.writeFile(wb, `${fileName}.xlsx`);
        /* 获取二进制字符串作为输出 */
        // let wbout = XLSX.write(wb, {
        //   bookType: "xlsx",
        //   bookSST: true,
        //   type: "array",
        // });
        // try {
        //   FileSaver.saveAs(
        //     //Blob 对象表示一个不可变、原始数据的类文件对象。
        //     //Blob 表示的不一定是JavaScript原生格式的数据。
        //     //File 接口基于Blob，继承了 blob 的功能并将其扩展使其支持用户系统上的文件。
        //     //返回一个新创建的 Blob 对象，其内容由参数中给定的数组串联组成。
        //     new Blob([wbout], { type: "application/octet-stream" }),
        //     //设置导出文件名称
        //     fileName
        //   );
        //   this.tableExportStatus = true;
        // } catch (e) {}
        // return wbout;
      }
    },
    resetFilter() {
      this.filterCols = this.filterCols.map((item) => {
        item.value = undefined;
        return item;
      });
    },
    valueChange(e, columnInfo) {
      console.log(e, columnInfo);
      console.log(this.filterModel);
      // if (['Money', 'Float', 'Int', 'Integer'].includes(columnInfo?.col_type) && (!columnInfo.value1 || !columnInfo.value2) && ((columnInfo.value1 || columnInfo.value2))) {
      //   return
      // }
      this.getList();
    },
    clickRadio(e, key, index) {
      console.log(key, index);
      if (this.groupByCols[key].value === index) {
        e.preventDefault();

        this.groupByCols[key].value = -1;
        this.$set(this.groupByCols[key], "value", -1);
        // this.curGroup = this.curGroup.filter((item) => item.colName !== key);
        // if (
        //   Object.keys(this.groupByCols).every(
        //     (key) =>
        //       (typeof this.groupByCols[key]?.value === "number" &&
        //         this.groupByCols[key]?.value > -1) ||
        //       this.groupByCols[key]?.value !== "number"
        //   )
        // ) {
        //   this.curGroup = [];
        // }
        // this.getList();
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
    objectSpanMethod({ row, column, rowIndex, columnIndex }) {
      // 不合并模式
      if (this.mergeMode === "none") {
        return;
      }

      const colName = column.property;
      // 只有group type是by的字段可以合并
      const isMergeCol = this.groupCols.find(
        (item) => item.colName === colName
      );

      // 只合并首列模式
      if (this.mergeMode === "first") {
        // 获取所有可合并列
        const mergeCols = this.groupCols.map((item) => item.colName);
        // 只处理首列
        if (mergeCols.length > 0 && colName === mergeCols[0]) {
          // 首列合并逻辑
          const currentValue = row[colName];
          let rowspan = 1;
          // 遍历之后的行，判断是否需要合并
          for (let i = rowIndex + 1; i < this.tableData.length; i++) {
            const nextRow = this.tableData[i];
            if (nextRow[colName] === currentValue) {
              rowspan++;
            } else {
              break;
            }
          }

          // 遍历之前的行 跟上一行的值一样 则和上一行合并 rowspan置为0
          for (let i = rowIndex - 1; i >= 0; i--) {
            const previousRow = this.tableData[i];
            if (previousRow[colName] === currentValue) {
              rowspan = 0;
            } else {
              break;
            }
          }
          // 返回合并的行数和列数
          return {
            rowspan,
            colspan: 1,
          };
        }
        return;
      }

      // 合并所有符合条件的列模式
      if (this.mergeMode === "all" && isMergeCol) {
        const currentValue = row[colName];
        let rowspan = 1;
        // 遍历之后的行，判断是否需要合并
        for (let i = rowIndex + 1; i < this.tableData.length; i++) {
          const nextRow = this.tableData[i];
          if (nextRow[colName] === currentValue) {
            rowspan++;
          } else {
            break;
          }
        }

        // 遍历之前的行 跟上一行的值一样 则和上一行合并 rowspan置为0
        for (let i = rowIndex - 1; i >= 0; i--) {
          const previousRow = this.tableData[i];
          if (previousRow[colName] === currentValue) {
            rowspan = 0;
          } else {
            break;
          }
        }
        // 返回合并的行数和列数
        return {
          rowspan,
          colspan: 1,
        };
      }
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
              // this.config = JSON.parse(config.default_srv_req_json)
              this.srvReqJson = JSON.parse(config.default_srv_req_json);
            } catch (error) {}
          }

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
            // this.srvCols = res.data?.data?.srv_cols.filter((item) => {
            //   let groupItem = this.srvReqJson?.group.find(
            //     (e) => item.columns === e.colName || item.columns === e.col_name
            //   );
            //   if (groupItem?.colName) {
            //     if (groupItem.aliasName) {
            //       // item.columns = groupItem.aliasName
            //     }
            //     return true;
            //   }
            // });
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
    buildListReq() {
      const req = JSON.parse(JSON.stringify(this.srvReqJson));
      req.page = this.page || req.page;
      delete req.group;
      if (Array.isArray(this.curGroup) && this.curGroup.length > 0) {
        req.group = this.curGroup;
      } else if (this.calcCols?.length) {
        req.group = [...this.calcCols];
        // req.group = [...this.groupCols, ...this.calcCols]
      }
      if (Array.isArray(this.filterCols)) {
        const condition = this.filterCols.reduce((res, item) => {
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
        // const condition = this.filterCols.filter(item => {
        //   if (['Money', 'Float', 'Int', 'Integer'].includes(item.col_type)) {
        //     if (!isNaN(Number(item.value1)) && !isNaN(Number(item.value2))) {
        //       item.value = [item.value1, item.value2]
        //     } else {
        //       item.value = undefined
        //     }
        //   }
        //   if (item.value !== undefined) {
        //     const obj = { colName: item.columns, ruleType: 'like', value: null }
        //     if (['Money', 'Float', 'Int', 'Integer', 'Date'].includes(item.col_type)) {
        //       obj.ruleType = 'between'
        //     }
        //     // if (item.col_type === 'Date') {
        //     //   obj.value = item.value.toString()
        //     // } else {
        //     obj.value = item.value
        //     // }
        //     return obj
        //   }
        // }).filter(item => item?.colName)
        req.condition = [...(req.condition || []), ...condition];
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
          this.tableData.map(
            (item) => item[xAxisField.colName] || item[xAxisField.aliasName]
          )
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
        // 有第二个分组字段，按分组字段拆分数据为多个系列
        const groupValues = [
          ...new Set(
            this.tableData.map(
              (item) => item[groupField.colName] || item[groupField.aliasName]
            )
          ),
        ];

        // 为每个分组创建一个系列
        seriesData = groupValues.map((groupVal, index) => {
          // 筛选当前分组的数据
          const groupData = this.tableData.filter(
            (item) =>
              (item[groupField.colName] || item[groupField.aliasName]) ===
              groupVal
          );

          // 准备当前系列的数据，确保与x轴数据顺序一致
          const seriesItemData = xAxisData.map((xVal) => {
            const dataItem = groupData.find(
              (item) =>
                (item[xAxisField.colName] || item[xAxisField.aliasName]) ===
                xVal
            );
            const yAxisField = this.getMinSeqField(calcCols);
            return dataItem
              ? parseFloat(
                  dataItem[yAxisField.colName] || dataItem[yAxisField.aliasName]
                ) || 0
              : 0;
          });

          const baseColor = colors[index % colors.length];

          // 创建渐变色配置
          const seriesConfig = {
            name: groupVal,
            type: this.chartType,
            data: seriesItemData,
            smooth: this.chartType === "line",
            barMaxWidth: 50,
            stack:
              (this.isStacked && this.chartType === "bar") ||
              (this.chartType === "line" && this.isArea)
                ? "stackGroup"
                : undefined,
          };

          // 柱状图渐变
          if (this.chartType === "bar") {
            seriesConfig.itemStyle = {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: baseColor },
                { offset: 1, color: baseColor + "80" },
              ]),
            };
          }
          // 折线图渐变
          else if (this.chartType === "line") {
            seriesConfig.lineStyle = {
              color: baseColor,
            };
            seriesConfig.itemStyle = {
              color: baseColor,
            };
            // 面积图渐变
            if (this.isArea) {
              seriesConfig.areaStyle = {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: baseColor + "80" },
                  { offset: 1, color: baseColor + "20" },
                ]),
              };
            }
          }

          return seriesConfig;
        });
      } else if (calcCols.length > 1) {
        // 只有一个分组字段，但有多个聚合字段，按不同聚合字段分组
        seriesData = calcCols.map((yAxisField, index) => {
          // 准备当前系列的数据，确保与x轴数据顺序一致
          const seriesItemData = xAxisData.map((xVal) => {
            const dataItem = this.tableData.find(
              (item) =>
                (item[xAxisField.colName] || item[xAxisField.aliasName]) ===
                xVal
            );
            return dataItem
              ? parseFloat(
                  dataItem[yAxisField.colName] || dataItem[yAxisField.aliasName]
                ) || 0
              : 0;
          });

          const baseColor = colors[index % colors.length];

          // 创建渐变色配置
          const seriesConfig = {
            name:
              yAxisField.aliasName ||
              this.colsMap?.[yAxisField.colName]?.label ||
              yAxisField.colName,
            type: this.chartType,
            data: seriesItemData,
            smooth: this.chartType === "line",
            barMaxWidth: 50,
            stack:
              (this.isStacked && this.chartType === "bar") ||
              (this.chartType === "line" && this.isArea)
                ? "stackGroup"
                : undefined,
          };

          // 柱状图渐变
          if (this.chartType === "bar") {
            seriesConfig.itemStyle = {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: baseColor },
                { offset: 1, color: baseColor + "80" },
              ]),
            };
          }
          // 折线图渐变
          else if (this.chartType === "line") {
            seriesConfig.lineStyle = {
              color: baseColor,
            };
            seriesConfig.itemStyle = {
              color: baseColor,
            };
            // 面积图渐变
            if (this.isArea) {
              seriesConfig.areaStyle = {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: baseColor + "80" },
                  { offset: 1, color: baseColor + "20" },
                ]),
              };
            }
          }

          return seriesConfig;
        });
      } else {
        // 只有一个分组字段和一个聚合字段，使用单个系列
        const yAxisField = this.getMinSeqField(calcCols);
        if (!yAxisField) {
          return;
        }

        // 准备数据，确保与x轴数据顺序一致
        const seriesItemData = xAxisData.map((xVal) => {
          const dataItem = this.tableData.find(
            (item) =>
              (item[xAxisField.colName] || item[xAxisField.aliasName]) === xVal
          );
          return dataItem
            ? parseFloat(
                dataItem[yAxisField.colName] || dataItem[yAxisField.aliasName]
              ) || 0
            : 0;
        });

        const baseColor = "#5470c6";

        // 创建渐变色配置
        const seriesConfig = {
          name:
            yAxisField.aliasName ||
            this.colsMap?.[yAxisField.colName]?.label ||
            yAxisField.colName,
          type: this.chartType,
          data: seriesItemData,
          smooth: this.chartType === "line",
          barWidth: 50,
          stack:
            (this.isStacked && this.chartType === "bar") ||
            (this.chartType === "line" && this.isArea)
              ? "stackGroup"
              : undefined,
        };

        // 柱状图渐变
        if (this.chartType === "bar") {
          seriesConfig.itemStyle = {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: baseColor },
              { offset: 1, color: baseColor + "80" },
            ]),
          };
        }
        // 折线图渐变
        else if (this.chartType === "line") {
          seriesConfig.lineStyle = {
            color: baseColor,
          };
          seriesConfig.itemStyle = {
            color: baseColor,
          };
          // 面积图渐变
          if (this.isArea) {
            seriesConfig.areaStyle = {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: baseColor + "80" },
                { offset: 1, color: baseColor + "20" },
              ]),
            };
          }
        }

        seriesData = [seriesConfig];
      }

      // 设置图表配置
      const yAxisField = this.getMinSeqField(calcCols);

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
          formatter: function (params) {
            let result = params[0].name + "<br/>";
            params.forEach(function (item) {
              // 过滤掉数值为0或没有数值的项
              const value = parseFloat(item.value);
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
                result += item.seriesName + ": " + value + "<br/>";
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
          this.tableData.push();
        } else {
          this.sum_row_data = null;
        }
        // 更新图表
        this.$nextTick(() => {
          this.initChart();
        });
      }
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