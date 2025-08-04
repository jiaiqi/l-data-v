<template>
  <div>
    <!-- 数据预览区域 -->
    <DataPreview
      :serviceName="ruleForm.service_name"
      :appName="ruleForm.mapp"
      :title="pageTitle"
      :checkedColumns="checkedColumns"
      ref="dataPreviewRef"
      @open-login="handleOpenLogin"
    />
    <loginDialog ref="loginDialogRef" />
  </div>
</template>

<script setup>
import DataPreview from "@/components/request-builder/DataPreview.vue";
import loginDialog from "@/components/login-dialog/index.vue";
import { useRoute } from "@/common/vueApi";
import { onMounted, reactive, ref, nextTick, computed } from "vue";

import { $http } from "@/common/http";
const ruleForm = reactive({
  mapp: "",
  service_name: "",
});
const dataPreviewRef = ref(null);
const loginDialogRef = ref(null);
function handleOpenLogin() {
  loginDialogRef.value.open(() => {});
}

const reqCfg = ref({});
const initReq = ref({});
async function getRequestConfig() {
  const req = {
    serviceName: "srvpage_cfg_srv_call_select",
    colNames: ["*"],
    condition: [
      {
        colName: "srv_call_no",
        ruleType: "eq",
        value: reportNo.value,
      },
    ],
    page: { pageNo: 1, rownumber: 1 },
  };
  const url = `/config/select/srvpage_cfg_srv_call_select`;
  const res = await $http.post(url, req);
  if (res?.data?.resultCode === "0011") {
    handleOpenLogin();
  }
  if (Array.isArray(res.data?.data)) {
    if (res.data.data.length) {
      const data = res.data.data[0];
      Object.keys(data).forEach((key) => {
        if (key?.includes("_json")) {
          try {
            data[`${key}_data`] = JSON.parse(data[key]);
          } catch (error) {
            console.log(error);
          }
        }
      });
      reqCfg.value = data;
      if (data?.srv_req_json_data) {
        initReq.value = data.srv_req_json_data;
        ruleForm.service_name = data.service_name;
        ruleForm.mapp = data.mapp;
        return true;
      }
    }
  }
}

const route = useRoute();
if (route.query.srvApp) {
  ruleForm.mapp = route.query.srvApp;
}
if (route.query.service) {
  ruleForm.service_name = route.query.service;
}
const pageTitle = ref("数据预览");
const reportNo = ref("");
if (route.name === "report3") {
  // 使用配置编号查找配置
  reportNo.value = route.params.reportNo;
  getRequestConfig().then((res) => {
    if (res) {
      dataPreviewRef.value.handleGetData(initReq.value);
    }
  });
} else {
  if (route.query.title) {
    pageTitle.value = decodeURIComponent(route.query.title);
  }
  if (route.params.app && route.params.service && route.params.title) {
    pageTitle.value = decodeURIComponent(route.params.title);
    ruleForm.mapp = route.params.app;
    ruleForm.service_name = route.params.service;
  }
  nextTick(() => {
    dataPreviewRef.value.handleGetData();
  });
}

const checkedColumns = computed(() => {
  return initReq.value?.colNames || [];
});
</script>

<style lang="scss" scoped></style>
