<template>
  <div class="hual">
    <request-form
      :value="ruleForm"
      :allService="allService"
      :allApp="allApp"
      :checkedReqOptions="checkedReqOptions"
      :srv-type="'select'"
      @req-option-change="reqOptionChange"
      @service-change="serviceChange"
      @app-change="appChange"
      @req-type-change="reqTypeChange"
    ></request-form>

    <div class="columns-box">
      <div class="content-box">
        <div class="column-box">
          <column-box
            :singList="allColum"
            :allow-check="true"
            :checkedColumns.sync="checkedColumns"
            :endData="endData"
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
              @change="changeData"
              @delete="deleteData"
            ></column-box>
          </div>
        </div>
      </div>
    </div>
    <action-buttons @preview="previewData" @save="saveConfig"> </action-buttons>
    <data-preview
      ref="dataPreviewRef"
      :req-no="srv_call_no"
      :app-name="ruleForm.mapp"
      :service-name="ruleForm.service_name"
      :title="ruleForm.srv_req_name"
      :columns-option="columnsOption"
    ></data-preview>

    <login-dialog ref="loginRef"></login-dialog>
  </div>
</template>

<script>
import { Loading } from "element-ui";
import loginDialog from "@/components/login-dialog/index.vue";
import RequestForm from "@/components/request-builder/RequestForm.vue";
import DataPreview from "@/components/request-builder/DataPreview.vue";
import ActionButtons from "@/components/request-builder/ActionButtons.vue";
import columnBox from "@/components/column-box.vue";
import dayjs from "dayjs";
import FileSaver from "file-saver";
import * as XLSX from "xlsx";
export default {
  name: "RequestBuilder",
  components: {
    columnBox,
    loginDialog,
    RequestForm,
    DataPreview,
    ActionButtons,
  },
  data() {
    return {
      showPreview: false,
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
      deleteList: [],
    };
  },
  methods: {
    deleteData(sign, type) {
      console.log("deleteData:", sign, type);

      if (sign.__flag !== "db") {
        // 非操作数据库数据，不处理
        return;
      }
      console.log("deleteData:", sign, type);
      this.deleteList.push({ ...sign, __type: type });
    },
    changeData({ event, type, item }) {
      console.log("changeData:", event, type, item);
    },
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
        aggregation: "srvpage_cfg_srv_call_group_stats",
        column: "srvpage_cfg_srv_call_req_cols",
      };

      const ruleTypeMap = {
        eq: "等于",
        ne: "不等于",
        gt: "大于",
        lt: "小于",
        like: "近似于",
        "like]": "开始于",
        "[like": "结束于",
        in: "包含",
        notin: "不包含",
        isnull: "为空",
        notnull: "不为空",
        inset: "在集合中",
        between: "在两者之间",
      };
      const reqDatas = [];
      const { addList, deleteList, updateList } = this.calculateReq();
      const reqList = [];
      const srv_call_no = this.srv_call_no;
      const buildReqData = (item, index) => {
        const type = item.__type;
        let res = {};
        switch (type) {
          case "order":
            res = {
              order_seq: index * 100,
              col_name: item.columns,
              srv_call_no: srv_call_no,
            };
            if (item.orderType) {
              res.order_type = item.orderType;
            }
            break;
          case "condition":
            res = {
              col_name: item.columns,
              val_type: "常量",
              srv_call_no: srv_call_no,
            };
            if (item.ruleType) {
              res.rule_type = ruleTypeMap[item.ruleType] || "近似于";
            }
            if (item.value) {
              res.const = item.value;
            }
            break;
          case "group":
            res = {
              col_name: item.columns,
              srv_req_no: srv_call_no,
            };
            if (item.groupType) {
              res.type_stat = item.groupType;
            }
            if (item.seq) {
              res.seq = item.seq;
            }
            if (item.aliasName) {
              res.alias_name = item.aliasName;
            }
            break;
        }
        return res;
      };

      if (Array.isArray(addList) && addList.length > 0) {
        const conditionList = addList.filter(
          (item) => item.__type === "condition"
        );
        const groupList = addList.filter((item) => item.__type === "group");
        const orderList = addList.filter((item) => item.__type === "order");
        if (conditionList.length) {
          reqList.push({
            serviceName: `${serviceNames["condition"]}_add`,
            data: conditionList.map((item) => buildReqData(item)),
          });
        }
        if (groupList.length) {
          reqList.push({
            serviceName: `${serviceNames["group"]}_add`,
            data: groupList.map((item) => buildReqData(item)),
          });
        }
        if (orderList.length) {
          reqList.push({
            serviceName: `${serviceNames["order"]}_add`,
            data: orderList.map((item, index) =>
              buildReqData(item, this.endData.order.length + index)
            ),
          });
        }
        // addList.forEach((item, index) => {
        //   reqList.push({
        //     serviceName: `${serviceNames[item.__type]}_add`,
        //     depend_keys: [
        //       {
        //         type: "column",
        //         add_col: item.__type === "group" ? "srv_req_no" : "srv_call_no",
        //         depend_key:
        //           item.__type === "group" ? "srv_req_no" : "srv_call_no",
        //       },
        //     ],
        //     data: [buildReqData(item, index)],
        //   });
        // });
      }
      if (Array.isArray(updateList) && updateList.length > 0) {
        const conditionList = updateList.filter(
          (item) => item.__type === "condition"
        );
        const groupList = updateList.filter((item) => item.__type === "group");
        const orderList = updateList.filter((item) => item.__type === "order");
        if (conditionList.length) {
          conditionList.forEach((item) => {
            reqList.push({
              serviceName: `${serviceNames[item.__type]}_update`,
              condition: [
                {
                  colName: "id",
                  ruleType: "eq",
                  value: item._raw?.id,
                },
              ],
              data: [buildReqData(item)],
            });
          });
        }
        if (groupList.length) {
          groupList.forEach((item, index) => {
            reqList.push({
              serviceName: `${serviceNames[item.__type]}_update`,
              condition: [
                {
                  colName: "id",
                  ruleType: "eq",
                  value: item._raw?.id,
                },
              ],
              data: [buildReqData(item)],
            });
          });
        }
        if (orderList.length) {
          orderList.forEach((item, index) => {
            reqList.push({
              serviceName: `${serviceNames[item.__type]}_update`,
              condition: [
                {
                  colName: "id",
                  ruleType: "eq",
                  value: item._raw?.id,
                },
              ],
              data: [buildReqData(item, index)],
            });
          });
        }
        // updateList.forEach((item, index) => {
        //   reqList.push({
        //     serviceName: `${serviceNames[item.__type]}_update`,
        //     condition: [
        //       {
        //         colName: item.__type === "group" ? "srv_req_no" : "srv_call_no",
        //         ruleType: "eq",
        //         value: this.srv_call_no,
        //       },
        //     ],
        //     data: [buildReqData(item, index)],
        //   });
        // });
      }

      if (Array.isArray(deleteList) && deleteList.length > 0) {
        const orderList = deleteList.filter((item) => item.__type === "order");
        const groupList = deleteList.filter((item) =>
          ["group", "aggregation"].includes(item.__type)
        );
        const conditionList = deleteList.filter(
          (item) => item.__type === "condition"
        );
        const list = {
          orderList,
          groupList,
          conditionList,
        };

        const types = ["order", "group", "condition"];
        types.forEach((type) => {
          if (list[`${type}List`]?.length) {
            reqList.push({
              serviceName: `${serviceNames[type]}_delete`,
              condition: [
                {
                  colName: "id",
                  ruleType: "in",
                  value: list[`${type}List`].map((item) => item.id).toString(),
                },
              ],
            });
          }
        });
      }
      return reqList;
      Object.keys(serviceNames).forEach((type) => {
        if (type === "column") return;
        let localData = [...this.endData[type]];
        if (type == "group") {
          localData = [...localData, ...this.endData["aggregation"]];
        }
        if (this.srv_call_no) {
          if (Array.isArray(deleteList) && deleteList.length > 0) {
            reqDatas.unshift({
              serviceName: `${serviceNames[type]}_delete`,
              condition: [
                {
                  colName: type === "group" ? "srv_req_no" : "srv_call_no",
                  ruleType: "eq",
                  value: this.srv_call_no,
                },
              ],
            });
          }
          //   condition: [
          //     {
          //       colName: type === "group" ? "srv_req_no" : "srv_call_no",
          //       ruleType: "eq",
          //       value: this.srv_call_no,
          //     },
          //     // {
          //     //   colName: "id",
          //     //   ruleType: "in",
          //     //   value: originData.map((item) => item.id).toString(),
          //     // },
          //   ],
          // });
        }
        // let originData = this.childData[type];
        // if (Array.isArray(originData) && originData.length > 0) {

        // }
        const currentTypeAddList = addList.filter(
          (item) => item.__type === type
        );
        if (
          Array.isArray(currentTypeAddList) &&
          currentTypeAddList.length > 0
        ) {
          reqDatas.push({
            serviceName: `${serviceNames[type]}_add`,
            depend_keys: [
              {
                type: "column",
                add_col: type === "group" ? "srv_req_no" : "srv_call_no",
                depend_key: type === "group" ? "srv_req_no" : "srv_call_no",
              },
            ],
            data: currentTypeAddList.map((item, index) => {
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
                    rule_type: ruleTypeMap[item.ruleType] || "近似于",
                    val_type: "常量",
                    const: item.value,
                    srv_call_no: this.srv_call_no,
                  };
                  break;
                case "group":
                  res = {
                    col_name: item.colName,
                    type_stat: item.type,
                    seq: item.seq,
                    alias_name: item.aliasName,
                    srv_req_no: this.srv_call_no,
                  };
                  break;
              }
              return res;
            }),
          });
        }

        const currentTypeUpdateList = updateList.filter(
          (item) => item.__type === type
        );
        if (
          Array.isArray(currentTypeUpdateList) &&
          currentTypeUpdateList.length > 0
        ) {
          reqDatas.push({
            serviceName: `${serviceNames[type]}_update`,
            depend_keys: [
              {
                type: "column",
                add_col: type === "group" ? "srv_req_no" : "srv_call_no",
                depend_key: type === "group" ? "srv_req_no" : "srv_call_no",
              },
            ],
            data: currentTypeUpdateList.map((item, index) => {
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
                    rule_type: ruleTypeMap[item.ruleType] || "近似于",
                    val_type: "常量",
                    const: item.value,
                    srv_call_no: this.srv_call_no,
                  };
                  break;
                case "group":
                  res = {
                    col_name: item.colName,
                    type_stat: item.type,
                    seq: item.seq,
                    alias_name: item.aliasName,
                    srv_req_no: this.srv_call_no,
                  };
                  break;
              }
              return res;
            }),
          });
        }

        // if (Array.isArray(localData) && localData.length > 0) {
        //   reqDatas.push({
        //     serviceName: `${serviceNames[type]}_add`,
        //     depend_keys: [
        //       {
        //         type: "column",
        //         add_col: type === "group" ? "srv_req_no" : "srv_call_no",
        //         depend_key: type === "group" ? "srv_req_no" : "srv_call_no",
        //       },
        //     ],
        //     data: localData.map((item, index) => {
        //       let res = null;
        //       switch (type) {
        //         case "order":
        //           res = {
        //             order_seq: index * 100,
        //             col_name: item.colName,
        //             order_type: item.orderType,
        //             srv_call_no: this.srv_call_no,
        //           };
        //           break;
        //         case "condition":
        //           res = {
        //             col_name: item.colName,
        //             rule_type: ruleTypeMap[item.ruleType] || "近似于",
        //             val_type: "常量",
        //             const: item.value,
        //             srv_call_no: this.srv_call_no,
        //           };
        //           break;
        //         case "group":
        //           res = {
        //             col_name: item.colName,
        //             type_stat: item.type,
        //             seq: item.seq,
        //             alias_name: item.aliasName,
        //             srv_req_no: this.srv_call_no,
        //           };
        //           break;
        //       }
        //       return res;
        //     }),
        //   });
        // }
      });
      // 请求字段
      // 先删掉所有的
      // if (
      //   Array.isArray(this.childData.column) &&
      //   this.childData.column.length > 0
      // ) {
      // if (this.srv_call_no) {
      //   reqDatas.unshift({
      //     serviceName: `${serviceNames.column}_delete`,
      //     depend_keys: [
      //       {
      //         type: "column",
      //         add_col: "srv_call_no",
      //         depend_key: "srv_call_no",
      //       },
      //     ],
      //     condition: [
      //       {
      //         colName: "srv_call_no",
      //         ruleType: "eq",
      //         value: this.srv_call_no,
      //       },
      //       // {
      //       //   colName: "id",
      //       //   ruleType: "in",
      //       //   value: this.childData.column.map((item) => item.id).toString(),
      //       // },
      //     ],
      //   });
      // }

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
        item["seq"] = item.seq || null;
        this.columnsOption.push(item);
        // }
      });
      this.deleteListData();
      const checkedColumns = await this.fetchRequestColumns();
      debugger;
      if (Array.isArray(checkedColumns) && checkedColumns.length > 0) {
        this.checkedColumns = checkedColumns.map((item) => item.columns);
      } else {
        this.checkedColumns = this.columnsOption.map((item) => item.columns);
      }
      this.allColum.list = this.columnsOption;
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
              const data = [...item.list.map((d) => d[`_${key}`])];
              if (Array.isArray(data) && data.length) {
                data.forEach((d) => {
                  const obj = { ...d };
                  if (obj?.ruleType === "between" && Array.isArray(obj.value)) {
                    obj.value = obj.value
                      .map((o) => {
                        if (dayjs(o).isValid()) {
                          return dayjs(o).format("YYYY-MM-DD HH:mm:ss");
                        }
                        return o;
                      })
                      .toString();
                  }
                  endData[key].push(obj);
                });
              }
              // endData[key].push(...item.list.map((d) => d[`_${key}`]));
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
              return {
                colName: item.colName || item.col_name,
                ruleType: item.ruleType || item.rule_type,
                value: item.value,
              };
            }
          })
          .filter(Boolean);
      }
      if (this.reqData.group) {
        reqData.group = this.reqData.group
          .map((item) => {
            if (item.type) {
              return {
                colName: item.colName || item.col_name,
                aliasName: item.aliasName || item.alias_name,
                type: item.type,
              };
            }
          })
          .filter(Boolean);
      }
      if (this.reqData.order) {
        reqData.order = this.reqData.order.map((item) => {
          return {
            colName: item.col_name,
            orderType: item.order_type,
          };
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
      this.showPreview = true;
      this.$nextTick(() => {
        this.$refs.dataPreviewRef.handleGetData(reqData);
      });
      // this.getPreviewTableData(reqData);
    },
    calculateReq() {
      const addList = [];
      const deleteList = this.deleteList;
      const updateList = [];
      this.listData.forEach((item) => {
        if (Array.isArray(item.list) && item.list.length > 0) {
          item.list.forEach((i) => {
            if (i.__flag == "add" || !i.__flag) {
              addList.push({
                ...i,
                __type: item.type === "aggregation" ? "group" : item.type,
              });
            }
            if (i.__flag == "update") {
              updateList.push({
                ...i,
                __type: item.type === "aggregation" ? "group" : item.type,
              });
            }
          });
        }
      });
      console.log(addList, deleteList, updateList);
      return {
        addList,
        deleteList,
        updateList,
      };
    },
    saveConfig() {
      // 保存配置到服务器
      // const { addList, deleteList, updateList } = this.calculateReq();
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
        if (res.data.resultCode === "0011") {
          this.$refs?.loginRef?.open(() => {});
        }
      });
    },
    serviceChange(val) {
      this.ruleForm.service_name = val;
      this.getColumns();
    },
    appChange(val) {
      this.ruleForm.mapp = val;
      this.getServiceName();
    },
    reqTypeChange(val) {
      this.ruleForm.srv_type = val;
    },
    reqOptionChange(val) {
      this.checkedReqOptions = val;
      this.changeReqOption();
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
          this.fetchRequestConfig();
          this.changeReqOption();
          this.deleteList = [];
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
    async fetchOrderColumns() {
      const req = {
        serviceName: "srvpage_cfg_srv_call_order_select",
        colNames: ["*"],
        condition: [
          { colName: "srv_call_no", ruleType: "eq", value: this.srv_call_no },
        ],
      };
      const url = `/config/select/srvpage_cfg_srv_call_order_select`;
      const res = await this.$http.post(url, req);
      if (res?.data?.state === "SUCCESS") {
        if (Array.isArray(res.data.data) && res.data.data.length > 0) {
          return res.data.data;
        }
      }
    },
    async fetchConditionColumns() {
      const req = {
        serviceName: "srvpage_cfg_srv_call_cond_select",
        colNames: ["*"],
        condition: [
          { colName: "srv_call_no", ruleType: "eq", value: this.srv_call_no },
        ],
      };
      const url = `/config/select/srvpage_cfg_srv_call_cond_select`;
      const res = await this.$http.post(url, req);
      if (res?.data?.state === "SUCCESS") {
        if (Array.isArray(res.data.data) && res.data.data.length > 0) {
          return res.data.data;
        }
      }
    },
    async fetchGroupColumns() {
      const req = {
        serviceName: "srvpage_cfg_srv_call_group_stats_select",
        colNames: ["*"],
        condition: [
          { colName: "srv_req_no", ruleType: "eq", value: this.srv_call_no },
        ],
      };
      const url = `/config/select/srvpage_cfg_srv_call_group_stats_select`;
      const res = await this.$http.post(url, req);
      if (res?.data?.state === "SUCCESS") {
        if (Array.isArray(res.data.data) && res.data.data.length > 0) {
          return res.data.data;
        }
      }
    },
    async fetchRequestColumns() {
      const req = {
        serviceName: "srvpage_cfg_srv_call_req_cols_select",
        colNames: ["*"],
        condition: [
          { colName: "srv_call_no", ruleType: "eq", value: this.srv_call_no },
        ],
      };
      const url = `/config/select/srvpage_cfg_srv_call_req_cols_select`;
      const res = await this.$http.post(url, req);
      if (res?.data?.state === "SUCCESS") {
        if (Array.isArray(res.data.data) && res.data.data.length > 0) {
          return res.data.data;
        }
      }
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
          if (this.ruleForm.srv_req_name) {
            this.$nextTick(() => {
              document.title = this.ruleForm.srv_req_name;
            });
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
                  if (!item.alias_name && !item.aliasName) {
                    item.aliasName = "";
                  } else {
                    item.aliasName = item.alias_name || item.aliasName;
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
          const [conditionColumns, groupColumns, orderColumns] =
            await Promise.all([
              this.fetchConditionColumns(),
              this.fetchGroupColumns(),
              this.fetchOrderColumns(),
            ]);
          let condition = reqData.condition;
          condition = conditionColumns;
          const ruleTypeMap = {
            eq: "等于",
            等于: "eq",
            ne: "不等于",
            不等于: "ne",
            gt: "大于",
            大于: "gt",
            lt: "小于",
            小于: "lt",
            like: "近似于",
            近似于: "like",
            "like]": "开始于",
            开始于: "like]",
            "[like": "结束于",
            结束于: "[like",
            in: "包含",
            包含: "in",
            notin: "不包含",
            不包含: "notin",
            isnull: "为空",
            为空: "isnull",
            notnull: "不为空",
            不为空: "notnull",
            inset: "在集合中",
            在集合中: "inset",
            between: "在两者之间",
            在两者之间: "between",
          };
          if (Array.isArray(condition)) {
            condition.map((cond) => {
              this.allColum.list.map((column) => {
                if (
                  column.columns == cond.colName ||
                  column.columns == cond.col_name
                ) {
                  cond.ruleType = cond.ruleType || ruleTypeMap[cond.rule_type];
                  cond.value = cond.const;
                  if (
                    cond.ruleType === "between" &&
                    cond.value?.includes(",")
                  ) {
                    cond.value = cond.value.split(",");
                  }
                  column._condition = cond;
                  _condition.push(cond);
                  endData.condition.push({
                    ...column,
                    id: cond.id,
                    __flag: "db",
                    _raw: cond,
                  });
                }
              });
            });
          }

          let group = reqData.group;
          group = groupColumns;
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
              "min",
              "max",
              "avg",
              "count",
              "count_all",
              "distinct_count",
            ];
            group.map((groupItem) => {
              this.allColum.list.forEach((column) => {
                if (
                  column.columns == groupItem.colName ||
                  column.columns == groupItem.col_name
                ) {
                  groupItem.type = groupItem.type_stat || groupItem.type;
                  groupItem.aliasName =
                    groupItem.alias_name || groupItem.aliasName;
                  // 拆分分组字段跟聚合字段
                  if (aggregationTypes.includes(groupItem.type)) {
                    column._aggregation = groupItem;
                    if (!groupItem.alias_name && !groupItem.aliasName) {
                      column.aliasName = "";
                    } else {
                      column.aliasName =
                        groupItem.alias_name || groupItem.aliasName;
                    }
                    _aggregation.push(groupItem);
                    endData.aggregation.push({
                      ...column,
                      id: groupItem.id,
                      __flag: "db",
                      _raw: groupItem,
                    });
                  } else if (groupTypes.includes(groupItem.type)) {
                    column._group = groupItem;
                    _group.push(groupItem);
                    endData.group.push({
                      ...column,
                      id: groupItem.id,
                      __flag: "db",
                      _raw: groupItem,
                    });
                  } else if (!groupItem.type) {
                    groupItem.type = "by";
                    column._group = groupItem;
                    _group.push(groupItem);
                    endData.group.push({
                      ...column,
                      id: groupItem.id,
                      __flag: "db",
                      _raw: groupItem,
                    });
                  }
                }
              });
              // this.allColum.list.map((column) => {
              //   if (column.columns == groupItem.colName) {
              //     if (aggregationTypes.includes(groupItem.type)) {
              //       column._aggregation = groupItem;
              //       if (!groupItem.alias_name && !groupItem.aliasName) {
              //         column.aliasName = "";
              //       } else {
              //         column.aliasName =
              //           groupItem.alias_name || groupItem.aliasName;
              //       }
              //       _aggregation.push(groupItem);
              //       endData.aggregation.push({ ...column, __flag: "db" });
              //     } else if (groupTypes.includes(groupItem.type)) {
              //       column._group = groupItem;
              //       _group.push(groupItem);
              //       endData.group.push({ ...column, __flag: "db" });
              //     }
              //   }
              // });
            });
          }
          let order = reqData.order;
          order = orderColumns;
          if (order) {
            order.map((orderItem) => {
              this.allColum.list.map((column) => {
                if (
                  column.columns == orderItem.colName ||
                  column.columns == orderItem.col_name
                ) {
                  orderItem.orderType =
                    orderItem.orderType || orderItem.order_type;
                  column._order = orderItem;
                  _order.push(orderItem);
                  endData.order.push({
                    ...column,
                    id: orderItem.id,
                    __flag: "db",
                    _raw: orderItem,
                  });
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
    if (this.$route.query?.no || this.$route.params.no) {
      this.srv_call_no = this.$route.query?.no || this.$route.params.no;
      this.fetchRequestConfig();
    }
    this.changeReqOption();
    this.$nextTick(() => {
      document.title = "请求配置";
    });
  },
};
</script>

<style
  scoped
  lang="scss"
>
.hual {
  display: flex;
  flex-direction: column;
  max-width: 1600px;
  min-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  border-radius: 8px;

  .sing_hual {
    // margin-left: 0.5rem;
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

  .content-box {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 20px;
    // box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);

    .column-box {
      min-width: 20%;
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
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));

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
}
</style>