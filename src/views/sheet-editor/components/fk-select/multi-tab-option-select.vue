<template>
  <div class="fk-select-dropdown">
    <el-popover
      placement="bottom-start"
      width="400"
      trigger="click"
      :disabled="disabled"
      ref="popover"
      popper-class="fk-select-dropdown-popover"
      @show="showPopover(true)"
      @hide="showPopover(false)"
    >
      <!-- 下拉面板部分 -->
      <div class="dropdown-panel">
        <!-- Tab切换部分 -->
        <el-tabs v-model="currentTab" @tab-click="handleClick">
          <el-tab-pane
            :label="item.label"
            :name="item.label"
            v-for="item in tabs"
            :key="item.label"
          >
            <div class="option-list">
              <div
                v-for="(option, index) in currentOptions"
                :key="index"
                class="option-item"
                @click="selectOption(option)"
              >
                <span v-html="option.labelFunc(option)"></span>
              </div>
              <div v-if="loading" class="loading-wrapper">
                <el-loading></el-loading>
              </div>
              <div v-else-if="currentOptions.length === 0" class="no-data">
                暂无数据
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>

        <!-- 选项列表部分 -->
      </div>
      <!-- 输入框部分 -->
      <el-input
        v-model="inputValue"
        :placeholder="placeholder"
        :prefix-icon="prefixIcon"
        clearable
        ref="input"
        slot="reference"
      >
        <template #suffix>
          <i class="el-icon-arrow-down" :class="{ 'is-reverse': visible }"></i>
        </template>
        <!-- <template #append>
          <el-button icon="el-icon-search" @click.stop="onPopupClicked">
          </el-button>
        </template> -->
      </el-input>
    </el-popover>

    <el-dialog
      title="查询选择"
      width="90%"
      :close-on-click-modal="1 == 2"
      append-to-body
      :visible="popup"
      @close="popup = false"
    >
      <el-tabs v-model="currentTab">
        <el-tab-pane
          :label="item.label"
          :name="item.label"
          v-for="item in tabs"
          :key="item.label"
        >
          <div class="option-list">
            <!-- <list
              :service="item.service"
              v-if="popup"
              ref="popup"
              :$srvApp="$srvApp"
              mode="finder"
              listType="selectlist"
              :default-condition="$parent.popupDefaultConditions(currentTabCfg)"
              @row-dbclick="selectOption"
            >
            </list> -->
          </div>
        </el-tab-pane>
      </el-tabs>

      <div style="text-align: center; color: red">请双击列表行进行选择</div>
    </el-dialog>
  </div>
</template>

<script>
// 添加防抖处理，避免频繁请求
import { value } from "lodash-es";
import debounce from "lodash/debounce";

export default {
  name: "MultiOptionList",
  components: {
    // List: () => import("../../common/list.vue"),
  },
  data() {
    return {
      loading: false,
      visible: false, // 下拉面板是否可见
      inputValue: "", // 输入框的值
      currentTab: "选项一", // 当前激活的tab
      tabs: [
        { label: "选项一", options: [] },
        { label: "选项二", options: [] },
        { label: "选项三", options: [] },
      ],
      popup: false,
    };
  },
  watch: {
    value: {
      immediate: true,
      handler(val) {
        this.inputValue = val;
      },
    },
  },
  computed: {
    currentTabCfg() {
      return this.tabs.find(
        (item) => item.label && item.label === this.currentTab
      );
    },
    currentOptions() {
      let options = this.currentTabCfg?.options || [];
      return options.filter(
        (item) =>
          !this.inputValue ||
          item
            .labelFunc(item)
            .toLowerCase()
            .includes(this.inputValue.toLowerCase())
      );
    },
  },
  props: {
    field: {
      type: Object,
      default: () => ({ info: {} }),
    },
    data: {
      type: Object,
    },
    optionListV3: {
      type: Array,
      default: () => [],
    },
    placeholder: {
      type: String,
      default: "请选择",
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    prefixIcon: {
      type: String,
      default: "",
    },
    app: {
      type: String,
      default: "",
    },
    value: {
      type: String,
      default: "",
    },
  },
  methods: {
    showPopover(value) {
      this.visible = value;
      if (this.visible) {
        this.loadOptions();
      }
    },
    onPopupClicked() {
      if (this.disabled) {
        return;
      }
      this.popup = true;
    },
    handleClick(tab, event) {
      this.currentTab = tab.label;
      this.loadOptions();
    },
    // 选择选项
    selectOption(option) {
      this.inputValue = option.labelFunc
        ? option.labelFunc(option)
        : option[this.currentTabCfg?.dispCol] || "";
      this.visible = false;
      this.$refs.popover?.doClose?.();
      this.$emit("select", option, this.currentTabCfg);
    },

    // 根据输入过滤选项
    filterOptions(value) {
      if (!value) {
        this.currentOptions = this.tabs[this.currentTab].options;
        return;
      }

      this.currentOptions = this.tabs[this.currentTab].options.filter(
        (option) => option.label.toLowerCase().includes(value.toLowerCase())
      );
    },
    loadOptions() {
      // 加载选项数据
      if (this.loading) return;
      this.loading = true;
      try {
        const optionsCfg = this.tabs.find(
          (item) => item.label && item.label === this.currentTab
        );
        if (optionsCfg?.service) {
          let app = this.app;
          // app配置了this或者data.app的 使用当前app
          if (
            (app === "this" ||
              (!app && optionsCfg?.srvApp?.includes("data.app"))) &&
            sessionStorage.getItem("current_app")
          ) {
            app = sessionStorage.getItem("current_app");
          } else if (optionsCfg?.srvApp) {
            app = optionsCfg.srvApp;
          }
          let queryJson = {
            serviceName: optionsCfg.service,
            queryMethod: "select",
            colNames: ["*"],
            condition: [],
            page: {
              pageNo: optionsCfg.page.pageNo,
              rownumber: optionsCfg.page.rownumber,
            },
          };
          if (optionsCfg?.conditions?.length) {
            queryJson.condition = this.$parent.buildConditions(optionsCfg);
            queryJson.condition = this.$parent.pruneConditions(
              queryJson.condition
            );
          }
          if (optionsCfg.relation_conditions) {
            queryJson.relation_condition =
              this.$parent?.buildRelationCondition?.(
                optionsCfg,
                this.inputValue
              );
          }
          return this.selectList(queryJson, app).then((response) => {
            if (response && response.data && response.data.data) {
              let options = response.data.data;
              if (optionsCfg.dedup) {
                this.$parent?.dedupOptions?.(options, optionsCfg);
              }
              const dispCol = optionsCfg?.dispCol;
              const valueCol = optionsCfg?.refedCol;
              options.forEach((item) => {
                item.labelFunc = (data) => {
                  let result =
                    optionsCfg.showAsPair == true
                      ? `${data[dispCol]}/${data[valueCol]}`
                      : data[dispCol];
                  if (this.inputValue && result.includes(this.inputValue)) {
                    result = result.replace(
                      this.inputValue,
                      `<span style="color: red;">${this.inputValue}</span>`
                    );
                  }
                  return result || "";
                };
              });
              options.forEach((option) => {
                if (optionsCfg.imgType === "imgdata" && optionsCfg.refedCol) {
                  option.imgUrlFunc = (data) => data[optionsCfg.refedCol];
                } else if (
                  optionsCfg.imgType === "eicon" &&
                  optionsCfg.refedCol
                ) {
                  option.elIconFunc = (data) => data[optionsCfg.refedCol];
                } else if (optionsCfg.imgUrlExpr) {
                  option.imgUrlFunc = (data) => {
                    return (
                      this.serviceApi().downloadFileNo +
                      data[optionsCfg.imgUrlExpr]
                    );
                  };
                }
              });
              this.$set(optionsCfg, "options", options);
            } else {
            }
          });
        }
      } catch (error) {
        console.error("加载选项失败:", error);
      } finally {
        this.loading = false;
      }
    },
  },
  created() {
    // 初始化选项数据
    this.loadOptions = debounce(this.loadOptions, 300);
    this.tabs = this.optionListV3.map((item) => {
      return {
        label: item.conds[0].case_val || item.section_name,
        value: item.conds[0].case_val,
        case_val: item.conds[0].case_val,
        case_col: item.conds[0].case_col,
        options: [],
        service: item.serviceName || item.service,
        conditions: item.conditions || item.condition || [],
        relation_conditions: item.relation_conditions || null,
        orders: item.orders || null,
        showAsPair: item.show_as_pair || null,
        imgType: item.img_type || null, // 图片类型：img-图片 eicon- el-icon图标
        imgCol: item.refed_col || null, // 图片字段 同之前的img_url_expr
        imgUrlExpr: item.img_url_expr || item.img_col || null,
        dedup: item.dedup,
        srvApp: item.srv_app || null,
        parentCol: item.parent_col || item.parent_no_col || null,
        refedCol: item.refed_col,
        dispCol: item.key_disp_col || item.disp_col,
        page: {
          rownumber: 10,
          pageNo: 1,
          total: 0,
        },
        _raw: { ...item },
      };
    });
    this.currentTab = this.tabs[0].label;
  },
};
</script>

<style lang="scss"></style>
<style lang="scss">
.fk-select-dropdown {
  width: 100%;
  .el-input {
    width: 100%;
    outline: none;
    border: none;
    .el-input__inner{
      outline: none;
      border: none;
    }
    .el-input__suffix-inner {
      display: inline-block;
      height: 100%;
      line-height: 1;
      display: flex;
      align-items: center;
      .el-icon-arrow-down {
        transition: all 0.3s ease-in-out;
        &.is-reverse {
          transform: rotate(-180deg);
        }
      }
    }
  }
}
.el-popper.fk-select-dropdown-popover {
  padding: 0;

  .dropdown-panel {
    padding: 10px;
    .el-tabs__header {
      margin-bottom: 10px;
    }
    .loading-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100px;
    }
    .option-list {
      // padding: 20px;
      .option-item {
        padding: 5px 10px;
        cursor: pointer;
        &:hover {
          background-color: #f5f7fa;
          color: var(--blue);
        }
      }
    }
  }
}
</style>
