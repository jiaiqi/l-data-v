<template>
  <div class="page-wrap">

    <el-container>
      <el-header style="height: unset;">
        <div class="title" v-if="config && config.list_title">
          {{ config.list_title || '' }}
        </div>
        <!-- 分组 -->
        <div class="group-box" v-if="groupByCols">
          <div class="group-box-item" v-for="(groupItem, key) in groupByCols">
            <el-radio-group @input="changeGroup($event, groupItem.list, key)" v-model="groupItem.value">
              <el-radio :label="index" :value="item.col_name" v-for="(item, index) in groupItem.list"
                @click.native="clickRadio($event, key, index)">
                <span>{{ item.label }}</span>
              </el-radio>
            </el-radio-group>
          </div>
        </div>
        <!-- 筛选 -->
        <div v-if="filterCols && filterCols.length > 0">
          <el-form ref="form" :model="filterModel" label-width="120px">
            <el-row>
              <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="4" v-for="(item,index) in filterCols" :key="index">
                <el-form-item :label="item.label">
                  <el-date-picker value-format="yyyy-MM-dd" v-model="item.value" type="daterange" range-separator="至"
                    start-placeholder="开始日期" end-placeholder="结束日期" v-if="item.col_type === 'Date'"
                    @change="valueChange($event, item)">
                  </el-date-picker>
                  <el-input v-model="item.value" clearable
                    v-else-if="item.col_type === 'String' || (item.col_type && item.col_type.indexOf('bx') === 0)"
                    @change="valueChange($event, item)"></el-input>
                  <!-- <el-input v-model.number="item.value" type="number"
                    v-else-if="['Money', 'Float', 'Int', 'Integer'].includes(item.col_type)"
                    @change="valueChange($event, item)"></el-input> -->
                  <!-- <el-input-number v-model="item.value" clearable label="描述文字"
                    v-else-if="['Money', 'Float'].includes(item.col_type)"
                    @change="valueChange($event, item)"></el-input-number>
                  <el-input-number v-model="item.value" clearable v-else-if="['Int', 'Integer'].includes(item.col_type)"
                    @change="valueChange($event, item)"></el-input-number> -->
                  <div class="number-range-input"
                    v-else-if="['Money', 'Float', 'Int', 'Integer'].includes(item.col_type)">
                    <el-input v-model.number="item.value1" clearable @change="valueChange($event, item)"
                      type="number"></el-input>
                    <span class="marign-lr">-</span>
                    <el-input v-model.number="item.value2" clearable @change="valueChange($event, item)"
                      type="number"></el-input>
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
      <!-- <div v-else style="height: 0;flex-shrink:0;box-sizing:border-box;"></div> -->
      <el-main>

        <!-- 数据 -->
        <el-table :data="tableData" border stripe style="width: 100%" :span-method="objectSpanMethod"
          v-loading="onLoading" :header-cell-style="{
            background: '#f0f3f9',
            'font-weight': 'bold',
            color: '#000',
          }">
          <el-table-column :prop="column.columns" :label="column.label" min-width="180" v-for="column in setSrvCols" :key="column.columns">
          </el-table-column>
        </el-table>
      </el-main>
      <el-footer v-if="page" style="padding: 20px; text-align: center">
        <el-pagination @size-change="handleSizeChange" @current-change="handleCurrentChange" :current-page="page.pageNo"
          :page-sizes="[10, 20, 50, 100]" :page-size="page.pageSize" layout="total, sizes, prev, pager, next, jumper"
          :total="page.total">
        </el-pagination>
      </el-footer>
    </el-container>
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
      groupByCols: {}, // 分组字段 可能重复
      groupByColsVal: {},
      onLoading: false,
      curGroup: null,
      current: "",
      filterCols: [],
      sum_row_data: {}
    };
  },
  computed: {
    filterModel() {
      if (Array.isArray(this.filterCols) && this.filterCols.length > 0) {
        return this.filterCols.reduce((res, cur) => {
          res[cur.columns] = cur.value
          return res
        }, {})
      }
    },
    requestNo() {
      return this.$route.query?.requestNo;
    },
    serviceName() {
      return this.srvReqJson?.serviceName;
    },
    setSrvCols() {
      if (this.groupByCols && Array.isArray(this.listV2?.srv_cols) && this.listV2?.srv_cols.length > 0) {
        let arr = this.srvReqJson?.group || []
        arr = arr.filter(item => item.type && item.type.indexOf('by') == -1)
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
                } catch (error) { }
              }
            }
          }
        }
        return this.listV2?.srv_cols.filter(item => {
          let group = arr.find(g => g.colName === item.columns)
          if (group?.seq) {
            item.seq = group.seq
          }
          return !!group
        }).sort((a, b) => a.seq - b.seq)
      }
    },
  },
  methods: {
    resetFilter() {
      this.filterCols = this.filterCols.map(item => {
        item.value = undefined
        return item
      })
    },
    valueChange(e, columnInfo) {
      console.log(e, columnInfo);
      console.log(this.filterModel)
      // if (['Money', 'Float', 'Int', 'Integer'].includes(columnInfo?.col_type) && (!columnInfo.value1 || !columnInfo.value2) && ((columnInfo.value1 || columnInfo.value2))) {
      //   return
      // }
      this.getList()
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
        this.changeGroup()
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
                groupList.push(group);
              } catch (error) { }
            }
          }
        }
      }
      this.curGroup = [...groupList, ...this.calcCols];
      this.getList();
    },
    objectSpanMethod({ row, column, rowIndex, columnIndex }) {
      const colName = column.property;
      // 只有group type是by的字段可以合并
      if (this.groupCols.find((item) => item.colName === colName)) {
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
        condition: [{
          colName: 'list_no',
          ruleType: 'eq',
          value: this.requestNo
        }],
        page: { pageNo: 1, rownumber: 1 },
      };
      this.$http.post(url, req).then((res) => {
        if (res?.data?.state === "SUCCESS" && res.data.data.length > 0) {
          const config = res.data.data[0];
          if (config?.default_srv_req_json) {
            try {
              this.config = {
                ...config,
                srv_req_no: config.default_srv_req_no,
                filter_cols: config.filter_cols,

              }
              // this.config = JSON.parse(config.default_srv_req_json)
              this.srvReqJson = JSON.parse(config.default_srv_req_json)

            } catch (error) {

            }
          }

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
    getRequestCfg() {
      const url = "/config/select/srvpage_cfg_srv_call_select";
      const req = {
        serviceName: "srvpage_cfg_srv_call_select",
        colNames: ["*"],
        condition: [
          { colName: "srv_call_no", ruleType: "like", value: this.requestNo },
        ],
        page: { pageNo: 1, rownumber: 1 }
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
            value: this.config?.srv_req_no || this.requestNo,
          },
        ],
      };
      const res = await this.$http.post(url, req);
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
              colName: item.col_name,
              type: item.type_stat,
            };
          });
        this.groupCols = groupFields
          .filter((item) => item.type_stat === "by")
          .map((item) => {
            return {
              colName: item.col_name,
              type: item.type_stat,
            };
          });
        this.groupByCols = groupFields
          .filter((item) => groupType.includes(item.type_stat))
          .reduce((res, cur) => {
            let fieldInfo = this.srvCols.find(
              (item) => item.columns === cur.col_name
            );
            if (fieldInfo) {
              cur.label = `按${fieldInfo.label}`;
              switch (cur.type_stat) {
                case "by_year":
                  cur.label = "按年";
                  break;
                case "by_month":
                case "by_month_of_year":
                  cur.label = "按月";
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
                  value: -1,
                };
              }
            }
            return res;
          }, {});
        this.groupByColsVal = {};
        for (const key in this.groupByCols) {
          this.groupByColsVal[key] = null;
          // this.groupByColsVal[key] = this.groupByCols[key]
        }
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
            if (this.config.filter_cols) {
              const filter_cols = this.config.filter_cols.split(',')
              this.filterCols = this.srvCols.filter((item) => filter_cols.includes(item.columns))
              if (this.filterCols.length > 0) {
                this.filterCols.forEach(item => {
                  this.$set(this.filterModel, item.columns, undefined)
                  if (['Money', 'Float', 'Int', 'Integer'].includes(item?.col_type)) {
                    this.$set(item, 'value1', undefined)
                    this.$set(item, 'value2', undefined)
                  }
                })
              }
            }
            await this.getGroupFields();
          }
        }
      }
    },
    async getList(p) {
      const url = `/${this.srvReqJson.mapp}/select/${this.srvReqJson.serviceName}`;
      const req = JSON.parse(JSON.stringify(this.srvReqJson));
      req.page = this.page || req.page;
      delete req.group;
      if (Array.isArray(this.curGroup) && this.curGroup.length > 0) {
        req.group = this.curGroup;
      } else {
        // req.group = [...this.groupCols, ...this.calcCols]
      }
      if (Array.isArray(this.filterCols)) {
        const condition = this.filterCols.reduce((res, item) => {
          const obj = { colName: item.columns, ruleType: 'like', value: null }
          if (['Money', 'Float', 'Int', 'Integer'].includes(item.col_type)) {
            if (item.value1) {
              const obj1 = { ...obj }
              obj1.ruleType = 'ge'
              obj1.value = Number(item.value1)
              res.push(obj1)
            }
            if (item.value2) {
              const obj1 = { ...obj }
              obj1.ruleType = 'le'
              obj1.value = Number(item.value2)
              res.push(obj1)
            }
          } else if (item.value !== undefined) {
            if (item.col_type === 'Date') {
              obj.ruleType = 'between'
              obj.value = item.value
            } else {
              obj.value = item.value
            }
            res.push(obj)

          }
          return res
        }, [])
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
        req.condition = [...req.condition, ...condition]
      }
      this.onLoading = true;
      const res = await this.$http.post(url, req);
      this.onLoading = false;

      if (res?.data?.state === "SUCCESS") {
        this.tableData = res.data.data;
        this.page = res.data.page;
        if (res.data.sum_row_data) {
          this.sum_row_data = res.data.sum_row_data
          this.tableData.push()
        } else {
          this.sum_row_data = null
        }
      }
    },
  },
  mounted() {
    if (this.requestNo) {
      // this.getRequestCfg();
      this.getListCfg()
    } else {
      this.$message.error("缺少requestNo参数");
    }
  },
};
</script>

<style lang="scss" scoped>
.page-wrap {

  // padding: 20px;
  .el-container {
    height: 100vh;
  }

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
  padding: 0 10px;
  margin-bottom: 10px;

  .group-box-item {
    margin-right: 20px;
    display: inline-block;
    padding: 10px;
    // border: 1px solid #eee;
  }
}

.el-input {}

.el-date-editor.el-range-editor {
  width: 100%;
}

.number-range-input {
  display: flex;

  .marign-lr {
    margin: 0 10px;
  }
}</style>
