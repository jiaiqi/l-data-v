<template>
  <div>
    <el-dialog v-if="visible" title="更改父节点" :visible.sync="visible" :before-close="close">
      <div class="flex justify-center flex-wrap">
        <div class="w-[100%] m-b-2" v-if="currentText">
          当前节点：<span class="text-blue m-r-2">{{ currentText }}</span>(父节点不能选择当前节点)
        </div>

        <lazy-cascader filterable clearable :currentRow="currentRow" :srvApp="srvApp" :srvInfo="optionInfo"
          :topTreeData="topTreeData" @select="onSelect" v-if="visible"></lazy-cascader>


        <!-- <el-cascader class="flex-1" style="min-width: 300px;" v-model="currentVal" :options="setOptions" :props="props"
          @input.native="inputChange" filterable clearable></el-cascader> -->
        <el-button type="primary" class="m-l-5" @click="confirm">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { cloneDeep, debounce } from "lodash-es";
import { onSelect } from "../../../service/api";
import LazyCascader from "./tree-selector.vue";
let _this
export default {
  components: {
    LazyCascader,
  },
  props: {
    options: Array,
    optionInfo: Object,
    srvApp: String,
    topTreeData: Boolean
  },
  computed: {
    currentProps() {
      return {
        checkStrictly: true,
        label: this.optionInfo.key_disp_col,
        value: this.optionInfo.refed_col,
        lazyLoad: this.loadParent,
        lazySearch: this.loadTree
      }
    },
    currentValue() {
      if (this.optionInfo?.refed_col && this.currentRow?.[this.optionInfo.refed_col]) {
        return this.currentRow?.[this.optionInfo.refed_col]
      }
    },
    currentText() {
      if (this.optionInfo?.key_disp_col && this.currentRow?.[this.optionInfo.key_disp_col]) {
        return this.currentRow?.[this.optionInfo.key_disp_col]
      }
    }
  },
  data() {
    return {
      visible: false,
      currentRow: null,
      setOptions: [],
      currentVal: [],
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
    inputChange: debounce((e) => {
      const val = e.target.value;
      _this.loadParent(val)
    }, 300),
    onSelect(val) {
      if(val){
        this.currentVal = [val]
      }else{
        this.currentVal = []
      }
      // this.$emit("confirm", val, cloneDeep(this.currentRow));
      // this.close();
    },
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
      // this.loadParent();
      // if (Array.isArray(this.options)) {
      //   if (this.optionInfo?.refed_col) {
      //     this.props.value = this.optionInfo?.refed_col;
      //     this.props.label =
      //       this.optionInfo?.key_disp_col || this.optionInfo?.refed_col;
      //   }
      //   this.setOptions = cloneDeep(this.options);
      // }
    },
    close() {
      this.currentRow = null;
      this.currentVal = null;
      this.visible = false;
      this.setOptions = [];
    },
    loadParent(val, callback) {
      let relation_condition = null
      let condition = [
        // {
        //   colName: this.optionInfo.parent_col,
        //   ruleType: "isnull",
        // },
        {
          colName: this.optionInfo.refed_col,
          ruleType: "ne",
          value: this.currentRow[this.optionInfo.refed_col],
        }
      ];
      if (this.topTreeData) {
        condition = null
      }
      if (val) {
        relation_condition = {
          relation: "OR",
          data: [{
            colName: this.optionInfo.refed_col,
            ruleType: "like",
            value: val
          }, {
            colName: this.optionInfo.key_disp_col,
            ruleType: "like",
            value: val
          }],
        };
      }
      onSelect(this.optionInfo.serviceName, this.srvApp, condition, {
        rownumber: 99999,
        pageNo: 1,
        forceUseTTD: !!this.topTreeData,
        isTree: true,
        relation_condition
      }).then((res) => {
        if (res?.data) {
          this.setOptions = res.data.map(item => {
            item.leaf = item.leaf === '是'
            return item
          });
          if (callback && typeof callback === 'function') {
            callback(cloneDeep(this.setOptions))
          }
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
          if (callback && typeof callback === 'function') {
            callback(cloneDeep(res.data.map(item => {
              item.leaf = item.leaf === '是'
              return item
            })))
          }
          return res.data.map(item => {
            item.leaf = item.leaf === '是'
            return item
          });;

        } else {
          if (callback && typeof callback === 'function') {
            callback([])
          }
          return []
        };
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
  mounted() {
    _this = this;
  },
};
</script>

<style lang="scss" scoped></style>
