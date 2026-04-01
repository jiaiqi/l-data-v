import { ref, reactive, computed, watch, toRefs } from 'vue'
import { uniqueId, cloneDeep } from 'lodash-es'
import { Message, Loading } from 'element-ui'
import dayjs from 'dayjs'

import { onSelect, onBatchOperate, onDelete } from '../../../service/api'
import { RecordManager } from '../util/recordManager'
import { ignoreKeys } from '../util/constant'
import { FkUtil } from '../util/fkUtil'
import {
  extractAndFormatDatesOrTimestamps,
} from '@/common/DataUtil.js'
import { isFk, isFkAutoComplete } from '../../../utils/sheetUtils'

export function useDataProcessor(context) {
  const {
    serviceName,
    srvApp,
    listType,
    childListType,
    v2data,
    allFields,
    addColsMap,
    updateColsMap,
    defaultConditions,
    defaultConditionsMap,
    initCond,
    sortState,
    isSuperAdmin,
    disabled,
    forceNormalList,
    treeInfo,
    isTree,
    addButton,
    updateButton,
    deleteButton,
    tableMap,
    fkRawDataMap,
    $route,
    $refs,
    $message,
    $set,
    $nextTick,
    setButtonAuth,
    isFieldEditable,
    handleRedundantCalc,
    fkChange,
    emitListData,
    autoSave,
    stopAutoSave,
    startLoading,
    insert2Rows,
  } = toRefs(context || {})

  const loading = ref(false)
  const isFetched = ref(false)
  const tableData = ref([])
  const oldTableData = ref([])
  const page = reactive({
    total: 0,
    rownumber: 20,
    pageNo: 1,
  })
  const originalPage = reactive({
    total: 0,
    rownumber: 20,
    pageNo: 1,
  })
  const recordManager = ref(new RecordManager())
  const onHandler = ref(false)
  const bx_auth_ticket = ref(null)

  const isTreeMode = computed(() => {
    return isTree?.value && listType?.value === 'treelist'
  })

  const treeInfoComputed = computed(() => {
    if (v2data?.value?.parent_no_col && v2data?.value?.no_col) {
      return {
        pidCol: v2data?.value?.parent_no_col,
        idCol: v2data?.value?.no_col,
        dispCol: v2data?.value?.key_disp_col,
        service: serviceName?.value,
      }
    }
    return treeInfo?.value
  })

  async function refreshV2() {
    const { getServiceV2 } = await import('../../../service/api')
    const v2Res = await getServiceV2(
      serviceName?.value,
      listType?.value,
      srvApp?.value,
      true
    )
    if (v2Res?.state === 'SUCCESS') {
      return v2Res.data
    } else {
      $message?.value?.error('登录信息更新，请重新加载页面')
    }
    return v2Res?.data
  }

  async function getList(insertNewRows = true, unfoldIds) {
    if (
      sessionStorage.getItem('bx_auth_ticket') &&
      bx_auth_ticket.value !== sessionStorage.getItem('bx_auth_ticket')
    ) {
      await refreshV2()
    }

    if (!unfoldIds && listType?.value === 'treelist' && treeInfoComputed.value?.idCol) {
      unfoldIds = tableData.value
        .filter((item) => !!item?.__unfold)
        .map((item) => item[treeInfoComputed.value.idCol])
    }

    if (serviceName?.value) {
      startLoading?.value?.(30 * 1000)
      let condition = [...(defaultConditions?.value || [])]
      if (initCond?.value?.length) {
        initCond.value.forEach((item) => {
          if (!condition.find((c) => c.colName === item.colName)) {
            if (item.ruleType === 'eq' && item.value === undefined) {
              return
            }
            condition.push(item)
          }
        })
      }
      condition = condition.map((item) => {
        if (item.value === 'null') {
          if (item.ruleType === 'eq' || item.ruleType === 'isnull') {
            item.ruleType = 'isnull'
          } else {
            item.ruleType = 'notnull'
          }
        }
        return item
      })

      const res = await onSelect(serviceName?.value, srvApp?.value, condition, {
        rownumber: isTreeMode.value ? 999999 : page.rownumber,
        pageNo: isTreeMode.value ? 1 : page.pageNo,
        vpage_no: v2data?.value?.vpage_no,
        order: sortState?.value,
        isTree: isTreeMode.value,
        pidCol: treeInfoComputed.value?.pidCol,
        forceUseTTD: $route?.value?.query?.topTreeData,
      })

      loading.value = false
      isFetched.value = true

      if (res?.data?.length) {
        if (res.page) {
          Object.assign(originalPage, res.page)
        }
        res.data = res.data.map((item) => {
          item.__button_auth = setButtonAuth?.value?.(
            v2data?.value?.rowButton,
            item
          )
          return item
        })
      } else if (res?.resultCode === '0011') {
        $refs?.value?.loginRef?.open(() => {
          context?.initPage?.(false)
        })
        return
      }

      if (res.page && 'total' in res.page) {
        page.total = res.page.total
      } else {
        page.total = res.data?.length || 0
      }

      let processedTableData = []
      for (let i = 0; i < res.data.length; i++) {
        const __id = uniqueId('table_item_')
        let dataItem = {
          rowKey: __id,
          __id,
          __flag: null,
          ...res.data[i],
        }
        if (unfoldIds && unfoldIds?.includes(res.data[i].id)) {
          dataItem.__unfold = true
        }
        processedTableData.push(dataItem)
      }

      if (isTreeMode.value) {
        const startIndex = (page.pageNo - 1) * page.rownumber
        const endIndex = startIndex + page.rownumber
        tableData.value = processedTableData.slice(startIndex, endIndex)
      } else {
        tableData.value = processedTableData
      }

      if (unfoldIds?.length) {
        tableData.value = await loadChildren(unfoldIds, tableData.value)
      }

      oldTableData.value = JSON.parse(JSON.stringify(tableData.value))
      recordManager.value = new RecordManager()

      if (!disabled?.value && tableData.value?.length === 0 && insertNewRows) {
        insert2Rows?.value?.(0)
      }
    }
  }

  async function loadChildren(ids, data) {
    if (!ids?.length) {
      return data
    }

    let loadingInstance = Loading.service({ fullscreen: true })
    const res = await onSelect(
      serviceName?.value,
      srvApp?.value,
      [
        {
          colName: treeInfoComputed.value?.pidCol,
          ruleType: 'in',
          value: ids.toString(),
        },
      ],
      {
        rownumber: 100000,
        pageNo: 1,
        vpage_no: v2data?.value?.vpage_no,
        order: sortState?.value,
        use_type: isTreeMode.value ? 'treelist' : listType?.value || 'list',
      }
    )
    loadingInstance.close()

    if (res?.state === 'SUCCESS') {
      for (let index = 0; index < data.length; index++) {
        const row = data[index]
        if (row?.__children) {
          break
        }
        let children = res.data.filter(
          (e) => e[treeInfoComputed.value?.pidCol] === row[treeInfoComputed.value?.idCol]
        )
        if (children?.length) {
          children = children.map((child) => {
            const __id = uniqueId('table_item_')
            child.__button_auth = setButtonAuth?.value?.(
              v2data?.value?.rowButton,
              child
            )
            let __indent = 40
            if (row.__indent === 0 || row.__indent > 0) {
              __indent = row.__indent + 40
            }

            let dataItem = {
              rowKey: __id,
              __id,
              __flag: null,
              ...child,
              __indent,
              __parent_row: cloneDeep(row),
            }
            return dataItem
          })
          row.__children = cloneDeep(children)
          row.__unfold = true
          data.splice(index + 1, 0, ...children)
        }
      }
    }
    return data
  }

  async function loadTree(load, row, rowIndex, callback, pageNo) {
    if (!tableData.value[rowIndex]) return

    tableData.value[rowIndex].__unfold = load

    if (load) {
      let loadingInstance = Loading.service({ fullscreen: true })
      const res = await onSelect(
        serviceName?.value,
        srvApp?.value,
        [
          {
            colName: treeInfoComputed.value?.pidCol,
            ruleType: 'eq',
            value: row[treeInfoComputed.value?.idCol],
          },
        ],
        {
          rownumber: 500,
          pageNo: pageNo || page.pageNo,
          vpage_no: v2data?.value?.vpage_no,
          order: sortState?.value,
          use_type: isTreeMode.value ? 'treelist' : listType?.value || 'list',
        }
      )

      if (res?.state === 'SUCCESS') {
        let processedData = cloneDeep(tableData.value)
        let __indent = 40
        if (row.__indent === 0 || row.__indent > 0) {
          __indent = row.__indent + 40
        }

        let resData = res.data.map((item) => {
          const __id = uniqueId('table_item_')
          item.__button_auth = setButtonAuth?.value?.(
            v2data?.value?.rowButton,
            item
          )

          let dataItem = {
            rowKey: __id,
            __id,
            __flag: null,
            ...item,
            __indent,
            __parent_row: cloneDeep(row),
          }
          return dataItem
        })

        processedData[rowIndex].__children = cloneDeep(resData)
        processedData.splice(rowIndex + 1, 0, ...cloneDeep(resData))
        tableData.value = cloneDeep(processedData)

        let oldData = oldTableData.value
        const oldRowDataIndex = oldData.findIndex(
          (item) => item.__id && item.__id === row.__id
        )
        oldData.splice(oldRowDataIndex + 1, 0, ...cloneDeep(resData))
        oldTableData.value = cloneDeep(oldData)

        tableData.value[rowIndex].__unfold = load
        loadingInstance.close()

        $nextTick?.value?.(() => {
          callback?.(true)
        })
        return resData
      } else {
        loadingInstance.close()
        callback?.(false)
      }
    }
  }

  function processUpdateData(item, oldItem, updateColsMapData) {
    const updateObj = {}
    const nullVal = [null, undefined, '']
    Object.keys(item).forEach((key) => {
      if (
        key.indexOf('_') !== 0 &&
        !ignoreKeys.includes(key) &&
        updateColsMapData?.[key]?.in_update !== 0
      ) {
        if (oldItem[key] !== item[key]) {
          if (nullVal.includes(item[key]) && nullVal.includes(oldItem[key])) {
            return
          }
          const colInfo = updateColsMapData?.[key]
          if (['Date', 'DateTime'].includes(colInfo?.col_type)) {
            if (dayjs(item[key]).isSame(dayjs(oldItem[key]))) {
              return
            }
          }
          if (item[key] === '' || item[key] == undefined) {
            item[key] = null
          }
          updateObj[key] = item[key]
        }
      }
    })
    return updateObj
  }

  function buildReqParams() {
    const reqData = []
    const addDatas = []

    tableData.value.forEach((item, index) => {
      const oldItem = oldTableData.value?.find(
        (d) => d.__id && d.__id === item.__id
      )

      if (!item.__flag && oldItem) {
        const updateObj = processUpdateData(
          item,
          oldItem,
          updateColsMap?.value
        )
        if (Object.keys(updateObj)?.length) {
          reqData.push({
            serviceName: updateButton?.value?.service_name,
            condition: [{ colName: 'id', ruleType: 'eq', value: item.id }],
            data: [updateObj],
          })
        }
      } else if (
        item.__flag === 'update' &&
        item.id &&
        updateButton?.value?.service_name
      ) {
        const updateObj = processUpdateData(
          item,
          oldItem,
          updateColsMap?.value
        )
        if (Object.keys(updateObj)?.length) {
          reqData.push({
            serviceName: updateButton?.value?.service_name,
            condition: [{ colName: 'id', ruleType: 'eq', value: item.id }],
            data: [updateObj],
          })
        }
      } else if (item.__flag === 'add' && addButton?.value?.service_name) {
        const addObj = { ...item }
        if (item.__update_col && Object.keys(item.__update_col).length) {
          const keys = Object.keys(item.__update_col)
          if (
            keys.every((key) => [undefined, null, ''].includes(item[key]))
          ) {
            return
          }
        } else {
          return
        }

        if (defaultConditions?.value?.length) {
          defaultConditions.value.forEach((cond) => {
            if (cond.value && !addObj[cond.colName]) {
              addObj[cond.colName] = cond.value
            }
          })
        }

        Object.keys(addObj).forEach((key) => {
          if (ignoreKeys.includes(key) || key.indexOf('_') === 0) {
            delete addObj[key]
          }
          if (
            addObj[key] === '' ||
            addObj[key] === undefined ||
            addObj[key] === null
          ) {
            delete addObj[key]
          }
        })

        if (
          Object.keys(addObj).length > 0 &&
          Object.keys(addObj).some(
            (key) =>
              addObj[key] !== undefined &&
              addObj[key] !== null &&
              addObj[key] !== ''
          )
        ) {
          addDatas.push(addObj)
        }
      }
    })

    if (addDatas?.length) {
      reqData.push({
        serviceName: addButton?.value?.service_name,
        data: addDatas,
      })
    }
    return reqData?.length ? reqData : null
  }

  function optimisticUpdate() {
    let _oldTableData = cloneDeep(oldTableData.value)
    let _tableData = cloneDeep(tableData.value)
    let _recordManager = cloneDeep(recordManager.value)

    tableData.value = tableData.value.map((item) => {
      if (item.__flag !== 'add') {
        delete item.__flag
      }
      return item
    })
    oldTableData.value = cloneDeep(tableData.value)
    recordManager.value = new RecordManager()
    recordManager.value?.push(cloneDeep(oldTableData.value))

    return {
      _oldTableData,
      _tableData,
      _recordManager,
    }
  }

  async function saveData(params = {}) {
    if (
      sessionStorage.getItem('bx_auth_ticket') &&
      bx_auth_ticket.value !== sessionStorage.getItem('bx_auth_ticket')
    ) {
      await refreshV2()
    }
    stopAutoSave?.value?.()

    const reqData = buildReqParams()
    if (!reqData?.length) {
      $message?.value?.error('没有需要保存的操作！')
      return
    }
    if (
      (!updateButton?.value?.service_name && !addButton?.value?.service_name) ||
      !Array.isArray(reqData) ||
      !reqData.length
    ) {
      return
    }

    if (onHandler.value) {
      return
    }
    onHandler.value = true

    const { _oldTableData, _tableData, _recordManager } = optimisticUpdate()
    const batchOperateList = []
    const reqDataObj = {}

    reqData.forEach(item => {
      const isAdd = !item.condition || !item.condition.length
      const raw = isAdd ? null : tableData.value.find(tableDataItem => 
        tableDataItem.id === item.condition.find(conditionItem => conditionItem.colName === 'id')?.value
      )
      const serviceNameData = {}

      item?.data?.forEach((data, index) => {
        Object.keys(data).forEach(key => {
          const column = tableMap?.value?.[key]
          let operateService = column?.serviceName
          if (isAdd) {
            operateService = item.serviceName
          }
          serviceNameData[operateService] || (serviceNameData[operateService] = {})
          serviceNameData[operateService].data || (serviceNameData[operateService].data = [])
          serviceNameData[operateService].data[index] || (serviceNameData[operateService].data[index] = {})
          serviceNameData[operateService].data[index][column.column] = data[key]

          if (!serviceNameData[operateService].condition && !isAdd) {
            serviceNameData[operateService].condition = JSON.parse(JSON.stringify(item.condition))
            serviceNameData[operateService].condition.forEach(conditionItem => {
              if (conditionItem.colName === 'id') {
                conditionItem.value = raw[column.id]
              }
            })
          }
          serviceNameData[operateService].serviceName || (serviceNameData[operateService].serviceName = operateService)
        })
      })

      Object.keys(serviceNameData).forEach(k => {
        reqDataObj[k] || (reqDataObj[k] = [])
        reqDataObj[k].push(serviceNameData[k])
      })
    })

    Object.keys(reqDataObj).forEach(k => {
      batchOperateList.push(onBatchOperate(reqDataObj[k], k, srvApp?.value))
    })

    Promise.all(batchOperateList)
      .then((resList) => {
        const res = {
          state: '',
          resultMessage: '',
          response: [],
          resultCode: ''
        }
        resList.forEach(r => {
          res.state = r.state
          res.resultMessage = r.resultMessage
          Array.isArray(r.response) && res.response.push(...r.response)
          res.resultCode = r.resultCode
        })
        onHandler.value = false

        if (res?.state === 'SUCCESS') {
          let msg = res.resultMessage || '操作成功'
          if (params?.isAutoSave) {
            msg = '自动保存成功!'
          } else {
            msg = '保存成功!'
          }
          Message({
            showClose: true,
            message: msg,
            type: 'success',
            duration: 800,
          })

          if (res.response?.length) {
            const updateList = []
            const addList = []
            res.response.forEach((item) => {
              if (
                item.serviceName?.lastIndexOf('_update') ===
                item.serviceName.length - 7
              ) {
                if (item.response.effect_data?.length) {
                  updateList.push(...item.response.effect_data)
                }
              } else if (
                item.serviceName?.lastIndexOf('_add') ===
                item.serviceName.length - 4
              ) {
                if (item.response.effect_data?.length) {
                  addList.push(...item.response.effect_data)
                }
              }
            })

            if (addList.length) {
              let currentAddList = tableData.value.filter(
                (item) => item.__flag === 'add'
              )
              if (currentAddList.length === addList.length) {
                let index = 0
                const localKeys = [
                  '__id',
                  '__parent_row',
                  'rowKey',
                  '_buttons',
                  '__unfold',
                  '__indent',
                  '__update_col',
                ]
                tableData.value = tableData.value.map((item) => {
                  if (item.__flag === 'add') {
                    localKeys.forEach((key) => {
                      addList[index][key] = item[key]
                    })
                    item = addList[index]
                    index++
                  }
                  item.__button_auth = setButtonAuth?.value?.(
                    v2data?.value?.rowButton,
                    item
                  )
                  return item
                })
              }
            }
          }

          optimisticUpdate()
          return
        } else {
          oldTableData.value = _oldTableData
          tableData.value = _tableData
          recordManager.value = _recordManager
          Message({
            showClose: true,
            message: res.resultMessage || '保存失败!',
            type: 'error',
          })
          if (res.resultCode === '0011') {
            bx_auth_ticket.value = ''
            $refs?.value?.loginRef?.open(() => {
              context?.initPage?.(false).then(() => {
                if (!tableData.value.length) {
                  getList()
                }
              })
            })
          }
        }
      })
      .catch((err) => {
        oldTableData.value = _oldTableData
        tableData.value = _tableData
        recordManager.value = _recordManager
        onHandler.value = false
      })
      .finally(() => {
        setTimeout(() => {
          onHandler.value = false
        }, 200)
      })
  }

  async function deleteRow(rows) {
    const deleIds = rows.map((item) => item.id)
    if (deleIds.length > 0) {
      const { _oldTableData, _tableData, _recordManager } = optimisticUpdate()
      const res = await onDelete(
        deleIds.toString(),
        deleteButton?.value?.service_name,
        srvApp?.value
      )
      if (res?.state === 'SUCCESS') {
        Message({
          showClose: true,
          message: res.resultMessage,
          type: 'success',
        })
        tableData.value = tableData.value.filter(
          (item) => !deleIds.includes(item.id)
        )
      } else if (res?.resultMessage) {
        oldTableData.value = _oldTableData
        tableData.value = _tableData
        recordManager.value = _recordManager
        Message({
          showClose: true,
          message: res.resultMessage,
          type: 'error',
        })
      }
    }
  }

  function validateCellChange({ row, column, changeValue, rowIndex }) {
    const colType = column?.__field_info?.col_type
    if (!colType) {
      return { valid: true }
    }

    let currentRow = tableData.value?.find(
      (item) => item.__id === row.__id
    )
    if (currentRow && changeValue === currentRow[column.field]) {
      return { valid: false, reason: 'value_not_changed' }
    }

    if (!isFieldEditable?.value?.(row, column)) {
      let message = '当前列不支持编辑'
      if (row.__flag === 'add') {
        message = '新增行不支持编辑当前列'
      } else if (row._edit_field && Array.isArray(row._edit_field)) {
        message = '当前列不在可编辑字段列表中'
      }
      return { valid: false, reason: 'not_editable', message }
    }

    if (['DateTime', 'Date', 'date', 'datetime'].includes(colType)) {
      let dateStr = extractAndFormatDatesOrTimestamps(changeValue, colType.toLowerCase())
      if (dateStr && dateStr !== changeValue) {
        return { valid: false, reason: 'need_format', formattedValue: dateStr }
      } else if (!dateStr && isNaN(new Date(changeValue).getTime())) {
        return { valid: false, reason: 'invalid_date', message: '非合法日期字符串' }
      }
    }

    if (
      ['Integer', 'Float', 'Money', 'int', 'Int'].includes(colType) ||
      colType?.includes('decimal')
    ) {
      if (isNaN(Number(changeValue))) {
        return { valid: false, reason: 'invalid_number', message: '请输入数字' }
      }
    }

    return { valid: true }
  }

  function handleAfterCellChange({ row, column, changeValue, rowIndex }) {
    const colType = column?.__field_info?.col_type
    if (!colType) {
      return
    }

    let oldRow = oldTableData.value?.find(
      (item) => item.__id === row.__id
    )
    let currentRow = tableData.value?.find(
      (item) => item.__id === row.__id
    )

    if (oldRow?.[column.field] === changeValue) {
      if (row.__flag === 'update') {
        row.__flag = null
      }
      return
    }

    if (
      ['Integer', 'Float', 'Money', 'int', 'Int'].includes(colType) ||
      colType?.includes('decimal')
    ) {
      if (changeValue && typeof changeValue === 'string') {
        tableData.value.forEach((item) => {
          if (item.__id === row.__id && item.__id) {
            item[column.field] = Number(changeValue)
          }
        })
      }
    }

    if (row.__id && row.__flag !== 'add') {
      // update flag already set
    } else if (row.__flag === 'add') {
      if (row.__update_col) {
        row.__update_col[column.field] = true
      } else {
        row.__update_col = {}
        row.__update_col[column.field] = true
      }
    }

    let calcDependedCols = null
    if (row.__flag === 'add') {
      calcDependedCols = column.__field_info?.__add_calc_depended_cols
    } else {
      calcDependedCols = column.__field_info?.__update_calc_depended_cols
    }

    if (
      Array.isArray(calcDependedCols) &&
      calcDependedCols.length &&
      changeValue !== oldRow?.[column.field]
    ) {
      calcDependedCols.forEach((key) => {
        const calcCol = allFields?.value?.find(
          (item) => item.columns === key
        )
        if (calcCol?.redundant?.func) {
          handleRedundantCalc?.value?.(calcCol, row)
        }
      })
    }

    if (isFk(column?.__field_info)) {
      if (changeValue) {
        let fkUtil = new FkUtil(
          column?.__field_info,
          srvApp?.value,
          fkRawDataMap?.value
        )
        fkUtil.getMatchedValue(changeValue, 'eq').then((matchedValue) => {
          if (matchedValue) {
            const item = {
              value: changeValue,
              rawData: matchedValue,
            }
            fkChange?.value?.(item, row, column)
          }
        })
      }
    }

    recordManager.value?.push(cloneDeep(tableData.value))

    if (childListType?.value) {
      emitListData?.value?.(tableData.value)
    }
    autoSave?.value?.()
  }

  function handleSizeChange(val) {
    page.rownumber = val
    getList()
  }

  function handleCurrentChange(val) {
    page.pageNo = val
    getList()
  }

  function refreshData() {
    if (onHandler.value) {
      Message.warning('正在进行其他操作，请稍候重试~')
      return
    }
    const reqData = buildReqParams()

    if (reqData?.length === 0 || !reqData) {
      getList()
      return
    }

    return {
      confirm: () => {
        page.pageNo = 1
        isFetched.value = false
        getList().then(() => {
          isFetched.value = true
        })
      }
    }
  }

  watch(
    () => tableData.value,
    (newValue, oldValue) => {
      // tableData 变化时的处理
    },
    { deep: true }
  )

  return {
    loading,
    isFetched,
    tableData,
    oldTableData,
    page,
    originalPage,
    recordManager,
    onHandler,
    bx_auth_ticket,
    isTreeMode,
    treeInfoComputed,

    getList,
    loadChildren,
    loadTree,
    saveData,
    deleteRow,
    buildReqParams,
    optimisticUpdate,
    processUpdateData,
    validateCellChange,
    handleAfterCellChange,
    handleSizeChange,
    handleCurrentChange,
    refreshData,
    refreshV2,
  }
}

export function createDataProcessorContext() {
  return {
    loading: ref(false),
    isFetched: ref(false),
    tableData: ref([]),
    oldTableData: ref([]),
    page: reactive({
      total: 0,
      rownumber: 20,
      pageNo: 1,
    }),
    recordManager: ref(new RecordManager()),
    onHandler: ref(false),
  }
}
