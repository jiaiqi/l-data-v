<template>
  <div>
    <el-dialog
      v-if="visible"
      title="更改父节点"
      :visible.sync="visible"
      :before-close="close"
    >
      <div class="flex justify-center flex-wrap">
        <div class="w-[100%] m-b-2" v-if="currentText">
          当前节点：<span class="text-blue m-r-2">{{ currentText }}</span>(父节点不能选择当前节点)
        </div>
        <el-cascader
        class="flex-1"
        style="min-width: 300px;"
        v-model="currentVal"
        :options="setOptions"
        :props="props"
        clearable
      ></el-cascader>
      <el-button type="primary" class="m-l-5" @click="confirm">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { cloneDeep } from "lodash-es";
import { onSelect } from "../../../service/api";
export default {
  props: {
    options: Array,
    optionInfo: Object,
    srvApp: String,
    topTreeData:Boolean
  },
  computed: {
    currentText() {
      if(this.optionInfo?.key_disp_col&&this.currentRow?.[this.optionInfo.key_disp_col]){
        return this.currentRow?.[this.optionInfo.key_disp_col]
      }
    }
  },
  data() {
    return {
      visible: false,
      currentRow: null,
      setOptions: [],
      currentVal: null,
      props: {
        checkStrictly: true,
        value: "value",
        label: "label",
        lazy: true,
        lazyLoad: (node, resolve) => {
          this.loadTree(node).then((res) => {
            resolve(res);
          });
        },
      },
    };
  },
  methods: {
    confirm() {
      let val = this.currentVal;
      if (Array.isArray(val) && val.length) {
        val = val[val.length - 1];
      } else {
        val = null;
      }
      this.$emit("confirm", val, cloneDeep(this.currentRow));
      this.close();
    },
    open(row) {
      this.currentRow = row;
      this.visible = true;
      this.currentVal = row[this.optionInfo.parent_col];
      this.loadParent();
      if (Array.isArray(this.options)) {
        if (this.optionInfo?.refed_col) {
          this.props.value = this.optionInfo?.refed_col;
          this.props.label =
            this.optionInfo?.key_disp_col || this.optionInfo?.refed_col;
        }
        this.setOptions = cloneDeep(this.options);
      }
    },
    close() {
      this.currentRow = null;
      this.currentVal = null;
      this.visible = false;
      this.setOptions = [];
    },
    loadParent() {
      let condition = [
        {
          colName: this.optionInfo.parent_col,
          ruleType: "isnull",
        },
      ];
      if(this.topTreeData){
        condition = null
      }
      onSelect(this.optionInfo.serviceName, this.srvApp, condition, {
        rownumber: 100,
        pageNo: 1,
        forceUseTTD:!!this.topTreeData,
        isTree: true,
      }).then((res) => {
        if (res?.data) {
          this.setOptions = res.data;
        }
      });
    },
    async loadTree(node) {
      if (node?.value) {
        const condition = [
          {
            colName: this.optionInfo.parent_col,
            ruleType: "eq",
            value: node.value,
          },
        ];
        const res = await onSelect(
          this.optionInfo.serviceName,
          this.srvApp,
          condition,
          {
            rownumber: 100,
            pageNo: 1,
          }
        );
        if (res?.data) {
          return res.data;
        } else return [];
      }
    },
  },
  watch: {
    options: {
      handler(newValue, oldValue) {
        // if (Array.isArray(newValue)) {
        //   if (this.optionInfo?.refed_col) {
        //     this.props.value = this.optionInfo?.refed_col;
        //     this.props.label =
        //       this.optionInfo?.key_disp_col || this.optionInfo?.refed_col;
        //   }
        //   this.setOptions = newValue;
        // }
      },
    },
  },
};
</script>

<style lang="scss" scoped></style>
