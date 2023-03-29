<template>
	<div class="notice-bar">
		<img :src="getImagePath(pageItem.notice_bar_json.icon)" class="notice-icon">
		<u-notice-bar class="notice-item" bg-color="#fff" color="#333" font-size="26" padding="9px 0 9px 30px" :mode="mode" :list="list"
			:volume-icon="false" :more-icon="showLinkIcon" :duration="duration" :speed="speed" :is-circular="false"><!-- @click="linkTo" -->
		</u-notice-bar>
	</div>
</template>

<script>
	export default {
		name: 'notice-bar',
		props: {
			pageItem: {
				type: Object
			}
		},
		data() {
			return {
				listData: [],
				duration: this.pageItem.notice_bar_json?.duration || 2000,
				speed: this.pageItem.notice_bar_json?.speed || 160,
				showLinkIcon: this.pageItem.notice_bar_json?.jump_json ? true : false,
			};
		},
		mounted() {
			let params = {}
			if (this.pageItem?.srv_req_json) {
				params = this.pageItem.srv_req_json
			}
			this.getNoticeBarData(params)
		},
		computed: {
			list() {
				let arr = []
				this.listData.forEach(item => {
					if (item.title) arr.push(item.title)
				})
				return arr
			},
			mode() {
				if (this.pageItem.notice_bar_json.direction === '横向') {
					return 'horizontal'
				} else {
					return 'vertical'
				}
			},
			linkTo(index) {
				console.log(index)
			}
		},
		methods: {
			async getNoticeBarData(p) {
				if (!p.serviceName || !p.mapp) return

				const url = `/${p.mapp}/select/${p.serviceName}`
				const req = {
					"serviceName": p.serviceName,
					"colNames": p.colNames,
				}
				const res = await this.$axios.post(url, req)
				if (res?.data?.state === 'SUCCESS' && Array.isArray(res?.data?.data) && res?.data?.data.length > 0) {
					this.listData = res.data.data
				}
			}
		},
	}
</script>

<style lang="scss" scoped>
	.notice-bar {
		position: relative;

		.notice-icon {
			width: 28px;
			height: 28px;
			position: absolute;
			top: 50%;
			transform: translateY(-50%);
		}

		.notice-item {
			font-weight: bold;
		}
	}

	::v-deep {
		.u-notice-bar {
			height: 100%;
		}
	}
</style>
