<template>
  <div class="hual">
    <el-card class="select-box" shadow="hover">
      <el-form
        ref="ruleForm"
        label-width="120px"
        :model="ruleForm"
        size="small"
      >
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item
              label="接口名称："
              prop="srv_req_name"
              :rules="[
                {
                  required: true,
                  message: '请输入接口调用名称',
                  trigger: 'blur',
                },
              ]"
            >
              <el-input
                v-model="ruleForm.srv_req_name"
                placeholder="请输入接口名称"
                clearable
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item
              label="应用名称："
              prop="app_name"
              :rules="[
                { required: true, message: '请输入应用名称', trigger: 'blur' },
              ]"
            >
              <el-select
                v-model="ruleForm.mapp"
                placeholder="请选择应用名称"
                @change="getServiceName()"
                clearable
                filterable
                style="width: 100%"
              >
                <el-option
                  v-for="item in allApp"
                  :key="item.value"
                  :label="item.app_name"
                  :value="item.app_no"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item
              label="接口类型："
              prop="srv_type"
              :rules="[
                { required: true, message: '请选择接口类型', trigger: 'blur' },
              ]"
            >
              <el-select
                v-model="ruleForm.srv_type"
                placeholder="请选择接口类型"
                clearable
                filterable
                style="width: 100%"
              >
                <el-option
                  v-for="item in srvTypeList"
                  :disabled="item !== 'select'"
                  :key="item"
                  :label="item"
                  :value="item"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item
              label="服务名称："
              prop="service_name"
              :rules="[
                { required: true, message: '请选择服务名称', trigger: 'blur' },
              ]"
            >
              <el-select
                v-model="ruleForm.service_name"
                placeholder="请选择服务名称"
                clearable
                filterable
                @change="getColumns()"
                style="width: 100%"
              >
                <el-option
                  v-for="item in allService"
                  :key="item.value"
                  :label="item.service_view_name"
                  :value="item.service_name"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="16">
            <el-form-item label="请求参数：" prop="request_params">
              <el-checkbox-group
                v-model="checkedReqOptions"
                @change="changeReqOption"
                size="small"
              >
                <el-checkbox
                  v-for="option in ReqOptions"
                  :label="option"
                  :key="option"
                  name="type"
                ></el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <el-card class="columns-box">
      <div class="content-box">
        <div class="column-box">
          <column-box
            :singList="allColum"
            :allow-check="true"
            :checkedColumns.sync="checkedColumns"
          ></column-box>
        </div>
        <div class="condition-box">
          <div
            class="sing_hual"
            v-for="(item, index) in listData"
            :key="index"
            v-show="item.show"
          >
            <column-box
              ref="child"
              @save="requestData"
              :singList="item"
              :endData="endData"
            ></column-box>
          </div>
        </div>
      </div>
    </el-card>

    <div class="btn-box">
      <el-button @click="previewData" type="success" icon="el-icon-view"
        >预览</el-button
      >
      <el-button @click="saveConfig" type="primary" icon="el-icon-upload"
        >保存</el-button
      >
    </div>

    <el-card class="preview-box" shadow="hover">
      <div slot="header" class="preview-title">
        <div class="title">数据预览</div>
        <el-button
          @click="exportExcel"
          type="primary"
          size="small"
          icon="el-icon-download"
          class="export-button"
          >导出为Excel</el-button
        >
      </div>
      <div class="preview-content">
        <el-table
          :data="tableData"
          style="width: 100%"
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
            ></el-table-column>
          </template>
        </el-table>
        <div class="empty-data" v-if="!tableData || !tableData.length">
          <i class="el-icon-data-analysis"></i>
          <p>暂无数据，请点击预览按钮获取数据或检查请求参数是否正确</p>
        </div>
      </div>
      <div class="pagination">
        <el-pagination
          @size-change="previewDataSizeChange"
          @current-change="previewDataCurrentChange"
          :current-page="previewInfo.currentPage"
          :page-sizes="[10, 50, 100, 200]"
          :page-size="previewInfo.rowNum"
          layout="total, sizes, prev, pager, next, jumper"
          :total="previewInfo.totalPage"
          background
          v-if="tableData.length > 0"
        ></el-pagination>
      </div>
    </el-card>
  </div>
</template>

<script>
import { Loading } from "element-ui";
import columnBox from "@/components/column-box.vue";
import dayjs from "dayjs";
import FileSaver from "file-saver";
import * as XLSX from "xlsx";
export default {
  name: "RequestBuilder",
  components: {
    columnBox,
  },
  data() {
    return {
      srv_call_no: "",
      reqConfig: null,
      requestBody: {},
      childData: {
        order: [],
        condition: [],
        group: [],
        column: [],
      },
      checkedColumns: [],
      ruleForm: {
        serviceName: "",
        srv_req_name: "", //接口调用名称
        mapp: "", //微服务
        service_name: "",
        srv_type: "select", //接口类型
      },
      srvTypeList: ["select", "add", "delete", "update", "operate", "apply"],
      allColum: {
        type: "all",
        name: "字段",
        list: [],
        isClone: true,
        show: true,
      },
      listData: [
        {
          type: "condition",
          name: "过滤条件",
          list: [],
          isClone: false,
          show: false,
        },
        {
          type: "group",
          name: "分组配置",
          list: [],
          isClone: false,
          show: true,
        },
        {
          type: "aggregation",
          name: "聚合配置",
          list: [],
          isClone: false,
          show: true,
        },
        {
          type: "order",
          name: "排序配置",
          list: [],
          isClone: false,
          show: false,
        },
      ],
      checkedReqOptions: ["条件", "分组", "聚合", "排序"],
      ReqOptions: ["条件", "分组", "聚合", "排序"],
      columnsOption: [],
      columnsList: [],
      tableTitle: [], //预览表格表头
      tableData: [], //预览表格内容
      tableExportStatus: false, // 导出预览表格为excel
      endList: [],
      endData: {
        condition: [],
        group: [],
        order: [],
        aggregation: [],
      },
      reqData: {
        condition: [],
        group: [],
        aggregation: [],
        order: [],
      },
      allApp: [],
      allService: [],
      requestUrl: "",
      previewInfo: {
        // previewTable分页配置信息
        currentPage: 1,
        rowNum: 0,
        totalPage: 0,
      },
    };
  },
  methods: {
    remoteMethod(query) {
      if (query !== "") {
        this.getServiceName(query);
      } else {
        this.options = [];
      }
    },
    async fetchChildDatas() {
      const serviceNames = {
        order: "srvpage_cfg_srv_call_order_select",
        condition: "srvpage_cfg_srv_call_cond_select",
        group: "srvpage_cfg_srv_call_group_stats_select",
        column: "srvpage_cfg_srv_call_req_cols_select",
      };
      const reqs = [];
      Object.keys(serviceNames).forEach((type) => {
        const req = {
          serviceName: serviceNames[type],
          colNames: ["*"],
          condition: [
            {
              colName: type === "group" ? "srv_req_no" : "srv_call_no",
              ruleType: "eq",
              value: this.srv_call_no,
            },
          ],
          relation_condition: {},
          page: { pageNo: 1, rownumber: 50 },
        };

        const url = `/config/select/${serviceNames[type]}`;
        const res = this.$http.post(url, req);
        reqs.push(res);
      });
      const res = await Promise.all(reqs);
      let result = [];
      if (Array.isArray(res) && res.length > 0) {
        res.forEach((response, index) => {
          let resData = response.data.data;
          if (response.data.state === "SUCCESS" && resData.length > 0) {
            let data = resData.map((item) => {
              let str =
                item.row_order_json ||
                item.row_cond_json ||
                item.row_json ||
                item.row_group_json;
              let rItem = null;
              if (item.col_srv) {
                rItem = item.col_srv;
              } else if (str) {
                try {
                  rItem = JSON.parse(str);
                } catch (error) {}
              }
              return rItem;
            });
            if (index === 0) {
              this.childData.order = resData;
            }
            if (index === 1) {
              this.childData.condition = resData;
            }
            if (index === 2) {
              this.childData.group = resData;
            }
            if (index === 3) {
              this.childData.column = resData;
            }
            result.push(data);
          } else {
            result.push(null);
          }
        });
      }
      return result;
    },
    buildChildData() {
      const serviceNames = {
        order: "srvpage_cfg_srv_call_order",
        condition: "srvpage_cfg_srv_call_cond",
        group: "srvpage_cfg_srv_call_group_stats",
        column: "srvpage_cfg_srv_call_req_cols",
      };
      const ruleTypeMap = {
        ne: "不等于",
        eq: "等于",
        in: "包含",
      };
      const reqDatas = [];
      Object.keys(serviceNames).forEach((type) => {
        if (type === "column") return;
        let localData = [...this.endData[type]];
        if (type == "group") {
          localData = [...localData, ...this.endData["aggregation"]];
        }
        if (this.srv_call_no) {
          reqDatas.unshift({
            serviceName: `${serviceNames[type]}_delete`,
            depend_keys: [
              {
                type: "column",
                add_col: type === "group" ? "srv_req_no" : "srv_call_no",
                depend_key: type === "group" ? "srv_req_no" : "srv_call_no",
              },
            ],
            condition: [
              {
                colName: type === "group" ? "srv_req_no" : "srv_call_no",
                ruleType: "eq",
                value: this.srv_call_no,
              },
              // {
              //   colName: "id",
              //   ruleType: "in",
              //   value: originData.map((item) => item.id).toString(),
              // },
            ],
          });
        }
        // let originData = this.childData[type];
        // if (Array.isArray(originData) && originData.length > 0) {

        // }
        if (Array.isArray(localData) && localData.length > 0) {
          reqDatas.push({
            serviceName: `${serviceNames[type]}_add`,
            depend_keys: [
              {
                type: "column",
                add_col: type === "group" ? "srv_req_no" : "srv_call_no",
                depend_key: type === "group" ? "srv_req_no" : "srv_call_no",
              },
            ],
            data: localData.map((item, index) => {
              let res = null;
              switch (type) {
                case "order":
                  res = {
                    order_seq: index * 100,
                    col_name: item.colName,
                    order_type: item.orderType,
                    srv_call_no: this.srv_call_no,
                  };
                  break;
                case "condition":
                  res = {
                    col_name: item.colName,
                    rule_type: ruleTypeMap[item.ruleType] || "like",
                    val_type: "常量",
                    const: item.value,
                    srv_call_no: this.srv_call_no,
                  };
                  break;
                case "group":
                  res = {
                    col_name: item.colName,
                    type_stat: item.type,
                    alias_name: item.aliasName,
                    srv_req_no: this.srv_call_no,
                  };
                  break;
              }
              return res;
            }),
          });
        }
      });
      // 请求字段
      // 先删掉所有的
      // if (
      //   Array.isArray(this.childData.column) &&
      //   this.childData.column.length > 0
      // ) {
      if (this.srv_call_no) {
        reqDatas.unshift({
          serviceName: `${serviceNames.column}_delete`,
          depend_keys: [
            {
              type: "column",
              add_col: "srv_call_no",
              depend_key: "srv_call_no",
            },
          ],
          condition: [
            {
              colName: "srv_call_no",
              ruleType: "eq",
              value: this.srv_call_no,
            },
            // {
            //   colName: "id",
            //   ruleType: "in",
            //   value: this.childData.column.map((item) => item.id).toString(),
            // },
          ],
        });
      }

      // }
      if (this.checkedColumns.length === this.allColum.list.length) {
        // if (!this.childData.column.find((item) => item.col_srv == "*")) {
        reqDatas.push({
          serviceName: `${serviceNames.column}_add`,
          depend_keys: [
            {
              type: "column",
              add_col: "srv_call_no",
              depend_key: "srv_call_no",
            },
          ],
          data: [
            {
              col_srv: "*",
              srv_call_no: this.srv_call_no,
            },
          ],
        });
        // }
      } else {
        reqDatas.push({
          serviceName: `${serviceNames.column}_add`,
          depend_keys: [
            {
              type: "column",
              add_col: "srv_call_no",
              depend_key: "srv_call_no",
            },
          ],
          data: this.checkedColumns.map((item) => {
            return {
              srv_call_no: this.srv_call_no,
              col_srv: item,
            };
          }),
        });
      }
      return reqDatas;
    },
    buildSaveData() {
      const data = {
        group_json: "",
        service_name: this.ruleForm.service_name,
        mapp: this.ruleForm.mapp,
        order_json: "",
        page_no: 1,
        cycle_req_timer: 0,
        srv_req_json: "",
        req_cols_json: "",
        srv_req_name: this.ruleForm.srv_req_name,
        srv_type: this.ruleForm.srv_type,
        rownumber: 10,
        condition_json: "",
      };
      data.order_json = JSON.stringify(this.endData.order || [], null, 1);
      data.condition_json = JSON.stringify(
        this.endData.condition || [],
        null,
        1
      );
      data.group_json = JSON.stringify(
        [...this.endData.aggregation, ...this.endData.group] || [],
        null,
        1
      );
      const srv_req_json = {
        ...this.ruleForm,
        colNames: ["*"],
        condition: JSON.parse(data.condition_json),
        order: JSON.parse(data.order_json),
        group: JSON.parse(data.group_json),
        page: { pageNo: 1, rownumber: 10 },
      };
      data.srv_req_json = JSON.stringify(srv_req_json, null, 1);
      return data;
    },
    async getColumns() {
      this.columnsList = [];
      this.allColum.list = [];
      let req = {
        serviceName: "srvsys_service_columns_select",
        colNames: ["*"],
        condition: [
          {
            colName: "service_name",
            ruleType: "eq",
            value: this.ruleForm.service_name,
          },
        ],
        order: [
          {
            colName: "seq",
            orderType: "asc",
          },
        ],
      };
      let url = this.getServiceUrl(
        "select",
        "srvsys_service_columns_select",
        this.ruleForm.mapp
      );
      const res = await this.$http.post(url, req);
      let all = res.data.data;
      this.columnsOption = [];
      all.forEach((item) => {
        // if (
        //   item.in_list === 1 ||
        //   item.in_cond === 1 ||
        //   item.in_detail === 1 ||
        //   item.in_add === null ||
        //   item.in_detail === null ||
        //   item.in_list === null
        // ) {
        item["_condition"] = {
          colName: item.columns,
          ruleType: "",
          value: "",
        };
        item["_group"] = {
          colName: item.columns,
          type: "by",
        };
        item["_order"] = {
          colName: item.columns,
          orderType: "",
        };
        item["_aggregation"] = {
          colName: item.columns,
          type: "",
        };
        item["aliasName"] = "";
        this.columnsOption.push(item);
        // }
      });
      this.deleteListData();
      this.allColum.list = this.columnsOption;
      this.checkedColumns = this.columnsOption.map((item) => item.columns);
    },
    requestData(endList, endData) {
      if (endList.type === "condition") {
        this.endData["condition"] = endData.condition;
      } else if (endList.type === "group") {
        this.endData["group"] = endData.group;
      } else if (endList.type === "aggregation") {
        this.endData["aggregation"] = endData.aggregation;
      } else if (endList.type === "order") {
        this.endData["order"] = endData.order;
      }
      this.endList = endList;
    },
    setEndData() {
      let endData = {
        group: [],
        order: [],
        condition: [],
        aggregation: [],
      };
      if (Array.isArray(this.listData) && this.listData.length > 0) {
        this.listData.forEach((item) => {
          Object.keys(endData).forEach((key) => {
            if (item.type === key && item?.list?.length) {
              endData[key].push(...item.list.map((d) => d[`_${key}`]));
            }
          });
        });
      }
      this.endData = endData;
      return endData;
    },
    previewData() {
      this.setEndData();
      // 根据组装的条件 发送请求 预览数据
      this.reqData = {
        group:
          this.endData.aggregation && this.endData.group
            ? this.endData.group.concat(this.endData.aggregation)
            : this.endData.aggregation && !this.endData.group
            ? this.endData.aggregation
            : !this.endData.aggregation && this.endData.group
            ? this.endData.group
            : undefined,
        condition: this.endData.condition,
        order: this.endData.order,
      };
      let reqData = {};
      if (this.reqData.condition) {
        reqData.condition = this.reqData.condition
          .map((item) => {
            if (item.ruleType && item.value) {
              return item;
            }
          })
          .filter(Boolean);
      }
      if (this.reqData.group) {
        reqData.group = this.reqData.group
          .map((item) => {
            if (item.type) {
              return item;
            }
          })
          .filter(Boolean);
      }
      if (this.reqData.order) {
        reqData.order = this.reqData.order.map((item) => {
          return item;
        });
      }
      this.requestUrl = this.getServiceUrl(
        this.ruleForm.srv_type || "select",
        this.ruleForm.service_name,
        this.ruleForm.mapp
      );

      if (this.allColum.list.length === 0) {
        reqData["colNames"] = ["*"];
      } else {
        reqData["colNames"] = this.columnsList;
      }
      reqData["serviceName"] = this.ruleForm.service_name;
      reqData["colNames"] = ["*"];
      this.reqData = reqData;
      this.requestBody = reqData;
      this.getPreviewTableData(reqData);
    },
    saveConfig() {
      // 保存配置到服务器
      // return;
      this.setEndData();
      const saveData = this.buildSaveData();
      const child_data_list = this.buildChildData();
      // if (this.srv_call_no) {
      //   saveData.child_data_list = child_data_list;
      //   this.updateModel(saveData);
      // } else {
      this.updateModel(saveData, child_data_list);
      // }
    },
    exportExcel() {
      this.tableExportStatus = true;
      setTimeout(() => {
        this.getExcel();
      }, 500);
      setTimeout(() => {
        this.tableExportStatus = false;
      }, 1000);
    },
    getExcel() {
      if (!this.tableData) {
        alert("表格数据为空");
        return;
      } else {
        let time = dayjs().format("YYYYMMDDHHmmss");
        let fileName = this.ruleForm.serviceName + time + ".xlsx";
        // 将预览表格中的数据导出为excel
        let wb = XLSX.utils.table_to_book(document.querySelector("#out-table"));
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
    getApp() {
      //获取应用列表
      let req = {
        colNames: ["*"],
        condition: [],
        order: [
          {
            colName: "app_seq",
            orderType: "desc",
          },
        ],
        serviceName: "srvconfig_app_list_select",
      };
      const url = `/config/select/${req.serviceName}`;
      this.$http.post(url, req).then((res) => {
        this.allApp = res.data.data;
      });
    },
    changeReqOption() {
      // 选择显示那四个框中的哪个
      let self = this;
      let options = this.checkedReqOptions;
      if (options) {
        if (options.indexOf("条件") >= 0) {
          self.listData[0].show = true;
        } else {
          self.listData[0].show = false;
        }
        if (options.indexOf("分组") >= 0) {
          self.listData[1].show = true;
        } else {
          self.listData[1].show = false;
        }
        if (options.indexOf("聚合") >= 0) {
          self.listData[2].show = true;
        } else {
          self.listData[2].show = false;
        }
        if (options.indexOf("排序") >= 0) {
          self.listData[3].show = true;
        } else {
          self.listData[3].show = false;
        }
      }
    },
    async getServiceName(name) {
      //选择服务名称列表
      this.allService = [];
      this.allColum.list = [];
      this.ruleForm.serviceName = "";
      this.columnsList = [];
      //清楚endData中得数据
      this.endData.condition = [];
      this.endData.group = [];
      this.endData.order = [];
      this.endData.aggregation = [];
      let req = {
        serviceName: "srvsys_service_select",
        colNames: ["*"],
        condition: [
          {
            colName: "service_type",
            value: "select",
            ruleType: "eq",
          },
          {
            colName: "module",
            value: "syscore",
            ruleType: "ne",
          },
          {
            colName: "module",
            value: "process",
            ruleType: "ne",
          },
        ],
        order: [
          {
            colName: "id",
            orderType: "desc",
          },
        ],
      };
      if (name) {
        req.condition.push({
          colName: "service_name",
          ruleType: "like",
          value: name,
        });
      }
      const url = `/${this.ruleForm.mapp}/select/${req.serviceName}`;
      const res = await this.$http.post(url, req);
      let data = res.data.data;
      let selectServiceList = [];
      if (data) {
        data.map((item) => {
          if (item.service_type === "select") {
            selectServiceList.push(item);
          }
        });
      }
      await this.getColumns();
      this.deleteListData();
      this.allService = selectServiceList;
      return res;
    },
    deleteListData() {
      for (let index = 0; index < this.listData.length; index++) {
        this.listData[index].list = [];
      }
    },
    getPreviewTableData(req) {
      // 获取预览数据
      let self = this;
      self.tableTitle = [];
      req.page = {
        pageNo: this.previewInfo.currentPage,
        rownumber: this.previewInfo.rowNum || 10,
      };
      this.$http.post(this.requestUrl, req).then((res) => {
        let pageData = res.data.page; //获取分页信息
        this.previewInfo.currentPage = pageData.pageNo;
        this.previewInfo.rowNum = pageData.rownumber;
        this.previewInfo.totalPage = pageData.total;
        this.tableData = res.data.data;
        //点击后出先表格
        //表头数组
        let tableAllTitleData = self.reqData.group;
        if (tableAllTitleData.length === 0) {
          self.tableTitle = self.columnsOption;
        } else {
          tableAllTitleData.forEach((item) => {
            if (item.type) {
              self.columnsOption.forEach((col) => {
                //
                if (item.colName === col.columns) {
                  self.tableTitle.push(col);
                }
              });
            } else {
              self.tableTitle = self.columnsOption;
            }
          });
          let obj = {};
          let newArr = [];
          newArr = self.tableTitle.reduce((item, next) => {
            obj[next.columns]
              ? " "
              : (obj[next.columns] = true && item.push(next));
            return item;
          }, []);

          self.tableTitle = newArr;
        }
        //表格内容数据
      });
    },
    addModel(saveData) {
      // 增加模型
      let serviceName = "srvpage_cfg_srv_call_add";
      let url = this.getServiceUrl("operate", serviceName, "config");
      let params = [
        {
          condition: [],
          serviceName: serviceName,
          data: [saveData],
        },
      ];
      this.$http
        .post(url, params)
        .then((res) => {
          if (res.data.resultCode === "SUCCESS") {
            this.$alert("添加成功", "SUCCESS", {
              confirmButtonText: "确定",
              callback: (action) => {},
            });
          } else if (res.data.resultCode === "FAILURE") {
          }
        })
        .catch((err) => {});
    },
    updateModel(saveData, child_data_list) {
      // 编辑模型
      let serviceName = "srvpage_cfg_srv_call_update";
      if (!this.srv_call_no) {
        serviceName = "srvpage_cfg_srv_call_add";
      }
      let url = this.getServiceUrl("operate", serviceName, "config");
      let params = [
        {
          serviceName: serviceName,
          data: [saveData],
        },
      ];
      if (this.srv_call_no) {
        params[0].condition = [
          { colName: "srv_call_no", ruleType: "eq", value: this.srv_call_no },
        ];
      }
      if (
        this.srv_call_no &&
        Array.isArray(child_data_list) &&
        child_data_list.length > 0
      ) {
        params = [...params, ...child_data_list];
      } else {
        params[0].data[0].child_data_list = child_data_list;
      }
      let loadingInstance1 = Loading.service({ fullscreen: true });
      this.$http.post(url, params).then((res) => {
        loadingInstance1.close();

        if (res.data.resultCode === "SUCCESS") {
          this.$alert(this.srv_call_no ? "保存成功" : "添加成功", "SUCCESS", {
            confirmButtonText: "确定",
            callback: (action) => {},
          });
          if (!this.srv_call_no) {
            this.srv_call_no =
              res.data.response[0].response.effect_data[0].srv_call_no;
          }
        } else {
          this.$alert(`${res.data.resultMessage}`, "保存失败", {
            confirmButtonText: "确定",
            callback: (action) => {},
          });
        }
      });
    },

    previewDataSizeChange(val) {
      this.previewInfo.rowNum = val;
      this.getPreviewTableData(this.reqData);
    },
    previewDataCurrentChange(val) {
      this.previewInfo.currentPage = val;
      this.getPreviewTableData(this.reqData);
    },
    async fetchRequestConfig(initData) {
      const req = {
        serviceName: "srvpage_cfg_srv_call_select",
        colNames: ["*"],
        condition: [
          {
            colName: "srv_call_no",
            ruleType: "eq",
            value: this.srv_call_no,
          },
        ],
        page: { pageNo: 1, rownumber: 1 },
      };
      const url = `/config/select/srvpage_cfg_srv_call_select`;
      const res = await this.$http.post(url, req);
      if (res?.data?.state === "SUCCESS") {
        if (Array.isArray(res.data.data) && res.data.data.length > 0) {
          const reqConfig = res.data.data[0];
          this.reqConfig = reqConfig;
          this.ruleForm = {
            srv_req_name: this.reqConfig.srv_req_name, //接口调用名称
            mapp: this.reqConfig.mapp, //微服务
            service_name: this.reqConfig.service_name,
            srv_type: this.reqConfig.srv_type, //接口类型
          };
          if (this.$route.query?.srvApp && !this.ruleForm.mapp) {
            this.ruleForm.mapp = this.$route.query?.srvApp;
          }
          await this.getServiceName();
          initData = new Array(4);
          if (reqConfig?.order_json) {
            try {
              const orders = JSON.parse(reqConfig.order_json);
              if (Array.isArray(orders)) {
                initData[0] = orders;
              }
            } catch (error) {}
          }
          if (reqConfig?.condition_json) {
            try {
              const conditions = JSON.parse(reqConfig.condition_json);
              if (Array.isArray(conditions)) {
                initData[1] = conditions;
              }
            } catch (error) {}
          }
          if (reqConfig?.group_json) {
            try {
              const groupJson = JSON.parse(reqConfig.group_json);
              if (Array.isArray(groupJson)) {
                initData[2] = groupJson.map((item) => {
                  if (!item.alias_name) {
                    item.aliasName = "";
                  } else {
                    item.aliasName = item.alias_name;
                  }
                  return item;
                });
              }
            } catch (error) {}
          }
          if (reqConfig?.cols_cfg_json) {
            try {
              const cols = JSON.parse(reqConfig.cols_cfg_json);
              initData[3] = cols.map((item) => item.col_srv);
            } catch (error) {}
          }

          // this.childData.order = [...initData[0]];
          // this.childData.condition = [...initData[1]];
          // this.childData.group = [...initData[2]];
          // this.childData.column = [...initData[3]];

          this.reqConfig._initData = JSON.parse(JSON.stringify(initData));
          // 填充默认值
          let reqData = {
            condition: [],
            order: [],
            aggregation: [],
            group: [],
          };
          if (Array.isArray(initData) && initData.length === 4) {
            console.log(initData);
            reqData.order = initData[0];
            reqData.condition = initData[1];
            const group = initData[2] || [];
            if (Array.isArray(group) && group.length > 0) {
              group.forEach((item) => {
                // if (item.type !== "by") {
                //   reqData.aggregation.push(item);
                // } else {
                reqData.group.push(item);
                // }
              });
            }
            // reqData.group = group.filter((item) => item.type);
            // reqData.columns = initData[3]
            if (initData[3] && initData[3].includes("*")) {
              this.checkedColumns = this.columnsOption.map(
                (item) => item.columns
              );
            } else {
              this.checkedColumns = initData[3] || [];
            }
          }

          let _condition = [];
          let _group = [];
          let _aggregation = [];
          let _order = [];

          let endData = {
            condition: [],
            group: [],
            aggregation: [],
            order: [],
          };

          if (Array.isArray(reqData.condition)) {
            reqData.condition.map((cond) => {
              this.allColum.list.map((column) => {
                if (column.columns == cond.colName) {
                  column._condition = cond;
                  _condition.push(cond);
                  endData.condition.push(column);
                }
              });
            });
          }

          let group = reqData.group;
          if (group) {
            const groupTypes = [
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
            const aggregationTypes = [
              "sum",
              "mix",
              "max",
              "avg",
              "count",
              "count_all",
              "distinct_count",
            ];
            group.map((groupItem) => {
              this.allColum.list.map((column) => {
                if (column.columns == groupItem.colName) {
                  if (aggregationTypes.includes(groupItem.type)) {
                    column._aggregation = groupItem;
                    if (!groupItem.alias_name) {
                      groupItem.aliasName = "";
                    } else {
                      groupItem.aliasName = item.alias_name;
                    }
                    _aggregation.push(groupItem);
                    endData.aggregation.push(column);
                  } else if (groupTypes.includes(groupItem.type)) {
                    column._group = groupItem;
                    _group.push(groupItem);
                    endData.group.push(column);
                  }
                }
              });
            });
          }
          const order = reqData.order;
          if (order) {
            order.map((orderItem) => {
              this.allColum.list.map((column) => {
                if (column.columns == orderItem.colName) {
                  column._order = orderItem;
                  _order.push(orderItem);
                  endData.order.push(column);
                }
              });
            });
          }

          this.listData[0].list = endData.condition;
          this.listData[1].list = endData.group;
          this.listData[2].list = endData.aggregation;
          this.listData[3].list = endData.order;
          this.endData.condition = _condition;
          this.endData.group = _group;
          this.endData.aggregation = _aggregation;
          this.endData.order = _order;
        }
      }
    },
  },
  computed: {
    chartName() {
      return this.ruleForm.chartName;
    },

    serviceName() {
      return this.ruleForm.serviceName;
    },
  },
  watch: {
    columnsOption: {
      deep: true,
      handler(newValue, oldValue) {
        this.columnsOption = newValue;
      },
    },
  },
  async created() {
    await this.getApp();
    if (this.$route.query?.no) {
      this.srv_call_no = this.$route.query?.no;
      // this.fetchChildDatas().then((res) => {
      // this.fetchRequestConfig(res);
      this.fetchRequestConfig();
      // });
    }

    this.changeReqOption();

    // let operate = this.$route.params.modelId
    // if (operate == 'add') {
    //   this.app = appName
    //   this.serveice = serviceName
    //   this.getApp();
    // } else { // 编辑
    //   this.getApp();
    // }
    this.$nextTick(() => {
      document.title = '请求配置'
    })
  },
};
</script>

<style scoped lang="scss">
.hual {
  display: flex;
  flex-direction: column;
  max-width: 1600px;
  min-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  border-radius: 8px;

  .sing_hual {
    margin-left: 0.5rem;
    height: 50%;
    width: 30%;
  }

  .menu {
    height: 70vh;
    min-height: 500px;
    width: 15%;
  }
  .columns-box {
    border-radius: 8px;
  }
  .select-box {
    width: 100%;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    padding: 16px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
    margin-bottom: 20px;
    transition: all 0.3s ease;
    ::v-deep .el-card__body {
      width: 100%;
    }
    &:hover {
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08) !important;
    }

    .el-form {
      .el-form-item__label {
        font-weight: 500;
        color: #606266;
      }

      .el-input__inner,
      .el-select__tags {
        border-radius: 4px;
        border-color: #dcdfe6;
        transition: all 0.3s;

        &:focus,
        &:hover {
          border-color: #409eff;
          box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
        }
      }

      .el-checkbox {
        margin-right: 15px;

        &.is-bordered {
          padding: 8px 15px;
          border-radius: 4px;
          transition: all 0.3s;

          &:hover {
            border-color: #409eff;
            color: #409eff;
          }
        }
      }
    }

    .el-form-item {
      line-height: 40px;
      font-size: 14px;
      font-weight: 500;
      min-width: 30%;
      margin-bottom: 16px;

      .el-input {
        // max-width: 220px;
      }

      .label {
        color: #333;
        min-width: 65px;
      }
    }
  }

  .content-box {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    margin-bottom: 20px;
    gap: 20px;
    // box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);

    .column-box {
      width: 18%;
      height: 500px;
      font-size: 14px;
      font-weight: 400;
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
      }
    }

    .condition-box {
      min-height: 500px;
      flex: 1;
      // display: flex;
      // flex-wrap: wrap;
      // align-content: flex-start;
      // justify-content: space-between;
      gap: 16px;
      display: grid;
      justify-content: center;
      grid-template-columns: repeat(auto-fit, minmax(500px, 600px));

      .sing_hual {
        // width: calc(50% - 10px);
        // max-height: 49%;
        height: 100%;
        min-height: 200px;
        max-height: 500px;
        width: 100%;
        display: flex;
        box-sizing: border-box;
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
        overflow: hidden;
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
        }
      }
    }
  }

  .btn-box {
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
    margin-bottom: 20px;

    .el-button {
      padding: 10px 24px;
      font-weight: 500;
      border-radius: 4px;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      &.el-button--success {
        background: linear-gradient(135deg, #50b11f, #85ce61);
        border-color: #85ce61;
      }

      &.el-button--primary {
        background: linear-gradient(135deg, #1989fa, #096dd9);
        border-color: #409eff;
      }
    }
  }

  .preview-box {
    margin-bottom: 50px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
    padding: 16px;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08) !important;
    }

    .preview-title {
      padding: 0 16px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #f0f0f0;
      margin-bottom: 16px;

      .title {
        font-size: 18px;
        font-weight: 600;
        color: #333;
      }

      .export-button {
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

      .el-table {
        border-radius: 4px;
        overflow: hidden;

        th {
          background-color: #f5f7fa !important;
          color: #606266;
          font-weight: 500;
          padding: 10px 0;
        }

        td {
          padding: 8px 0;
        }

        .el-table__row:hover > td {
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

    .el-pagination.is-background .el-pager li:not(.disabled).active {
      background-color: #409eff;
      color: #fff;
    }

    .el-pagination.is-background .el-pager li:not(.disabled):hover {
      color: #409eff;
    }
  }

  .detail-dialog ::v-deep .el-dialog__body .el-table {
    overflow-y: scroll;
    height: 600px;
  }
}
</style>
