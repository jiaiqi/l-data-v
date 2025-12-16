/**
 * ECharts 按需引入配置
 * 仅引入项目中实际使用的图表类型和组件,减少打包体积
 */

// 引入 echarts 核心模块，提供了必须要的接口
import * as echarts from 'echarts/core';

// 引入图表类型,根据项目实际使用情况引入
import {
  BarChart,      // 柱状图
  LineChart,     // 折线图
} from 'echarts/charts';

// 引入提示框、标题、直角坐标系、数据集、内置数据转换器等组件
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DatasetComponent,
  TransformComponent,
} from 'echarts/components';

// 标签自动布局、全局过渡动画等特性
import { LabelLayout, UniversalTransition } from 'echarts/features';

// 引入 Canvas 渲染器
import { CanvasRenderer } from 'echarts/renderers';

// 注册必须的组件
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DatasetComponent,
  TransformComponent,
  BarChart,
  LineChart,
  LabelLayout,
  UniversalTransition,
  CanvasRenderer,
]);

export default echarts;
