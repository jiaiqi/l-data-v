<template>
  <div
    class="flow-cell"
    :class="{ 'flow-cell--actions': showActionButtonGroup }"
    @dblclick.stop.prevent="openDetail"
  >
    <span v-if="!steps.length" class="flow-cell__empty">暂无流程</span>
    <div v-else class="flow-cell__track">
      <div
        v-for="(step, index) in steps"
        :key="getStepKey(step, index)"
        class="flow-cell__step"
        :title="stepTitle(step)"
      >
        <div
          v-if="index > 0"
          class="flow-cell__line"
          :class="`is-${step.status}`"
        ></div>
        <div
          class="flow-cell__node"
          :class="`is-${step.status}`"
          :style="{ '--flow-ratio': step.progressRatio }"
        >
          <i v-if="showDoneIcon(step)" class="el-icon-check"></i>
          <span v-else class="flow-cell__ratio cell--ratio">{{ step.ratio }}%</span>
        </div>
        <div class="flow-cell__name">{{ step.name || step.no || "-" }}</div>
      </div>
    </div>

    <div
      v-if="showActionButtonGroup"
      class="flow-cell__action-wrap"
      @click.stop
      @dblclick.stop
    >
      <action-button-group
        :visible="true"
        :buttons="actionButtons"
      />
    </div>

    <el-dialog
      title="流程详情"
      :visible.sync="detailVisible"
      append-to-body
      width="86vw"
      custom-class="flow-detail-dialog"
    >
      <div class="flow-cell__detail">
        <div class="flow-cell__detail-head">
          <span>{{ detailTitle }}</span>
          <span>共 {{ steps.length }} 项</span>
        </div>
        <div class="flow-cell__track flow-cell__track--detail">
          <div
            v-for="(step, index) in detailSteps"
            :key="getStepKey(step, index, 'detail')"
            class="flow-cell__step flow-cell__step--detail"
            :title="stepTitle(step)"
          >
            <div
              v-if="index > 0"
              class="flow-cell__line flow-cell__line--detail"
              :class="`is-${step.status}`"
            ></div>
            <div
              class="flow-cell__node flow-cell__node--detail"
              :class="`is-${step.status}`"
              :style="{ '--flow-ratio': step.progressRatio }"
            >
              <i v-if="showDoneIcon(step)" class="el-icon-check"></i>
              <span v-else class="flow-cell__ratio">{{ step.ratio }}%</span>
            </div>
            <div class="flow-cell__name flow-cell__name--detail">
              {{ step.name || step.no || "-" }}
            </div>
            <div class="flow-cell__no" v-if="step.no">{{ step.no }}</div>
          </div>
        </div>
      </div>
    </el-dialog>

    <fk-action-dialog
      :title="addDialogTitle"
      :visible.sync="addDialogVisible"
      custom-class="flow-action-dialog"
      :url="addIframeUrl"
      :iframe-key="addIframeKey"
      @add-success="handleActionAddSuccess"
      @update-success="handleActionUpdateSuccess"
      @close-dialog="handleActionCloseDialog"
    />

    <fk-action-dialog
      :title="editDialogTitle"
      :visible.sync="editDialogVisible"
      custom-class="flow-action-dialog"
      :url="editIframeUrl"
      :iframe-key="editIframeKey"
      @add-success="handleActionAddSuccess"
      @update-success="handleActionUpdateSuccess"
      @close-dialog="handleActionCloseDialog"
    />
  </div>
</template>

<script>
import { cloneDeep } from "lodash-es";
import { $http } from "@/common/http";
import addIcon from "@/assets/img/add.png";
import editIcon from "@/assets/img/edit.png";
import { ActionButtonGroup } from "./action-button";
import FkActionDialog from "./fk-select/fk-action-dialog.vue";
import { hasFkValue } from "../utils/fkOption";

const DEFAULT_FIELD_MAP = {
  // 后端未配置映射时，按当前 flow 字段约定兜底取值。
  seq_col: "seq",
  name_col: "operation_name",
  no_col: "operation_no",
  ratio_col: "schedule_ratio",
};

export default {
  name: "FlowCell",
  components: {
    ActionButtonGroup,
    FkActionDialog,
  },
  props: {
    value: {
      type: [String, Array, Object],
      default: "",
    },
    column: {
      type: Object,
      default: () => ({}),
    },
    row: {
      type: Object,
      default: () => ({}),
    },
    app: {
      type: String,
      default: "",
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    showActions: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      detailVisible: false,
      detailAnimatedRatios: {},
      detailAnimationFrame: null,
      addDialogVisible: false,
      editDialogVisible: false,
      addIframeKey: 0,
      editIframeKey: 0,
      editRecordId: null,
    };
  },
  watch: {
    detailVisible(visible) {
      if (visible) {
        this.$nextTick(this.startDetailAnimation);
      } else {
        this.stopDetailAnimation();
      }
    },
  },
  beforeDestroy() {
    this.stopDetailAnimation();
  },
  computed: {
    detailTitle() {
      return this.column?.label || this.column?.columns || "流程";
    },
    srvInfo() {
      return this.column?.redundant_options || this.column?.option_list_v2 || {};
    },
    dependField() {
      return (
        this.column?.redundant?.dependField ||
        this.srvInfo?._target_column ||
        null
      );
    },
    fkFieldValue() {
      if (!this.row || !this.dependField) {
        return null;
      }
      return this.row[this.dependField];
    },
    hasFkFieldValue() {
      return hasFkValue(this.fkFieldValue);
    },
    addSrvCfg() {
      return this.srvInfo?.add_srv_cfg;
    },
    updateSrvCfg() {
      return this.srvInfo?.update_srv_cfg;
    },
    showActionAddBtn() {
      return (
        !this.disabled &&
        !this.hasFkFieldValue &&
        this.addSrvCfg?.srv &&
        this.addSrvCfg?.permission !== false
      );
    },
    showActionEditBtn() {
      return (
        !this.disabled &&
        this.hasFkFieldValue &&
        this.updateSrvCfg?.srv &&
        this.updateSrvCfg?.permission !== false
      );
    },
    actionButtons() {
      const buttons = [];
      if (this.showActionAddBtn) {
        buttons.push({
          key: "add",
          icon: addIcon,
          text: "新增",
          title: "新增",
          className: "btn-add",
          handler: this.handleAddDialog,
        });
      }
      if (this.showActionEditBtn) {
        buttons.push({
          key: "edit",
          icon: editIcon,
          text: "编辑",
          title: "编辑",
          className: "btn-edit",
          handler: this.handleEditDialog,
        });
      }
      return buttons;
    },
    showActionButtonGroup() {
      return this.showActions && this.actionButtons.length > 0;
    },
    addDialogTitle() {
      return this.addSrvCfg?.title || "新增";
    },
    editDialogTitle() {
      return this.updateSrvCfg?.title || "编辑";
    },
    flowValueField() {
      return (
        this.column?.redundant?.refedCol ||
        this.srvInfo?.key_disp_col ||
        this.column?.columns ||
        null
      );
    },
    addDefaultData() {
      const data = {};
      if (this.srvInfo?.refed_col && this.hasFkFieldValue) {
        data[this.srvInfo.refed_col] = this.fkFieldValue;
      }
      if (this.flowValueField && hasFkValue(this.value)) {
        data[this.flowValueField] = this.value;
      }
      return data;
    },
    addIframeUrl() {
      if (!this.addSrvCfg?.srv) {
        return "";
      }
      let url = `/vpages/#/add/${this.addSrvCfg.srv}`;
      const params = [];
      if (Object.keys(this.addDefaultData).length) {
        params.push(`operate_params=${JSON.stringify({ data: [this.addDefaultData] })}`);
      }
      if (this.addSrvCfg?.app || this.app) {
        params.push(`srvApp=${encodeURIComponent(this.addSrvCfg?.app || this.app)}`);
      }
      if (params.length) {
        url += `?${params.join("&")}`;
      }
      return url;
    },
    editIframeUrl() {
      if (!this.updateSrvCfg?.srv || !this.hasFkFieldValue) {
        return "";
      }
      let url = `/vpages/#/update/${this.updateSrvCfg.srv}/${this.editRecordId}`;
      const params = [];
      if (this.updateSrvCfg?.app || this.app) {
        params.push(`srvApp=${encodeURIComponent(this.updateSrvCfg?.app || this.app)}`);
      }
      if (params.length) {
        url += `?${params.join("&")}`;
      }
      return url;
    },
    fieldMap() {
      return {
        ...DEFAULT_FIELD_MAP,
        ...this.parseJsonLike(this.column?.params_cfg),
        ...this.parseJsonLike(this.column?.col_pro_json),
      };
    },
    steps() {
      const list = this.parseFlowValue(this.value);
      const { seq_col, name_col, no_col, ratio_col } = this.fieldMap;

      return list
        .map((item, index) => {
          const ratio = this.normalizeRatio(item?.[ratio_col]);
          return {
            seq: item?.[seq_col] ?? index,
            name: item?.[name_col] ?? "",
            no: item?.[no_col] ?? "",
            ratio,
            progressRatio: this.getProgressRatio(ratio),
            status: this.resolveStatus(ratio),
          };
        })
        .sort((a, b) => this.sortValue(a.seq) - this.sortValue(b.seq));
    },
    detailSteps() {
      return this.steps.map((step, index) => {
        const key = this.getStepKey(step, index, "detail");
        const ratio = Math.round(this.detailAnimatedRatios[key] || 0);

        return {
          ...step,
          actualRatio: step.ratio,
          ratio,
          progressRatio: this.getProgressRatio(ratio),
          status: this.resolveStatus(ratio),
        };
      });
    },
  },
  methods: {
    handleAddDialog() {
      if (this.disabled || !this.addSrvCfg?.srv) {
        return;
      }
      this.addIframeKey += 1;
      this.addDialogVisible = true;
    },
    handleEditDialog() {
      if (this.disabled || !this.updateSrvCfg?.srv || !this.hasFkFieldValue) {
        return;
      }
      if (this.editRecordId) {
        this.editIframeKey += 1;
        this.editDialogVisible = true;
        return;
      }
      this.fetchEditRecordId().then(() => {
        if (this.editRecordId) {
          this.editIframeKey += 1;
          this.editDialogVisible = true;
        }
      });
    },
    async fetchEditRecordId() {
      const fkValue = this.fkFieldValue;
      if (!hasFkValue(fkValue) || !this.srvInfo?.refed_col) {
        return;
      }
      const req = {
        serviceName: this.srvInfo.serviceName,
        colNames: ["*"],
        condition: [
          {
            colName: this.srvInfo.refed_col,
            ruleType: "eq",
            value: fkValue,
          },
        ],
        page: {
          pageNo: 1,
          rownumber: 1,
        },
      };
      const appName =
        this.srvInfo?.srv_app || this.app || sessionStorage.getItem("current_app");
      if (!req.serviceName || !appName) {
        return;
      }
      const res = await $http.post(`/${appName}/select/${req.serviceName}`, req);
      if (res.data.state === "SUCCESS" && res.data.data?.length) {
        this.editRecordId = res.data.data[0].id;
      }
    },
    handleActionAddSuccess(data) {
      this.$message.success("添加成功");
      this.addDialogVisible = false;
      const actionData = this.resolveActionData(data);
      this.syncRowFromActionData(actionData);
      this.$emit("add-success", {
        ...actionData,
        addedId: actionData.id || data?.id || data?.effectData?.id,
      });
    },
    handleActionUpdateSuccess(data) {
      this.$message.success("更新成功");
      this.editDialogVisible = false;
      const actionData = this.resolveActionData(data);
      this.syncRowFromActionData(actionData);
      this.editRecordId = null;
      this.$emit("edit-success", {
        ...actionData,
        updatedId: actionData.id || data?.id || data?.effectData?.id,
      });
    },
    handleActionCloseDialog() {
      this.addDialogVisible = false;
      this.editDialogVisible = false;
    },
    resolveActionData(data) {
      if (!data) {
        return {};
      }
      if (Array.isArray(data?.effectData)) {
        return data.effectData[0] || {};
      }
      return data.effectData || data;
    },
    syncRowFromActionData(actionData = {}) {
      if (!this.row || !Object.keys(actionData).length) {
        return;
      }
      const changedFields = [];
      const dependField = this.dependField;
      const refedCol = this.srvInfo?.refed_col;
      const fkValue = hasFkValue(actionData[refedCol])
        ? actionData[refedCol]
        : actionData.id;

      if (dependField && hasFkValue(fkValue)) {
        this.$set(this.row, dependField, fkValue);
        this.$set(this.row, `_${dependField}_data`, cloneDeep(actionData));
        this.$set(this.row, "_rawData", cloneDeep(actionData));
        changedFields.push(dependField);
      }

      const flowField = this.column?.columns;
      if (
        flowField &&
        this.flowValueField &&
        Object.prototype.hasOwnProperty.call(actionData, this.flowValueField)
      ) {
        this.$set(this.row, flowField, actionData[this.flowValueField]);
        changedFields.push(flowField);
      }

      this.markRowChanged(changedFields);
    },
    markRowChanged(fields = []) {
      if (!this.row || this.row.__flag !== "add" || !fields.length) {
        return;
      }
      if (!this.row.__update_col) {
        this.$set(this.row, "__update_col", {});
      }
      fields.filter(Boolean).forEach((field) => {
        this.$set(this.row.__update_col, field, true);
      });
    },
    parseJsonLike(value) {
      if (!value) {
        return {};
      }
      if (typeof value === "object") {
        return value;
      }
      try {
        return JSON.parse(value);
      } catch (error) {
        return {};
      }
    },
    parseFlowValue(value) {
      if (Array.isArray(value)) {
        return value;
      }
      if (!value || typeof value !== "string") {
        return [];
      }
      try {
        const result = JSON.parse(value);
        return Array.isArray(result) ? result : [];
      } catch (error) {
        return [];
      }
    },
    normalizeRatio(value) {
      const numberValue = Number(value);
      if (Number.isNaN(numberValue)) {
        return 0;
      }
      return Math.max(0, Math.round(numberValue));
    },
    getProgressRatio(ratio) {
      return Math.min(100, ratio);
    },
    sortValue(value) {
      const numberValue = Number(value);
      return Number.isNaN(numberValue) ? 0 : numberValue;
    },
    resolveStatus(ratio) {
      if (ratio === 0) {
        return "zero";
      }
      if (ratio <= 25) {
        return "low";
      }
      if (ratio <= 50) {
        return "middle";
      }
      if (ratio <= 75) {
        return "upper";
      }
      if (ratio < 100) {
        return "near";
      }
      if (ratio >= 100) {
        return "done";
      }
      return "zero";
    },
    stepTitle(step) {
      const ratio = step.actualRatio ?? step.ratio;
      const texts = [
        step.name ? `名称：${step.name}` : "",
        step.no ? `编号：${step.no}` : "",
        `进度：${ratio}%`,
      ];
      return texts.filter(Boolean).join("\n");
    },
    showDoneIcon(step) {
      const actualRatio = step.actualRatio ?? step.ratio;
      return actualRatio === 100 && step.ratio >= 100;
    },
    getStepKey(step, index, prefix = "cell") {
      return `${prefix}-${step.no || `${step.seq}-${index}`}`;
    },
    openDetail() {
      if (this.steps.length) {
        this.detailVisible = true;
      }
    },
    startDetailAnimation() {
      this.stopDetailAnimation();
      this.detailAnimatedRatios = {};

      const targets = this.steps.map((step, index) => ({
        key: this.getStepKey(step, index, "detail"),
        ratio: step.ratio,
      }));
      if (!targets.length) {
        return;
      }

      const startTime = performance.now();
      const duration = 1150;
      const stagger = 70;

      targets.forEach((item) => {
        this.$set(this.detailAnimatedRatios, item.key, 0);
      });

      const animate = (time) => {
        let finished = true;

        targets.forEach((item, index) => {
          const progress = Math.max(
            0,
            Math.min(1, (time - startTime - index * stagger) / duration)
          );
          const eased = this.easeOutCubic(progress);
          this.$set(this.detailAnimatedRatios, item.key, item.ratio * eased);

          if (progress < 1) {
            finished = false;
          }
        });

        if (!finished) {
          this.detailAnimationFrame = requestAnimationFrame(animate);
        } else {
          this.detailAnimationFrame = null;
        }
      };

      this.detailAnimationFrame = requestAnimationFrame(animate);
    },
    stopDetailAnimation() {
      if (this.detailAnimationFrame) {
        cancelAnimationFrame(this.detailAnimationFrame);
        this.detailAnimationFrame = null;
      }
    },
    easeOutCubic(progress) {
      return 1 - Math.pow(1 - progress, 3);
    },
  },
};
</script>

<style lang="scss" scoped>
.flow-cell {
  position: relative;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  padding: 2px 0 1px;
}

.flow-cell--actions {
  overflow: visible;
}

.flow-cell__action-wrap {
  position: absolute;
  top: 50%;
  right: 0;
  z-index: 10;
  transform: translateY(-50%);
}

.flow-cell__empty {
  color: #a8abb2;
  font-size: 12px;
}

.flow-cell__track {
  display: flex;
  align-items: flex-start;
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 1px 6px 4px;
  scrollbar-width: thin;
  scrollbar-color: #c8d0da #fff;
}

.flow-cell__track--detail {
  align-items: flex-start;
  min-height: 164px;
  padding: 20px 18px 24px;
}

.flow-cell__track::-webkit-scrollbar {
  height: 6px;
}

.flow-cell__track::-webkit-scrollbar-thumb {
  background: #c8d0da;
  border-radius: 999px;
}

.flow-cell__step {
  position: relative;
  display: flex;
  flex: 0 0 78px;
  flex-direction: column;
  align-items: center;
}

.flow-cell__step--detail {
  flex-basis: 132px;
}

.flow-cell__line {
  position: absolute;
  top: 17px;
  left: -39px;
  z-index: 0;
  width: 78px;
  height: 2px;
  background: linear-gradient(90deg, #d8dee8 0%, #d8dee8 100%);

  &.is-zero {
    background: linear-gradient(90deg, #e2e8f0 0%, #94a3b8 100%);
  }

  &.is-low {
    background: linear-gradient(90deg, #fecdca 0%, #f04438 100%);
  }

  &.is-middle {
    background: linear-gradient(90deg, #fedf89 0%, #f79009 100%);
  }

  &.is-upper {
    background: linear-gradient(90deg, #b9e6fe 0%, #2e90fa 100%);
  }

  &.is-near {
    background: linear-gradient(90deg, #d1fadf 0%, #32d583 100%);
  }

  &.is-done {
    background: linear-gradient(90deg, #32d583 0%, #027a48 100%);
    box-shadow: 0 0 0 1px rgba(3, 152, 85, 0.18);
  }
}

.flow-cell__line--detail {
  top: 30px;
  left: -66px;
  width: 132px;
  height: 3px;
}

.flow-cell__node {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 2px solid transparent;
  border-radius: 50%;
  background:
    linear-gradient(#fff, #fff) padding-box,
    conic-gradient(currentColor calc(var(--flow-ratio) * 1%), #eef2f7 0)
      border-box;
  box-shadow: inset 0 0 0 3px #fff;
  color: #94a3b8;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
}
.cell--ratio {
  transform: scale(.6);
}
.flow-cell__node--detail {
  width: 60px;
  height: 60px;
  box-shadow: inset 0 0 0 6px #fff;
  font-size: 15px;
}

.flow-cell__node.is-zero {
  color: #667085;
  background:
    linear-gradient(#f8fafc, #f8fafc) padding-box,
    conic-gradient(currentColor 1%, #e2e8f0 0) border-box;
}

.flow-cell__node.is-low {
  color: #d92d20;
  background:
    linear-gradient(#fef3f2, #fef3f2) padding-box,
    conic-gradient(currentColor calc(var(--flow-ratio) * 1%), #fee4e2 0)
      border-box;
}

.flow-cell__node.is-middle {
  color: #b54708;
  background:
    linear-gradient(#fffaeb, #fffaeb) padding-box,
    conic-gradient(currentColor calc(var(--flow-ratio) * 1%), #fedf89 0)
      border-box;
}

.flow-cell__node.is-upper {
  color: #1570ef;
  background:
    linear-gradient(#eff8ff, #eff8ff) padding-box,
    conic-gradient(currentColor calc(var(--flow-ratio) * 1%), #d1e9ff 0)
      border-box;
}

.flow-cell__node.is-near {
  color: #12b76a;
  background:
    linear-gradient(#f6fef9, #f6fef9) padding-box,
    conic-gradient(currentColor calc(var(--flow-ratio) * 1%), #d1fadf 0)
      border-box;
}

.flow-cell__node.is-done {
  border-color: #027a48;
  background: #039855;
  box-shadow:
    0 0 0 3px #d1fadf,
    inset 0 0 0 3px rgba(255, 255, 255, 0.22);
  color: #fff;
}

.flow-cell__node.is-done .el-icon-check {
  font-size: 16px;
  font-weight: 800;
}

.flow-cell__node--detail.is-done .el-icon-check {
  font-size: 26px;
}

.flow-cell__name {
  max-width: 70px;
  margin-top: 3px;
  overflow: hidden;
  color: #334155;
  font-size: 11px;
  line-height: 14px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flow-cell__name--detail {
  max-width: 118px;
  margin-top: 8px;
  color: #1f2937;
  font-size: 13px;
  font-weight: 600;
  line-height: 18px;
}

.flow-cell__no {
  max-width: 118px;
  margin-top: 4px;
  overflow: hidden;
  color: #8a96a8;
  font-size: 11px;
  line-height: 16px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flow-cell__detail {
  overflow: hidden;
}

.flow-cell__detail-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 4px 12px;
  border-bottom: 1px solid #edf1f7;
  color: #3f4a5a;
  font-size: 13px;
}
</style>

<style lang="scss">
.flow-detail-dialog {
  .el-dialog__body {
    padding: 16px 22px 22px;
  }
}

.flow-action-dialog {
  .el-dialog__body {
    padding: 0 20px 20px;
    min-height: 70vh;

    iframe {
      width: 100%;
      height: 100%;
    }
  }
}
</style>
