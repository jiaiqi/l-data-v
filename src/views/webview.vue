<template>
  <div class="webview-main">
    <div class="iframe-box" :class="{ 'is-mobile': mobile }">
      <iframe
        :src="src"
        frameborder="0"
        :width="width"
        :height="height"
      ></iframe>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      width: "375",
      height: "667",
      src: "",
      mobile: true,
    };
  },
  computed: {},
  mounted() {
    const option = this.$route?.query;
    if (option?.ticket) {
      sessionStorage.setItem("bx_auth_ticket", option?.ticket);
      localStorage.setItem("bx_auth_ticket", option?.ticket);
    }
    if (option?.bx_auth_ticket) {
      sessionStorage.setItem("bx_auth_ticket", option?.bx_auth_ticket);
      localStorage.setItem("bx_auth_ticket", option?.bx_auth_ticket);
    }
    if (option?.app) {
      sessionStorage.setItem("current_app", option?.app);
      localStorage.setItem("current_app", option?.app);
    }
    if (option?.mobile) {
      this.mobile = true;
    }
    if (option?.isPc) {
      this.mobile = false;
    }
    if (option?.src) {
      this.src = decodeURIComponent(option.src);
    }
    if (option.width) {
      this.width = option.width;
    }
    if (option.height) {
      this.height = option.height;
    }
  },
};
</script>

<style lang="scss">

.webview-main {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}
.iframe-box.is-mobile {
  overflow: hidden;
  background-image: url(@/assets/img/phone.png);
  background-size: cover;
  // background-size: 430px 880px;
  padding: 110px 30px;
  background-repeat: no-repeat;
}
</style>
