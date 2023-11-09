<template>
  <div>
    <el-dialog title="登录" center :visible.sync="dialogVisible" append-to-body width="400px">
      <el-form ref="loginForm" :model="loginForm" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="loginForm.username"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input type="password" v-model="loginForm.password" show-password  @keyup.enter.native.prevent="submitForm('loginForm')"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm('loginForm')">登录</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { ElDialog, ElForm, ElFormItem, ElInput, ElButton } from 'element-ui';
export default {
  data() {
    return {
      cb: null,
      dialogVisible: false,
      loginForm: {
        username: '',
        password: '',
      }
    }
  },
  methods: {
    open(callback) {
      this.cb = callback
      this.dialogVisible = true
    },
    submitForm(formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          // 提交表单逻辑
          // dialogVisible = false;
          this.login().then(res => {
            if (res) {
              this.dialogVisible = false;
              if (this.cb && typeof this.cb === 'function') {
                this.cb()
              }
            }
          })
        } else {
          console.log('表单验证失败');
          return false;
        }
      });
    },
    async login() {
      const url = `/sso/operate/srvuser_login`
      const req = [{ "serviceName": "srvuser_login", "data": [{ "user_no": this.loginForm.username, "pwd": this.loginForm.password }] }]
      const res = await this.$http.post(url, req)
      if (res?.data?.state === 'SUCCESS') {
        const resData = res.data.response[0].response
        sessionStorage.setItem('bx_auth_ticket', resData.bx_auth_ticket)
        sessionStorage.setItem('current_login_user', JSON.stringify(resData.login_user_info))
        sessionStorage.setItem('logined', true)
        return true
      } else {
        this.$message.error(res.data.resultMessage)
      }
    }
  },
}
</script>

