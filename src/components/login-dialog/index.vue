<template>
  <div>
    <el-dialog
      title="登录"
      center
      :visible.sync="dialogVisible"
      append-to-body
      width="400px"
    >
      <el-form
        ref="loginForm"
        :model="loginForm"
        label-width="80px"
      >
        <el-form-item
          label="用户名"
          prop="username"
        >
          <el-input v-model="loginForm.username"></el-input>
        </el-form-item>
        <el-form-item
          label="密码"
          prop="password"
        >
          <el-input
            type="password"
            v-model="loginForm.password"
            show-password
            @keyup.enter.native.prevent="submitForm('loginForm')"
          ></el-input>
        </el-form-item>
      </el-form>
      <span
        slot="footer"
        class="dialog-footer"
      >
        <!-- 交换按钮位置与样式：有缓存租户时突出租户登录按钮 -->
        <!-- 当有缓存租户时，先放置“切换租户”为文本按钮，其次为“租户登录”为主按钮 -->
        <template v-if="hasCachedTenant">
          <el-button
            type="text"
            @click="submitForm('loginForm')"
          >切换租户</el-button>
          <el-button
            type="primary"
            @click="submitFormWithCachedTenant('loginForm')"
          >{{ cachedTenantLabel }}</el-button>
        </template>
        <!-- 无缓存租户时仅显示登录主按钮 -->
        <template v-else>
          <el-button
            type="primary"
            @click="submitForm('loginForm')"
          >登录</el-button>
        </template>
      </span>
    </el-dialog>

    <!-- 租户选择弹窗（仿照 login.html） -->
    <div
      class="tenant-modal"
      :class="{ show: tenantModalVisible }"
      v-if="dialogVisible"
    >
      <div class="tenant-modal-content">
        <div class="tenant-modal-header">
          <h3>选择要进入的租户</h3>
          <p>您拥有多个租户权限，请选择要进入的租户</p>
          <button
            class="tenant-modal-close"
            @click="hideTenantSelector"
          >
            <i class="i-ri-close-line"></i>
          </button>
        </div>
        <div class="tenant-modal-body">
          <div class="tenant-list">
            <div
              class="tenant-item"
              v-for="(tenant, index) in tenantList"
              :key="tenant.tenant_no"
              @click="selectTenant(tenant)"
            >
              <div class="tenant-name">
                <span>
                  <i class="i-ri-building-line"></i>
                  {{ tenant.tenant_name || '未命名租户' }}
                </span>
                <!-- <span
                  v-if="index === 0"
                  class="tenant-badge"
                >推荐</span> -->
                <span
                  v-if="isLastSelected(tenant)"
                  class="tenant-last-badge"
                >上次选择</span>
              </div>
              <div class="tenant-app">
                <i class="i-ri-apps-line"></i>
                应用：{{ tenant.application_name || tenant.application || '默认应用' }}
              </div>
            </div>
          </div>
        </div>
        <div class="tenant-modal-footer">
          <button
            class="tenant-skip-btn"
            @click="skipTenantSelection"
          >
            暂不选择，继续进入
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ElDialog, ElForm, ElFormItem, ElInput, ElButton } from "element-ui";
import { useUserStore } from '@/stores/user.js'
import { mapActions } from "pinia";
export default {
  data() {
    return {
      cb: null,
      dialogVisible: false,
      tenantModalVisible: false,
      tenantList: [],
      tenantAutoApplied: false,
      loginForm: {
        username: "",
        password: "",
      },
      hasCachedTenant: false,
    };
  },
  computed: {
    cachedTenantLabel() {
      try {
        const ct = sessionStorage.currentTenant ? JSON.parse(sessionStorage.currentTenant) : null
        const name = ct?.tenant_name
        return name ? `登录到租户【${name}】` : '保持租户登录'
      } catch (e) {
        return '保持租户登录'
      }
    }
  },
  watch: {
    tenantModalVisible(val) {
      if (val) {
        document.addEventListener('keydown', this.handleTenantModalKeydown)
      } else {
        document.removeEventListener('keydown', this.handleTenantModalKeydown)
      }
    }
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.handleTenantModalKeydown)
  },
  methods: {
    ...mapActions(useUserStore, ['setTenants', 'setUserInfo', 'setCurrentTenant']),
    listenerStorage(event) {
      if (event.key === "bx_auth_ticket") {
        console.log("bx_auth_ticket变化了");
        if (this.cb && typeof this.cb === "function") {
          this.cb();
          window.removeEventListener("storage", this.listenerStorage);
        }
      }
    },
    isLastSelected(tenant) {
      try {
        if (sessionStorage.currentTenant) {
          const ct = JSON.parse(sessionStorage.currentTenant)
          const cachedNo = ct?.tenant_no || ct?.tenant
          return cachedNo && (tenant.tenant_no === cachedNo)
        }
      } catch (e) { }
      return false
    },
    submitFormWithCachedTenant(formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          this.login(true).then((res) => {
            if (res) {

              this.dialogVisible = false;
              // 登录成功后提示是否刷新页面
              this.$confirm(
                '登录成功，是否刷新页面以应用最新租户环境？',
                '提示',
                { confirmButtonText: '刷新', cancelButtonText: '暂不', type: 'warning' }
              )
                .then(() => {
                  window.location.reload();
                })
                .catch(() => {
                  if (this.cb && typeof this.cb === 'function') {
                    this.cb();
                  }
                })
            }
          })
        } else {
          console.log('表单验证失败')
          return false
        }
      })
    },
    open(callback) {
      this.cb = callback;
      // 打开时检查缓存租户并同步旧键，方便后续登录入参使用
      try {
        if (sessionStorage.currentTenant) {
          const ct = JSON.parse(sessionStorage.currentTenant)
          if (ct && ct.tenant && ct.application) {
            sessionStorage.setItem('current_tenant_no', ct.tenant)
            sessionStorage.setItem('current_tenant_app', ct.application)
          } else if (ct && ct.tenant_no && ct.application) {
            sessionStorage.setItem('current_tenant_no', ct.tenant_no)
            sessionStorage.setItem('current_tenant_app', ct.application)
          }
          this.hasCachedTenant = true
        }
      } catch (e) { }
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
        let login_page = "/main/login.html";
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
              // 如果登录返回多个租户，显示选择弹窗
              if (this.tenantList && this.tenantList.length > 1 && !this.tenantAutoApplied) {
                this.showTenantSelector(this.tenantList)
              } else {
                this.dialogVisible = false;
                // 登录成功后提示是否刷新页面
                this.$confirm(
                  '登录成功，是否刷新页面以应用最新租户环境？',
                  '提示',
                  { confirmButtonText: '刷新', cancelButtonText: '暂不', type: 'warning' }
                )
                  .then(() => {
                    window.location.reload();
                  })
                  .catch(() => {
                    if (this.cb && typeof this.cb === 'function') {
                      this.cb();
                    }
                  })
              }
            }
          });
        } else {
          console.log("表单验证失败");
          return false;
        }
      });
    },
    async login(useCachedTenant = false) {
      const url = `/sso/operate/srvuser_login`;
      const data = {
        user_no: this.loginForm.username,
        pwd: this.loginForm.password,
      };
      // 优先使用缓存的 currentTenant 中的 tenant/application；当 useCachedTenant 为 true 时强制使用
      try {
        if (sessionStorage.currentTenant) {
          const ct = JSON.parse(sessionStorage.currentTenant)
          if (ct && ct.tenant && ct.application) {
            if (useCachedTenant || (!data.tenant && !data.application)) {
              data.tenant = ct.tenant
              data.application = ct.application
            }
          } else if (ct && ct.tenant_no && ct.application) {
            if (useCachedTenant || (!data.tenant && !data.application)) {
              data.tenant = ct.tenant_no
              data.application = ct.application
            }
          }
        }
      } catch (e) {
        // 忽略解析错误，回退到旧逻辑
      }
      // 若未取到，再回退到旧的 current_tenant_no/current_tenant_app
      if (!data.tenant && sessionStorage.getItem("current_tenant_no")) {
        data.tenant = sessionStorage.getItem("current_tenant_no")
      }
      if (!data.application && sessionStorage.getItem("current_tenant_app")) {
        data.application = sessionStorage.getItem("current_tenant_app")
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
        this.setUserInfo(resData.login_user_info)
        sessionStorage.setItem("logined", true);
        if (resData.login_user_info?.otherTenantInfos?.length) {
          const tenantList = resData.login_user_info.otherTenantInfos;
          sessionStorage.setItem("tenantList", JSON.stringify(tenantList));
          if (tenantList.length > 1) {
            // 保存到本地以便展示选择弹窗
            this.tenantList = tenantList
          } else if (tenantList.length === 1) {
            // 单租户时自动切换并继续
            try {
              const ok = await this.setCurrentTenant(tenantList[0])
              if (ok) this.tenantAutoApplied = true
            } catch (e) {
              console.warn('单租户自动切换失败', e)
            }
          }
          this.setTenants(tenantList)
        }
        return true;
      } else {
        this.$message.error(res.data.resultMessage);
      }
    },

    // ===== 租户选择逻辑（参考 login.html） =====
    showTenantSelector(tenants = []) {
      this.tenantList = Array.isArray(tenants) ? tenants : []
      if (this.tenantList.length > 1) {
        this.tenantModalVisible = true
        // 禁用Enter触发，避免重复提交
      }
    },
    hideTenantSelector() {
      this.tenantModalVisible = false
    },
    skipTenantSelection() {
      this.hideTenantSelector()
      this.dialogVisible = false
      // 登录后提示是否刷新页面
      this.$confirm(
        '登录成功，是否刷新页面以应用最新租户环境？',
        '提示',
        { confirmButtonText: '刷新', cancelButtonText: '暂不', type: 'warning' }
      )
        .then(() => {
          window.location.reload();
        })
        .catch(() => {
          if (this.cb && typeof this.cb === 'function') {
            this.cb()
          }
        })
    },
    handleTenantModalKeydown(e) {
      if (!this.tenantModalVisible) return
      const key = e.key
      if (key === 'Escape') {
        this.hideTenantSelector()
        e.preventDefault()
      } else if (key === 'Enter') {
        // 默认选择第一个租户
        if (Array.isArray(this.tenantList) && this.tenantList.length > 0) {
          this.selectTenant(this.tenantList[0])
          e.preventDefault()
        }
      }
    },
    async selectTenant(tenant) {
      try {
        const success = await this.setCurrentTenant({
          tenant_no: tenant.tenant_no,
          tenant_name: tenant.tenant_name,
          application: tenant.application,
          application_name: tenant.application_name,
          user_no: tenant.user_no
        })
        if (success) {
          this.hideTenantSelector()
          this.dialogVisible = false
          // 选择租户成功后提示是否刷新页面
          this.$confirm(
            '租户切换成功，是否刷新页面以应用最新租户环境？',
            '提示',
            { confirmButtonText: '刷新', cancelButtonText: '暂不', type: 'warning' }
          )
            .then(() => {
              window.location.reload();
            })
            .catch(() => {
              if (this.cb && typeof this.cb === 'function') {
                this.cb()
              }
            })
        }
      } catch (error) {
        console.error('租户选择失败:', error)
        this.$message.error('租户选择失败，请重试')
      }
    }
  },
};
</script>

<style scoped>
.tenant-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  z-index: 10000;
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
}

.tenant-modal.show {
  opacity: 1;
  visibility: visible;
}

.tenant-modal-content {
  background: white;
  border-radius: 20px;
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.25);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  transform: scale(0.8) translateY(50px);
  transition: all 0.3s ease;
}

.tenant-modal.show .tenant-modal-content {
  transform: scale(1) translateY(0);
}

.tenant-modal-header {
  background: linear-gradient(135deg, #1e3c72, #2a5298);
  color: white;
  padding: 25px 30px;
  text-align: center;
  position: relative;
}

.tenant-modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.tenant-modal-header p {
  margin: 8px 0 0 0;
  opacity: 0.9;
  font-size: 14px;
}

.tenant-modal-close {
  position: absolute;
  top: 15px;
  right: 20px;
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  transition: 0.2s ease;
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tenant-modal-close:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: rotate(90deg);
}

.tenant-modal-body {
  padding: 30px;
  max-height: 400px;
  overflow-y: auto;
}

.tenant-list {
  display: grid;
  gap: 15px;
}

.tenant-item {
  border: 2px solid #e0e6f0;
  border-radius: 10px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.8);
  position: relative;
  overflow: hidden;
}

.tenant-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(42, 82, 152, 0.1), transparent);
  transition: left 0.5s ease;
}

.tenant-item:hover {
  border-color: #2a5298;
  box-shadow: 0 4px 15px rgba(30, 60, 114, 0.2);
  transform: translateY(-2px);
}

.tenant-item:hover::before {
  left: 100%;
}

.tenant-item:active {
  transform: translateY(0);
}

.tenant-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: space-between;
}

.tenant-name i {
  color: #2a5298;
  font-size: 18px;
}

.tenant-app {
  font-size: 14px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tenant-app i {
  color: #999;
  font-size: 12px;
}

.tenant-badge {
  display: inline-block;
  background: linear-gradient(135deg, #ffd166, #ffb347);
  color: #8b4513;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  margin-left: auto;
}

.tenant-last-badge {
  display: inline-block;
  margin-left: 8px;
  background: linear-gradient(135deg, #9be7ff, #64b5f6);
  color: #0d47a1;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
}

.tenant-modal-footer {
  padding: 20px 30px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: center;
}

.tenant-skip-btn {
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  color: #606266;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tenant-skip-btn:hover {
  background: #ebeef5;
  border-color: #c0c4cc;
}

.dialog-footer {
  display: flex;
  flex-direction: column;
}
</style>