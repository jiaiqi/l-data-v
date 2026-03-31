<template>
  <div
    class="trig-act-cell"
    ref="cellRef"
    v-clickoutside="handleClickOutside"
    tabindex="0"
    @focus="handleFocus"
    @blur="handleBlur"
  >
    <span class="cell-value">{{ displayValue }}</span>
    <div class="action-icons" v-if="isFocused">
      <i
        v-if="hasAddSrv"
        class="icon-add el-icon-plus"
        title="新增"
        @click.stop="openAddDialog"
      ></i>
      <i
        v-if="hasSelSrv"
        class="icon-history el-icon-time"
        title="历史记录"
        @click.stop="openHistoryDialog"
      ></i>
    </div>

    <el-dialog
      :title="addDialogConfig.title"
      :visible.sync="addDialogVisible"
      width="600px"
      append-to-body
    >
      <el-form label-width="100px">
        <el-form-item
          v-for="field in addDialogConfig.fields"
          :key="field.field"
          :label="field.label"
        >
          <el-input
            v-if="field.type === 'input'"
            v-model="addFormData[field.field]"
            :placeholder="'请输入' + field.label"
          ></el-input>
          <el-select
            v-else-if="field.type === 'select'"
            v-model="addFormData[field.field]"
            :placeholder="'请选择' + field.label"
            style="width: 100%"
          >
            <el-option
              v-for="opt in field.options"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            ></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="addDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleAddSubmit">确 定</el-button>
      </span>
    </el-dialog>

    <el-dialog
      title="历史记录"
      :visible.sync="historyDialogVisible"
      width="800px"
      append-to-body
    >
      <el-table :data="historyTableData" style="width: 100%">
        <el-table-column
          v-for="col in historyTableColumns"
          :key="col.prop"
          :prop="col.prop"
          :label="col.label"
          :width="col.width"
        ></el-table-column>
      </el-table>
      <el-pagination
        style="margin-top: 16px; text-align: right"
        background
        layout="total, prev, pager, next"
        :total="historyTotal"
        :page-size="10"
        :current-page.sync="historyPageNo"
        @current-change="loadHistoryData"
      ></el-pagination>
    </el-dialog>
  </div>
</template>

<script>
import { cloneDeep } from "lodash-es";

export default {
  name: "TrigActCell",
  props: {
    row: {
      type: Object,
      required: true,
    },
    column: {
      type: Object,
      required: true,
    },
    fieldInfo: {
      type: Object,
    },
    app: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      isFocused: false,
      addDialogVisible: false,
      historyDialogVisible: false,
      addFormData: {},
      historyTableData: [],
      historyTableColumns: [],
      historyTotal: 0,
      historyPageNo: 1,
    };
  },
  computed: {
    trigAct() {
      return this.fieldInfo?.trig_act || this.column?.__field_info?.trig_act;
    },
    fkConfig() {
      return this.trigAct?.fk || null;
    },
    addSrvConfig() {
      return this.trigAct?.add_srv || null;
    },
    selSrvConfig() {
      return this.trigAct?.sel_srv || null;
    },
    hasAddSrv() {
      return !!this.addSrvConfig?.srv;
    },
    hasSelSrv() {
      return !!this.selSrvConfig?.srv;
    },
    displayValue() {
      return this.row?.[this.column?.field] ?? "";
    },
    addDialogConfig() {
      return {
        title: "新增记录",
        fields: [
          { field: "name", label: "名称", type: "input" },
          { field: "type", label: "类型", type: "select", options: [
            { label: "类型A", value: "a" },
            { label: "类型B", value: "b" },
          ]},
          { field: "remark", label: "备注", type: "input" },
        ],
      };
    },
  },
  methods: {
    handleFocus() {
      this.isFocused = true;
    },
    handleBlur() {
      this.isFocused = false;
    },
    handleClickOutside() {
      this.isFocused = false;
    },
    openAddDialog() {
      this.addFormData = {};
      if (this.fkConfig) {
        const refedCol = this.fkConfig.referenced_column_name;
        const currentCol = this.fkConfig.column_name;
        if (refedCol && currentCol && this.row[currentCol]) {
          this.addFormData[refedCol] = this.row[currentCol];
        }
      }
      this.addDialogVisible = true;
    },
    openHistoryDialog() {
      this.historyPageNo = 1;
      this.loadHistoryData();
      this.historyDialogVisible = true;
    },
    handleAddSubmit() {
      console.log("新增数据:", this.addFormData);
      this.$message.success("新增成功（演示）");
      this.addDialogVisible = false;
    },
    loadHistoryData() {
      const fkValue = this.row?.[this.fkConfig?.column_name];
      console.log("加载历史记录, 外键值:", fkValue, "服务:", this.selSrvConfig?.srv);

      this.historyTableColumns = [
        { prop: "name", label: "名称", width: 150 },
        { prop: "type", label: "类型", width: 100 },
        { prop: "create_time", label: "创建时间", width: 180 },
        { prop: "remark", label: "备注" },
      ];

      this.historyTableData = [
        { name: "记录1", type: "类型A", create_time: "2024-01-15 10:30:00", remark: "示例备注1" },
        { name: "记录2", type: "类型B", create_time: "2024-01-16 14:20:00", remark: "示例备注2" },
        { name: "记录3", type: "类型A", create_time: "2024-01-17 09:15:00", remark: "示例备注3" },
      ];
      this.historyTotal = 3;
    },
  },
};
</script>

<style lang="scss" scoped>
.trig-act-cell {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  position: relative;
  outline: none;

  .cell-value {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .action-icons {
    position: absolute;
    right: 4px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    gap: 4px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 4px;
    padding: 2px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    i {
      font-size: 14px;
      color: #409eff;
      cursor: pointer;
      padding: 2px;

      &:hover {
        color: #66b1ff;
      }
    }
  }
}
</style>
