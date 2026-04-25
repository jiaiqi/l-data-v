<template>
  <div class="flow-cell" @dblclick.stop.prevent="openDetail">
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
          <i v-if="step.ratio === 100" class="el-icon-check"></i>
          <span v-else class="flow-cell__ratio cell--ratio">{{ step.ratio }}%</span>
        </div>
        <div class="flow-cell__name">{{ step.name || step.no || "-" }}</div>
      </div>
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
            v-for="(step, index) in steps"
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
              <i v-if="step.ratio === 100" class="el-icon-check"></i>
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
  </div>
</template>

<script>
const DEFAULT_FIELD_MAP = {
  // 后端未配置映射时，按当前 flow 字段约定兜底取值。
  seq_col: "seq",
  name_col: "operation_name",
  no_col: "operation_no",
  ratio_col: "schedule_ratio",
};

export default {
  name: "FlowCell",
  props: {
    value: {
      type: [String, Array],
      default: "",
    },
    column: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      detailVisible: false,
    };
  },
  computed: {
    detailTitle() {
      return this.column?.label || this.column?.columns || "流程";
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
  },
  methods: {
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
      const texts = [
        step.name ? `名称：${step.name}` : "",
        step.no ? `编号：${step.no}` : "",
        `进度：${step.ratio}%`,
      ];
      return texts.filter(Boolean).join("\n");
    },
    getStepKey(step, index, prefix = "cell") {
      return `${prefix}-${step.no || `${step.seq}-${index}`}`;
    },
    openDetail() {
      if (this.steps.length) {
        this.detailVisible = true;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.flow-cell {
  width: 100%;
  min-width: 0;
  overflow: hidden;
  padding: 2px 0 1px;
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
</style>
