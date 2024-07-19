<template>
  <div>
    <el-dialog title="登录" center :visible.sync="dialogVisible" append-to-body width="400px">
      <el-form ref="loginForm" :model="loginForm" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="loginForm.username"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input type="password" v-model="loginForm.password" show-password
            @keyup.enter.native.prevent="submitForm('loginForm')"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm('loginForm')">登录</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { ElDialog, ElForm, ElFormItem, ElInput, ElButton } from "element-ui";
export default {
  data() {
    return {
      cb: null,
      dialogVisible: false,
      loginForm: {
        username: "",
        password: "",
      },
    };
  },
  methods: {
    listenerStorage(event) {
      if (event.key === "bx_auth_ticket") {
        console.log("bx_auth_ticket变化了");
        if (this.cb && typeof this.cb === "function") {
          this.cb();
          window.removeEventListener("storage", this.listenerStorage);
        }
      }
    },
    open(callback) {
      this.cb = callback;
      const getRootWindow = function (_window) {
        _window = _window || window;
        if (_window.top !== _window) {
          return getRootWindow(_window.top);
        } else {
          return _window;
        }
      };
      if (getRootWindow()?.layer) {
        // 有layer则说明当前在iframe中，直接弹出layer的登录框
        const login_page = "/main/login.html";
        if (getRootWindow()?.getLoginAddress) {
          login_page = `/${getRootWindow().getLoginAddress()}`;
        }
        getRootWindow().layer.open({
          title: false,
          type: 2,
          content: window.location.origin + login_page,
          closeBtn: 0,
          area: ["300px", "350px"],
          shade: 0.9,
        });
        window.addEventListener("storage", this.listenerStorage);
      } else {
        this.dialogVisible = true;
      }
    },
    submitForm(formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          // 提交表单逻辑
          // dialogVisible = false;
          this.login().then((res) => {
            if (res) {
              this.dialogVisible = false;
              if (this.cb && typeof this.cb === "function") {
                this.cb();
              }
            }
          });
        } else {
          console.log("表单验证失败");
          return false;
        }
      });
    },
    async login() {
      const url = `/sso/operate/srvuser_login`;
      const data = {
        user_no: this.loginForm.username,
        pwd: this.loginForm.password,
      };
      if (
        sessionStorage.getItem("current_tenant_app") &&
        sessionStorage.getItem("current_tenant_no")
      ) {
        data.tenant = sessionStorage.getItem("current_tenant_no");
        data.application = sessionStorage.getItem("current_tenant_app");
      }
      const req = [{ serviceName: "srvuser_login", data: [data] }];
      const res = await this.$http.post(url, req);
      if (res?.data?.state === "SUCCESS") {
        const resData = res.data.response[0].response;
        sessionStorage.setItem("bx_auth_ticket", resData.bx_auth_ticket);
        sessionStorage.setItem(
          "current_login_user",
          JSON.stringify(resData.login_user_info)
        );
        sessionStorage.setItem("logined", true);
        return true;
      } else {
        this.$message.error(res.data.resultMessage);
      }
    },
  },
};
</script>
