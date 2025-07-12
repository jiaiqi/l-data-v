<template>
  <el-card class="select-box" shadow="hover">
    <el-form ref="ruleForm" label-width="120px" :model="ruleForm" size="small">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item
            label="标题："
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
        <el-col :span="6">
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
              @change="handleAppChange"
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
        <el-col :span="8" v-if="!srvType">
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
              @change="handleReqTypeChange"
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
              @change="handleServiceChange"
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
              v-model="localCheckedReqOptions"
              @change="handleReqOptionChange"
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
</template>

<script>
export default {
  name: "RequestForm",
  props: {
    value: {
      type: Object,
      default: () => ({}),
    },
    srvType: {
      type: String,
      default: "",
    },
    allApp: {
      type: Array,
      default: () => [],
    },
    allService: {
      type: Array,
      default: () => [],
    },
    checkedReqOptions: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      ruleForm: {
        serviceName: "",
        srv_req_name: "", // 接口调用名称
        mapp: "", // 微服务
        service_name: "",
        srv_type: "select", // 接口类型
      },
      srvTypeList: ["select", "add", "delete", "update", "operate", "apply"],
      ReqOptions: ["条件", "分组", "聚合", "排序"],
      localCheckedReqOptions: [], // 本地的请求选项数据
    };
  },
  watch: {
    value: {
      handler(newVal) {
        this.ruleForm = { ...this.ruleForm, ...newVal };
      },
      immediate: true,
      deep: true,
    },
    ruleForm: {
      handler(newVal) {
        this.$emit("input", newVal);
      },
      deep: true,
    },
    checkedReqOptions: {
      handler(newVal) {
        this.localCheckedReqOptions = [...newVal];
      },
      immediate: true,
      deep: true,
    },
  },
  methods: {
    handleAppChange(val) {
      this.$emit("app-change", val);
      this.$emit("service-change", "");
    },
    handleServiceChange(val) {
      this.$emit("service-change", val);
    },
    handleReqTypeChange() {
      this.$emit("req-type-change");
    },
    handleReqOptionChange(value) {
      // 发送本地数据的变化，避免直接修改props
      this.$emit("req-option-change", value);
    },
    validate() {
      return this.$refs.ruleForm.validate();
    },
  },
  created() {
    if (this.srvType) {
      this.ruleForm.srv_type = this.srvType;
    }
  },
};
</script>

<style scoped lang="scss">
.select-box {
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  // padding: 16px;
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
    margin-bottom: 0;
    padding: 16px 0 0;
    .label {
      color: #333;
      min-width: 65px;
    }
  }
}
</style>
