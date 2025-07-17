import { ref, reactive, computed } from 'vue'
import { cloneDeep } from 'lodash-es'
import { getServiceV2, onSelect, onBatchOperate } from '../../../service/api'
import { buildSrvCols } from '../../../utils/sheetUtils'

/**
 * 表格数据管理组合式函数
 */
export function useTableData(tableState, uiState) {
  const v2data = ref({})
  const allFields = ref([])
  const calcReqData = ref(null)

  /**
   * 初始化表格数据
   */
  const initTableData = async () => {
    try {
      uiState.loading = true
      const response = await getServiceV2({
        // 这里需要根据实际情况传入参数
      })
      
      if (response.data) {
        v2data.value = response.data
        allFields.value = response.data.srv_cols || []
        tableState.columns = buildColumns()
        await loadTableData()
        tableState.isFetched = true
      }
    } catch (error) {
      console.error('初始化表格数据失败:', error)
    } finally {
      uiState.loading = false
    }
  }

  /**
   * 加载表格数据
   */
  const loadTableData = async () => {
    try {
      const response = await onSelect({
        // 查询参数
      })
      
      if (response.data) {
        tableState.tableData = response.data.map((item, index) => ({
          ...item,
          rowKey: item.__id || `row_${index}`,
          __id: item.__id || `row_${index}`
        }))
        tableState.oldTableData = cloneDeep(tableState.tableData)
        tableState.page.total = response.total || 0
      }
    } catch (error) {
      console.error('加载表格数据失败:', error)
    }
  }

  /**
   * 刷新表格数据
   */
  const refreshTableData = async () => {
    await loadTableData()
  }

  /**
   * 保存表格数据
   */
  const saveTableData = async () => {
    try {
      uiState.loading = true
      const reqData = buildReqParams()
      
      if (reqData && reqData.length > 0) {
        await onBatchOperate(reqData)
        // 保存成功后刷新数据
        await refreshTableData()
      }
    } catch (error) {
      console.error('保存数据失败:', error)
    } finally {
      uiState.loading = false
    }
  }

  /**
   * 构建请求参数
   */
  const buildReqParams = () => {
    const changedRows = tableState.tableData.filter(row => {
      const oldRow = tableState.oldTableData.find(old => old.__id === row.__id)
      return !oldRow || JSON.stringify(row) !== JSON.stringify(oldRow)
    })

    return changedRows.map(row => ({
      serviceName: getServiceName(row),
      data: [row],
      condition: row.__id ? [{ colName: '__id', value: row.__id, ruleType: 'eq' }] : []
    }))
  }

  /**
   * 获取服务名称
   */
  const getServiceName = (row) => {
    if (row.__flag === 'add') {
      return v2data.value.addButton?.service_name || ''
    } else if (row.__flag === 'update') {
      return v2data.value.updateButton?.service_name || ''
    }
    return ''
  }

  /**
   * 构建表格列
   */
  const buildColumns = () => {
    return allFields.value.map(field => ({
      field: field.columns,
      key: field.columns,
      title: field.column_view_name || field.columns,
      width: field.list_min_width || 120,
      edit: field.in_list_edit === 1,
      __field_info: field
    }))
  }

  return {
    v2data,
    allFields,
    calcReqData,
    initTableData,
    loadTableData,
    refreshTableData,
    saveTableData,
    buildReqParams,
    buildColumns
  }
}