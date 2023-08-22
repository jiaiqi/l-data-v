<template>
  <div style="width: 100vw; height: 100vh">
    <div id="container" style="width: 100%; height: 100%"></div>
  </div>
</template>

<script>
import { initGraph, erData, buildErData } from "./util";
import { Snapline } from "@antv/x6-plugin-snapline";
export default {
  name: "TableGraph",
  data() {
    return {
      graph: null,
      erData: [],
    };
  },
  methods: {
    async loadTables() {
      const url = `/config/select/srvsys_table_defined_select`;
      const req = {
        serviceName: "srvsys_table_defined_select",
        colNames: ["*"],
        condition: [],
        relation_condition: {},
        page: { pageNo: 1, rownumber: 10 },
      };
      const res = await this.$http.post(url, req);
      console.log(res);
      if (res.data.state === "SUCCESS") {
        const resData = res.data.data;
        const columns = await this.loadTableColumns(resData);
        if (resData?.length && resData.length === columns?.length) {
          resData.forEach((item, index) => {
            item.columns = [];
            if (columns[index]?.state === "SUCCESS") {
              item.columns = columns[index].data;
            }
          });
        }
        console.log(resData);
        this.erData = buildErData(resData) || [];
        return this.erData;
        // this.graph.fromJSON({
        //   edges: this.erData,
        // });
      }
    },
    async loadTableColumns(tables = []) {
      const url = `/config/multi/select`;
      const req = tables.map((item) => {
        return {
          serviceName: "srvsys_table_columns_view_select",
          colNames: ["*"],
          condition: [
            {
              colName: "table_name",
              ruleType: "eq",
              value: item.table_name,
            },
          ],
          page: { pageNo: 1, rownumber: 100 },
        };
      });
      const res = await this.$http.post(url, req);
      console.log(res);
      if (res.data.state === "SUCCESS") {
        const resData = res.data.data;
        return resData;
      }
    },
  },
  mounted() {
    this.loadTables().then((data) => {
      this.graph = initGraph(document.getElementById("container"), data);
      // // 加载数据
      // this.graph.fromJSON({
      //   edges: erData,
      // });
      //居中
      this.graph.centerContent();
      // 对齐线
      this.graph.use(
        new Snapline({
          enabled: true,
        })
      );
    });
  },
};
</script>

<style lang="scss" scoped></style>
