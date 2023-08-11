<template>
  <div class="webview-main">
    <div class="iframe-box">
      <div :class="{ 'is-mobile': mobile }"></div>
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
      width: 375,
      height: 740,
      // width: "337.5",
      // height: "600",
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
.iframe-box {
  position: relative;
  padding: 95px 70px 60px;
  .is-mobile {
    overflow: hidden;
    pointer-events: none;
    background-image: url(@/assets/img/phone3.png);
    background-size: cover;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: 100% 100%;
    z-index: 2;
  }
}
// .iframe-box.is-mobile {
//   overflow: hidden;
//   background-image: url(@/assets/img/phone3.png);
//   background-size: cover;
//   // padding: 110px 30px;
//   // padding: 100px 28px;
//   // // padding: 50px 26px;
//   // width: 375px;
//   // height: 740px;
//   // background-repeat: no-repeat;
//   background-size: 100% 100%;

//   // padding-top: 44px;
//   // padding-bottom: 21px;
//   // padding-left: 24px;
//   // padding-right: 25px;
//   box-sizing: content-box;
//   padding: 60px 70px;
// }
</style>
