import ProgressNode from './components/ProgressNode.vue'
import { Graph } from '@antv/x6'
import { register, getTeleport } from '@antv/x6-vue-shape'

register({
  shape: 'custom-vue-node',
  width: 100,
  height: 100,
  component: ProgressNode,
})