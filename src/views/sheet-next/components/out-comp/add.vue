<template>
  <iframe :src="iframeSrc" frameborder="0"></iframe>
</template>

<script>
import { webBaseUrl } from "@/common/http";
export default {
  props: {
    service: {
      type: String,
      default: "",
    },
  },
  data() {
    return {};
  },
  computed: {
    iframeSrc() {
      return `${webBaseUrl}/vpages/#/add/${this.service}`;
    },
  },
};
</script>

<style lang="scss" scoped></style>
