import { defineStore } from "pinia";

export const useMetaStore = defineStore({
  id: "colMeta",
  state: () => ({
    metaMap: {},
  }),
  getters: {
    getMetaMap: (state) => state.metaMap
  },
  actions: {
    setMeta(service, use_type, metaData) {
      this.metaMap[`${service}-${use_type}`] = metaData;
    },
    getMeta(service, use_type) {
      return this.metaMap[`${service}-${use_type}`];
    },
  },
});
