<template>
  <div>
    <!-- 选择父节点弹窗 -->
    <select-parent-node
      ref="changeParentRef"
      :topTreeData="topTreeData"
      :srvApp="srvApp"
      :options="parentOptions"
      :option-info="parentColOption"
      @confirm="$emit('update-parent', $event)"
    />

    <!-- 登录弹窗 -->
    <login-dialog ref="loginRef" />

    <!-- 右键菜单 -->
    <drop-menu
      v-if="uiState.showDropMenu"
      v-model="uiState.showDropMenu"
      :row="currentRowData"
      :items="rowButton"
      :position="{ top: uiState.dTop, left: uiState.dLeft }"
      @select="$emit('row-button-click', $event)"
    />

    <!-- 字段编辑器 -->
    <Teleport
      to=".ve-table-content-wrapper"
      v-if="uiState.showFieldEditor"
    >
      <field-editor
        ref="fieldEditor"
        :disabled="disabled"
        :detailButton="detailButton"
        :serviceName="serviceName"
        :app="srvApp"
        :listType="listType"
        :keyDispCol="keyDispCol"
        :value="currentCellValue"
        :show.sync="uiState.showFieldEditor"
        v-bind="editorState.fieldEditorParams"
        @change="$emit('dialog-change', $event)"
        @fk-autocomplete-change="$emit('fk-autocomplete-change', $event)"
        @fk-change="$emit('fk-change', $event)"
        @fks-change="$emit('fks-change', $event)"
        @save="$emit('dialog-change', $event)"
        @close="$emit('dialog-close')"
        @focus="$emit('field-editor-focus', $event)"
        @blur="$emit('field-editor-blur', $event)"
      />
    </Teleport>
  </div>
</template>

<script>
import { computed } from 'vue'
import Teleport from 'vue2-teleport'
import SelectParentNode from '../select-parent-node.vue'
import LoginDialog from '../../../components/login-dialog/index.vue'
import DropMenu from '../drop-menu/drop-menu.vue'
import FieldEditor from '../field-editor/index.vue'

export default {
  name: 'SheetDialogs',
  components: {
    Teleport,
    SelectParentNode,
    LoginDialog,
    DropMenu,
    FieldEditor
  },
  props: {
    uiState: {
      type: Object,
      required: true
    },
    editorState: {
      type: Object,
      required: true
    },
    currentRowData: {
      type: Object,
      default: null
    },
    rowButton: {
      type: Array,
      default: () => []
    },
    disabled: {
      type: Boolean,
      default: false
    },
    detailButton: {
      type: Object,
      default: null
    },
    serviceName: {
      type: String,
      default: ''
    },
    srvApp: {
      type: String,
      default: ''
    },
    listType: {
      type: String,
      default: 'list'
    },
    keyDispCol: {
      type: String,
      default: ''
    },
    currentCellValue: {
      type: [String, Number, Object],
      default: null
    },
    topTreeData: {
      type: Boolean,
      default: false
    },
    parentColOption: {
      type: Object,
      default: null
    }
  },
  emits: [
    'dialog-change',
    'fk-autocomplete-change',
    'fk-change',
    'fks-change',
    'dialog-close',
    'field-editor-focus',
    'field-editor-blur',
    'row-button-click',
    'update-parent'
  ],
  setup(props) {
    const parentOptions = computed(() => {
      return props.tableData?.filter(item => 
        item.__flag !== 'add' && !item.__indent
      ) || []
    })

    return {
      parentOptions
    }
  }
}
</script>