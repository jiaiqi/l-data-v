<template>
	<div class="welcome-box">
		<div v-for="(item,i) in computList">
			<span v-if="item.parts_type === 'string'" :style="[tagStylefn(item.style_json)]">{{item.parts_text}}</span>
			<!-- <span v-if="item.type === 'string'&&item.linkIcon" class="cuIcon-right"></span> -->
			<div v-if="item.parts_type === 'iconImg'" :style="[tagStylefn(item.style_json)]" class="image-wrap">
				<img v-if="item.parts_img" :src="getImagePath(item.parts_img)" :class="item.isSelect?'image cuIcon-unfold':'image'">
				<img v-else src="@/assets/img/user-img-def.png" :class="item.isSelect?'image cuIcon-unfold':'image'">
			</div>
		</div>
	</div>
</template>

<script>
	import {
		formatStyleData
	} from '@/common/common'
	
	export default {
		props: {
			pageItem: {
				type: Object
			}
		},
		data() {
			return {

			};
		},
		computed: {
			computList() {
				if (this.pageItem.current_info_json.guest_card_json.parts_json) {
					return this.pageItem.current_info_json.guest_card_json.parts_json
				} else {
					return []
				}
			}
		},
		mounted() {
		},
		methods: {
			tagStylefn(style) {
				if (style) {
					return formatStyleData(style)
				}
			},
		}
	}
</script>

<style lang="scss" scoped>
	.welcome-box {
		.image-wrap {
				width: 40px;
				height: 40px;
			.image {
				height: 100%;
			
				&::before {
					position: absolute;
					right: -20px;
					top: 14px;
				}
			}
		}
	}
</style>
