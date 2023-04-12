<template>
	<div class="content">
		<!-- <u-navbar :is-back="true" back-text="返回" title="监控详情" :background="background"></u-navbar> -->
		<div class="preview" id="video-container"></div>
		<!-- <view>
			<button @click="ezuikit.stop">stop</button>
			<button @click="ezuikit.play">play</button>
			<button @click="ezuikit.openSound">openSound</button>
			<button @click="ezuikit.closeSound">closeSound</button>
			<button @click="ezuikit.startSave">startSave</button>
			<button @click="ezuikit.stopSave">stopSave</button>
			<button @click="ezuikit.capturePicture">capturePicture</button>
			<button @click="ezuikit.fullScreen">fullScreen</button>
			<button @click="ezuikit.getOSDTime">getOSDTime</button>
			<button @click="ezuikit.ezopenStartTalk">开始对讲</button>
			<button @click="ezuikit.ezopenStopTalk">结束对讲</button>
			<button @click="ezuikit.destroy">销毁</button>
		</view> -->
	</div>
</template>

<script>
	// #ifdef H5
	import EZUIKit from 'ezuikit-js'
	window.EZUIKit = EZUIKit
	// #endif
	var player = null;

	export default {
		data() {
			return {
				background: {
					backgroundColor: '#ffffff',
				},
				accessToken: '',
				url: '',
				option: {}
			}
		},
		// onLoad(option) {
		// 	this.option = option
		// },
		mounted() {
            this.option = this.$route.query
			this.getVideoUrl()
		},
		methods: {
			async getVideoUrl() {
				const url = `/liot/select/srvliot_play_address_select`
				const req = {
					"serviceName": "srvliot_play_address_select",
					"condition": [{
							"colName": "sn",
							"ruleType": "eq",
							// "value": 'F97911681'
							"value": this.option.deviceSerial
						},
						{
							"colName": "channel_no",
							"ruleType": "eq",
							// "value": '1'
							"value": this.option.channelNo
						},
						{
							"colName": "vcode",
							"ruleType": "eq",
							// "value": 'GHTJPS'
							"value": this.option.verify_code
						},
					]
				}
				const res = await this.$http.post(url, req)
				if (res?.data?.state === 'SUCCESS' && Array.isArray(res?.data?.data) && res?.data?.data.length > 0) {
					const data = res.data.data[0]
					this.accessToken = data.accessToken
					this.url = data.url
				  // this.url = `ezopen://${this.option.verify_code}@open.ys7.com/${this.option.deviceSerial}/${this.option.channelNo}.hd.live`

					if (typeof window.EZUIKit !== 'undefined') {
						console.log('defined EZUIKit...');
						this.initPlayer();
					} else {
						console.log('undefined EZUIKit...');
						// 动态引入较大类库避免影响页面展示
						const script = document.createElement('script')
						// view 层的页面运行在 www 根目录，其相对路径相对于 www 计算
						script.src = 'https://login.100xsys.cn:1443/h5/js/ezuikit.js'
						script.onload = this.initPlayer.bind(this)
						document.head.appendChild(script)
					}
				}
			},
			initPlayer() {
				const {
					windowWidth,
					windowHeight
				} = uni.getSystemInfoSync();
				console.log('initPlayer...');
				
				player = new EZUIKit.EZUIKitPlayer({
					id: 'video-container', // 视频容器ID
					accessToken: this.accessToken,
					url: this.url,
					// simple - 极简版; pcLive-pc直播；pcRec-pc回放；mobileLive-移动端直播；mobileRec-移动端回放;security - 安防版;voice-语音版;
					//template: 'simple',
					plugin: ['talk'], // 加载插件，talk-对讲
					width: windowWidth,
					height: windowWidth * 2 / 3,
				});
				window.player = player;

			},
			play() {
				var playPromise = player.play();
				playPromise.then((data) => {
					console.log("promise 获取 数据", data)
				})
			},
			stop() {
				var stopPromise = player.stop();
				stopPromise.then((data) => {
					console.log("promise 获取 数据", data)
				})
			},
			getOSDTime() {
				var getOSDTimePromise = player.getOSDTime();
				getOSDTimePromise.then((data) => {
					console.log("promise 获取 数据", data)
				})
			},
			capturePicture() {
				var capturePicturePromise = player.capturePicture(`${new Date().getTime()}`);
				capturePicturePromise.then((data) => {
					console.log("promise 获取 数据", data)
				})
			},
			openSound() {
				var openSoundPromise = player.openSound();
				openSoundPromise.then((data) => {
					console.log("promise 获取 数据", data)
				})
			},
			closeSound() {
				var openSoundPromise = player.closeSound();
				openSoundPromise.then((data) => {
					console.log("promise 获取 数据", data)
				})
			},
			startSave() {
				var startSavePromise = player.startSave(`${new Date().getTime()}`);
				startSavePromise.then((data) => {
					console.log("promise 获取 数据", data)
				})
			},
			stopSave() {
				var stopSavePromise = player.stopSave();
				stopSavePromise.then((data) => {
					console.log("promise 获取 数据", data)
				})
			},
			ezopenStartTalk() {
				player.startTalk();
			},
			ezopenStopTalk() {
				player.stopTalk();
			},
			fullScreen() {
				player.fullScreen();
			},
			destroy() {
				var destroyPromise = player.destroy();
				destroyPromise.then((data) => {
					console.log("promise 获取 数据", data)
				})
			},
		}
	}
</script>

<style lang="scss" scoped>
	.content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.preview {
		background-color: black;
	}
</style>
