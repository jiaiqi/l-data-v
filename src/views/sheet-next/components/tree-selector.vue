<template>
  <div>
    <el-input placeholder="输入关键字进行过滤" clearable v-model="keyword" @focus="onFocus" @input="onFilterInput"
        @clear="onFilterClear" style="width: 300px;margin-bottom: 5px;">
      </el-input>
    <el-popover placement="bottom-center" ref="treePopover" trigger="click" @show="onPopoverShow">
      <el-cascader-panel :props="props" :is-border="false" :options="options" @change="onSelectChange" :emitPath="false"
        checkStrictly></el-cascader-panel>
    </el-popover>
  </div>
</template>

<script>
import { getFkOptions, onSelect } from "../../../service/api";
import {cloneDeep} from 'lodash-es'
export default {
  props: {
    disabled: Boolean,
    srvInfo: Object,
    srvApp:String,
    topTreeData:Boolean,
    value:String,
    currentRow:Object
  },
  data() {
    return {
      keyword: '',
      modelValue: '',
      options: [],
      allOptions: [],
    }
  },
  created(){
    this.loadParent()
  },
  computed: {
    props() {
      return {
        emitPath: false,
        checkStrictly: true,
        value: "value",
        label: "label",
        lazy: true,
        lazyLoad: (node, resolve) => {
          this.loadTree(node).then((res) => {
            resolve(res);
          });
        },
      }
    }
  },
  methods: {
    onFilterClear() {
      this.keyword = ''
      this.$emit('select', '')
      this.loadParent()
    },
    onPopoverShow() {
      // this.onFocus()
      // this.modelValue = this.value
      // this.loadParent(this.modelValue).then(res => {
      //   // if (res?.length === 1) {
      //   //   this.onSelectChange(res.map(item => item[this.srvInfo.refed_col]))
      //   // }
      // })
    },
    onSelectChange(val) {
      if (Array.isArray(val) && val?.length) {
        val = val[0]
      }
      this.$refs?.treePopover?.doClose()
      this.modelValue = val;
      let current = this.allOptions.find(item => item[this.srvInfo.refed_col] === val)
      this.keyword = current?.label
      this.$emit("select", val,current);
      // let currentValue = this.allOptions.find(item => item[this.srvInfo.refed_col] === this.modelValue);
      // if (currentValue) {
      //   this.$emit('select', {
      //     value: this.modelValue,
      //     rawData: currentValue
      //   })
      // } else {
      //   this.$emit("input", val);
      // }
    },
    onFilterInput(value) {
      this.keyword = value
      this.loadParent(value)
    },
    onFocus() {
      this.$refs.treePopover.doShow()
      this.loadParent()
      this.$emit('onfocus')
    },
    loadParent(val, callback) {
      let relation_condition = null
      let condition = [
        // {
        //   colName: this.srvInfo.parent_col,
        //   ruleType: "isnull",
        // },
        // {
        //   colName: this.srvInfo.refed_col,
        //   ruleType: "ne",
        //   value: this.currentRow[this.srvInfo.refed_col],
        // }
      ];
      if (this.topTreeData) {
        condition = null
      }
      if (val) {
        relation_condition = {
          relation: "OR",
          data: [{
            colName: this.srvInfo.refed_col,
            ruleType: "like",
            value: val
          }, {
            colName: this.srvInfo.key_disp_col,
            ruleType: "like",
            value: val
          }],
        };
      }
      onSelect(this.srvInfo.serviceName, this.srvApp, condition, {
        rownumber: 99999,
        pageNo: 1,
        forceUseTTD: !!this.topTreeData,
        isTree: true,
        relation_condition
      }).then((res) => {
        if (res?.data) {
          this.options = res.data.map(item => {
            item.leaf = item.leaf === '是'
            item.label = item[this.srvInfo.key_disp_col];
            item.value = item[this.srvInfo.refed_col];
            return item
          });
          this.allOptions.push(...res.data)
          if (callback && typeof callback === 'function') {
            callback(cloneDeep(this.options))
          }
        }
      });
    },
    async loadTree(node,callback) {
      if (node?.value) {
        const option = this.srvInfo;
        const condition = [
          {
            colName: this.srvInfo.parent_col,
            ruleType: "eq",
            value: node.value,
          },
        ];
        const res = await onSelect(
          this.srvInfo.serviceName,
          this.srvApp,
          condition,
          {
            rownumber: 100,
            pageNo: 1,
          }
        );
        if (res?.data) {
          const result = res.data.map((item) => {
            item.label = item[option.key_disp_col];
            item.value = item[option.refed_col];
            item.leaf = item.is_leaf === '是'
            return item;
          });
          this.allOptions.push(...result)
          return result
        } else return [];
      }
    },
  },
}
</script>

<style lang="scss" scoped>
::v-deep .el-popover.el-popper{
max-width: 700px;
}
</style>