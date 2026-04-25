<template>
  <div
    class="fk-detail-link flex-1 text-left cursor-pointer text-blue"
    @click="openDetail"
  >
    {{ value }}
  </div>
</template>

<script>
export default {
  name: "FkDetailLink",
  props: {
    app: {
      type: String,
      default: "",
    },
    srvInfo: {
      type: Object,
      default: () => ({}),
    },
    row: {
      type: Object,
      default: () => ({}),
    },
    detailButton: {
      type: Object,
      default: () => ({}),
    },
    value: {
      type: [String, Number],
      default: "",
    },
  },
  methods: {
    openDetail() {
      if (!this.srvInfo?.serviceName || !this.row?.id) {
        return;
      }
      const address = `/vpages/#/detail/${this.srvInfo.serviceName}/${this.row.id}?srvApp=${this.app}`;
      let tabTitle = this.detailButton.service_view_name || "详情";
      const dispCol = this.detailButton._disp_col;
      const dispValue = this.row[dispCol];
      tabTitle = tabTitle.replace("查询", "");
      if (dispValue !== null && dispValue !== undefined && dispValue !== "") {
        tabTitle = `${dispValue}(${tabTitle}详情)`;
      } else {
        tabTitle = `${tabTitle}详情`;
      }
      const page = {
        title: tabTitle,
        url: address,
        icon: "",
        app: this.app,
      };
      if (window.top.tab) {
        window.top.tab.addTab(page);
        return;
      }
      const detailPage = window.open(address);
      setTimeout(() => {
        detailPage.document.title = tabTitle;
      }, 500);
    },
  },
};
</script>
