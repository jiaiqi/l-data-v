<template>
  <div class="page-wrap">
    <!-- 标题 -->
    <div class="title" v-if="config && config.srv_req_name">
      {{ config.srv_req_name }}
    </div>
    <!-- 筛选项 -->
    <div class="group-box" v-if="groupByCols">
      <div class="group-box-item" v-for="cols in groupByCols">
        <el-radio-group @input="changeGroup($event, cols)" v-model="current">
          <el-radio :label="index" :value="item.col_name" v-for="(item, index) in cols">{{
            item.label }}</el-radio>
        </el-radio-group>
      </div>
    </div>
    <!-- 过滤条件 -->
    <div></div>

    <!-- 表格 -->
    <el-table :data="tableData" border stripe style="width: 100%" :span-method="objectSpanMethod" v-loading="onLoading"
      :header-cell-style="{ 'background': '#f0f3f9', 'font-weight': 'bold', 'color': '#000' }">
      <el-table-column :prop="column.columns" :label="column.label" min-width="180" v-for="column in srvCols">
      </el-table-column>
    </el-table>

    <div v-if="page" style="padding: 20px;text-align: center;">
      <el-pagination @size-change="handleSizeChange" @current-change="handleCurrentChange" :current-page="page.pageNo"
        :page-sizes="[10, 20, 50, 100]" :page-size="page.pageSize" layout="total, sizes, prev, pager, next, jumper"
        :total="page.total">
      </el-pagination>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      config: null,
      srvReqJson: null,
      tableData: [],
      listV2: null,
      srvCols: [],
      page: null,
      groupCols: [],
      calcCols: [],
      groupByCols: {},// 分组字段 可能重复
      onLoading: false,
      curGroup: null,
      current:"",
    };
  },
  computed: {
    requestNo() {
      return this.$route.query?.requestNo;
    },
    serviceName() {
      return this.srvReqJson?.serviceName;
    },
  },
  methods: {
    changeGroup(val, cols) {
      if (typeof val === 'number' && Array.isArray(cols) && cols.length > val) {
        const info = cols[val]
        if (info.row_json) {
          try {
            let group = JSON.parse(info.row_json)
            this.curGroup = [group, ...this.groupCols, ...this.calcCols]
            // this.getList({ group: [group, ...this.groupCols, ...this.calcCols] })
            this.getList()
          } catch (error) {

          }
        }
      }

    },
    objectSpanMethod({ row, column, rowIndex, columnIndex }) {
      const colName = column.property;
      // 只有group type是by的字段可以合并
      if (this.groupCols.find(item => item.colName === colName)) {
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
          colspan: 1
        }
      }
    },
    handleSizeChange(val) {
      this.page.pageSize = val
      this.getList()
    },
    handleCurrentChange(val) {
      this.page.pageNo = val
      this.getList()
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
        query_source: "list_page",
      };
      this.$http.post(url, req).then((res) => {
        if (res?.data?.state === "SUCCESS" && res.data.data.length > 0) {
          this.config = res.data.data[0];
          try {
            this.srvReqJson = JSON.parse(this.config?.srv_req_json);
          } catch (error) { }
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
            value: this.requestNo,
          },
        ],
      };
      const res = await this.$http.post(url, req);
      if (Array.isArray(res.data.data)) {
        let groupFields = res.data.data;
        let cols = res.data.data.reduce((res, cur) => {
          if (!res.find(item => item.columns === cur.col_name)) {
            let col = this.srvCols.find(e => e.columns === cur.col_name)
            if (col) {
              res.push(col)
            }
          }
          return res

        }, [])
        this.srvCols = cols
        const groupType = [
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
        this.calcCols = groupFields.filter((item) => calcType.includes(item.type_stat)).map(item => {
          return {
            colName: item.col_name,
            type: item.type_stat
          }
        });
        this.groupCols = groupFields.filter((item) => item.type_stat === "by").map(item => {
          return {
            colName: item.col_name,
            type: item.type_stat
          }
        })
        this.groupByCols = groupFields
          .filter((item) => groupType.includes(item.type_stat))
          .reduce((res, cur) => {
            let fieldInfo = this.srvCols.find(
              (item) => item.columns === cur.col_name
            );
            if (fieldInfo) {
              cur.label = `按${fieldInfo.label}`;
              switch (cur.type_stat) {
                case 'by_year':
                  cur.label = '按年';
                  break;
                case 'by_month':
                case "by_month_of_year":
                  cur.label = '按月';
                  break;
                case 'by_week':
                case "by_week_of_year":
                  cur.label = '按周';
                  break;
                case 'by_date':
                case "by_date_of_year":
                  cur.label = '按日';
                  break;
              }
              if (res[cur.col_name]) {
                res[cur.col_name].push({ ...cur });
              } else {
                res[cur.col_name] = [{ ...cur }];
              }
            }
            return res;
          }, {});
      }
    },
    async getListV2(serviceName) {
      const url = `/lgs/select/srvsys_service_columnex_v2_select?colsel_v2=${serviceName}`;
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
      const res = await this.$http.post(url, req);
      if (res?.data?.state === "SUCCESS") {
        this.listV2 = res.data.data;
        if (Array.isArray(res.data?.data?.srv_cols)) {
          this.srvCols = res.data?.data?.srv_cols.filter(
            (item) => item.in_list === 1
          );

          if (
            Array.isArray(this.srvReqJson?.group) &&
            this.srvReqJson?.group.length > 0
          ) {

            this.srvCols = res.data?.data?.srv_cols.filter((item) => {
              let groupItem = this.srvReqJson?.group.find(
                (e) => item.columns === e.colName
              );
              if (groupItem?.colName) {
                if (groupItem.aliasName) {
                  // item.columns = groupItem.aliasName
                }
                return true;
              }
            });
            await this.getGroupFields();
          }
        }
      }
    },
    async getList(p) {
      const url = `/${this.srvReqJson.mapp}/select/${this.srvReqJson.serviceName}`;
      const req = this.srvReqJson;
      req.page = this.page || req.page
      delete req.group;
      if (Array.isArray(this.curGroup) && this.curGroup.length > 0) {
        req.group = this.curGroup
      } else {
        // req.group = [...this.groupCols, ...this.calcCols]
      }
      this.onLoading = true
      const res = await this.$http.post(url, req)
      this.onLoading = false

      if (res?.data?.state === "SUCCESS") {
        this.tableData = res.data.data;
        this.page = res.data.page;
      }
    },
  },
  mounted() {
    if (this.requestNo) {
      this.getRequestCfg();
    } else {
      this.$message.error("缺少requestNo参数");
    }
  },
};
</script>

<style lang="scss" scoped>
.page-wrap {
  padding: 20px;

  .title {
    font-size: 18px;
    font-weight: bold;
  }

  .table-header {
    background-color: #f0f3f9;
    font-weight: bold;
  }
}

.group-box {
  padding: 10px;

  .group-box-item {
    margin-right: 20px;
    display: inline-block;
    padding: 10px;
    // border: 1px solid #eee;
  }
}
</style>
