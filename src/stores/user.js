// stores/user.js
import { defineStore } from 'pinia'
import { $http } from "@/common/http";

export const useUserStore = defineStore('user', {
  state: () => (
    {
      /**@type  {{ user_no: string, user_disp:string,tenant:string,real_name:string,photo_url:string,mobile:string,application:string,dept_no:string,email:string,roles:string[]}[]} */
      userInfo: sessionStorage.current_login_user?JSON.parse(sessionStorage.current_login_user):{},
      /**@type  {{ application: string, application_name:string,tenant_no:string,tenant_name:string,user_no:string}[]} */
      tenants: sessionStorage.tenantList?JSON.parse(sessionStorage.tenantList): [],
      currentTenant:sessionStorage.currentTenant?JSON.parse(sessionStorage.currentTenant): {},
    }
  ),
  // 也可以这样定义
  // state: () => ({ count: 0 })
  actions: {
    setUserInfo(userInfo) {
      this.userInfo = userInfo
      console.log("userInfo", this.userInfo);
    },
    setTenants(tenants) {
      this.tenants = tenants
      console.log("tenants", this.tenants);
    },
    setCurrentTenant(tenant) {
      this.currentTenant = tenant
      sessionStorage.currentTenant = JSON.stringify(tenant)
      this.loginWithTenant(tenant)
      console.log("currentTenant", this.currentTenant);
    },
    loginWithTenant(tenant={}){
      const {tenant_no,tenant_name,application} = tenant
      const url = `/sso/operate/srvuser_app_tenant_swh_login`
      const switchTenantReq = [
        {
          serviceName: "srvuser_app_tenant_swh_login",
          data: [
            {
              tenant_no,
              tenant_name,
              application
            },
          ],
        },
      ];
      return $http.post(url,switchTenantReq).then(resp=>{
        const {data} = resp
        if (data.state == "SUCCESS") {
          const res = data.response;
          if (res.length > 0) {
            const resList = res[0].response;
            window.sessionStorage.setItem('bx_auth_ticket', resList.bx_auth_ticket)
            window.sessionStorage.setItem('current_login_user', JSON.stringify(resList.login_user_info))
            if (window.confirm("租户登录成功，是否刷新页面？")) {
              top.window.location.reload()
            }
          }
        }
      })
    }
  },
})