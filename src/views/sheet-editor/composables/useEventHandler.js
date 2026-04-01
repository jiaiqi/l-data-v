import { ref, reactive, computed, onMounted, onUnmounted, toRefs, nextTick } from 'vue'
import { cloneDeep, debounce } from 'lodash-es'
import { Message } from 'element-ui'
import { processStrings, appendNumber } from '../../../common/common'
import { copyTextToClipboard } from '@/common/common.js'
import { isFkAutoComplete, isFk } from '../../../utils/sheetUtils'

export function useEventHandler(context) {
  const {
    tableRef,
    tableData,
    oldTableData,
    columns,
    v2data,
    listType,
    treeInfo,
    addButton,
    deleteButton,
    updateButton,
    addColsMap,
    updateColsMap,
    isSuperAdmin,
    disabled,
    showFieldEditor,
    fieldEditorParams,
    serviceName,
    srvApp,
    $set,
    $message,
    $confirm,
    $nextTick,
    isFieldEditable,
    buildFieldEditorParams,
    clearFieldEditorParams,
    clearCellSelection,
    triggerEditCell,
    insert2Rows,
    deleteRow,
    showChangeParent,
    saveData,
    undo,
    redo,
  } = toRefs(context || {})

  const selectionStats = reactive({
    visible: false,
    sum: 0,
    count: 0,
    numericCount: 0,
    avg: 0,
    min: 0,
    max: 0
  })

  const keydownHandler = ref(null)

  function handleCellSelection() {
    nextTick(() => {
      const selection = tableRef?.value?.getRangeCellSelection()

      if (!selection || !selection.selectionRangeIndexes) {
        selectionStats.visible = false
        return
      }

      const { startRowIndex, endRowIndex, startColIndex, endColIndex } = selection.selectionRangeIndexes

      if (startRowIndex === endRowIndex && startColIndex === endColIndex) {
        selectionStats.visible = false
        return
      }

      const stats = calculateSelectionStats(startRowIndex, endRowIndex, startColIndex, endColIndex)

      if (stats.count === 0) {
        selectionStats.visible = false
        return
      }

      selectionStats.visible = true
      selectionStats.sum = stats.sum
      selectionStats.count = stats.count
      selectionStats.numericCount = stats.numericCount
      selectionStats.avg = stats.avg
      selectionStats.min = stats.min
      selectionStats.max = stats.max
    })
  }

  function calculateSelectionStats(startRowIndex, endRowIndex, startColIndex, endColIndex) {
    let sum = 0
    let count = 0
    let numericCount = 0
    let numbers = []

    for (let i = startRowIndex; i <= endRowIndex; i++) {
      const row = tableData?.value?.[i]
      if (!row) continue

      for (let j = startColIndex; j <= endColIndex; j++) {
        const column = columns?.value?.[j]
        if (!column || !column.field) continue

        const cellValue = row[column.field]
        count++

        if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
          const numValue = Number(cellValue)
          if (!isNaN(numValue) && isFinite(numValue)) {
            sum += numValue
            numericCount++
            numbers.push(numValue)
          }
        }
      }
    }

    const avg = numericCount > 0 ? sum / numericCount : 0
    const min = numbers.length > 0 ? Math.min(...numbers) : 0
    const max = numbers.length > 0 ? Math.max(...numbers) : 0

    return {
      sum: Number(sum.toFixed(2)),
      count,
      numericCount,
      avg: Number(avg.toFixed(2)),
      min: Number(min.toFixed(2)),
      max: Number(max.toFixed(2))
    }
  }

  const eventCustomOption = computed(() => ({
    bodyRowEvents: ({ row, rowIndex }) => ({
      dblclick: (event) => {
        console.log('dblclick::', row, rowIndex, event)
        return false
      },
      contextmenu: (event) => {
        console.log('bodyRowEvents::', row, rowIndex, event)
        event.preventDefault()
        return false
      },
    }),
    bodyCellEvents: ({ row, column, rowIndex }) => ({
      mouseenter: (event) => {
        handleCellSelection()
      },
      click: (event) => {
        if (
          fieldEditorParams?.value?.row?.rowKey &&
          fieldEditorParams?.value?.column?.key
        ) {
          if (
            row?.rowKey !== fieldEditorParams?.value?.row?.rowKey ||
            column?.key !== fieldEditorParams?.value?.column?.key
          ) {
            clearFieldEditorParams?.value?.()
          }
        }

        if (column.edit) {
          const colType = column?.__field_info?.col_type
          if (!colType) {
            return
          }
          const currentCellSelection =
            tableRef?.value?.cellSelectionData?.currentCell
          console.log('cell click::', colType)
          if (
            currentCellSelection &&
            currentCellSelection?.colKey === column.key &&
            currentCellSelection?.rowKey === row.rowKey
          ) {
            if (
              isFieldEditable?.value?.(row, column) &&
              (['Date', 'DateTime'].includes(colType) ||
              ['fks', 'fkjson', 'fkjsons'].includes(colType) ||
              ['Enum', 'Dict', 'Set'].includes(colType) ||
              isFkAutoComplete(column?.__field_info) ||
              isFk(column?.__field_info) ||
              column?.__field_info?.trig_act)
            ) {
              nextTick(() => {
                clearFieldEditorParams?.value?.()
                setTimeout(() => {
                  nextTick(() => {
                    event.stopPropagation()
                    buildFieldEditorParams?.value?.(row, column)
                    if (showFieldEditor?.value !== undefined) {
                      showFieldEditor.value = true
                    }
                  })
                }, 200)
              })
            }
          }
        }
      },
      dblclick: (event) => {
        console.log('cell dblclick::', row, column, rowIndex, event)
        const colType = column?.__field_info?.col_type
        if (!colType) return

        if (isFieldEditable?.value?.(row, column)) {
          if (column?.__field_info?.trig_act) {
            event.stopPropagation()
            buildFieldEditorParams?.value?.(row, column)
            if (showFieldEditor?.value !== undefined) {
              showFieldEditor.value = true
            }
            nextTick(() => {
              clearCellSelection?.value?.()
            })
            return false
          }
          if (['Note', 'RichText', 'snote'].includes(colType)) {
            event.stopPropagation()
            console.log('弹出富文本编辑器')
            buildFieldEditorParams?.value?.(row, column)
            if (showFieldEditor?.value !== undefined) {
              showFieldEditor.value = true
            }
            nextTick(() => {
              clearCellSelection?.value?.()
            })
            return false
          } else if (['MultilineText'].includes(colType)) {
            return false
          } else if (['Date', 'DateTime'].includes(colType)) {
            event.stopPropagation()
            nextTick(() => {
              tableRef?.value?.stopEditingCell()
            })
          } else if (['String'].includes(colType)) {
            if (column?.__field_info?.redundant_options?._target_column) {
              event.stopPropagation()
              nextTick(() => {
                tableRef?.value?.stopEditingCell()
              })
            }
          }
        }
        return false
      },
    }),
  }))

  const cellAutofillOption = computed(() => ({
    directionX: false,
    directionY: true,
    afterAutofill: ({ targetSelectionRangeIndexes, sourceSelectionData }) => {
    },
    beforeAutofill: ({
      direction,
      sourceSelectionRangeIndexes,
      targetSelectionRangeIndexes,
      sourceSelectionData,
      targetSelectionData,
    }) => {
      if (
        sourceSelectionRangeIndexes.startRowIndex !==
        targetSelectionRangeIndexes.endRowIndex
      ) {
        if (sourceSelectionData?.length > 1) {
          let val = null
          let key = Object.keys(sourceSelectionData[0]).find(
            (e) => e !== 'rowKey'
          )
          let customFill = sourceSelectionData.every((item, index) => {
            if (
              index <= sourceSelectionData.length - 1 &&
              index > 0 &&
              !isNaN(Number(item[key]))
            ) {
              val = item[key] - sourceSelectionData[index - 1][key]
              if (val === item[key] - sourceSelectionData[index - 1][key]) {
                return true
              }
              return false
            }
            return true
          })
          if (
            sourceSelectionData.length === 2 &&
            sourceSelectionData[0][key] !== sourceSelectionData[1][key]
          ) {
            if (
              !isNaN(
                sourceSelectionData[1][key] - sourceSelectionData[0][key]
              )
            ) {
              customFill = true
              val =
                sourceSelectionData[1][key] - sourceSelectionData[0][key]
            }
          }

          if (customFill) {
            let lastVal =
              sourceSelectionData[sourceSelectionData.length - 1][key]
            let diff = null
            if (sourceSelectionData.length > 1) {
              diff = processStrings(
                sourceSelectionData[0][key],
                sourceSelectionData[1][key]
              )?.diff
            }
            if (diff) {
              let isProcess = sourceSelectionData.every((item, index) => {
                if (index === sourceSelectionData.length - 1) {
                  return true
                }
                return (
                  processStrings(
                    item[key],
                    sourceSelectionData[index + 1][key]
                  )?.diff === diff
                )
              })
              if (isProcess) {
                tableData?.value?.forEach((item) => {
                  let index = targetSelectionData.findIndex(
                    (e) => e.rowKey && e.rowKey === item.rowKey
                  )
                  if (index > -1) {
                    let curVal = appendNumber(lastVal, diff, index + 1)
                    if (typeof lastVal === 'number') {
                      curVal = Number(curVal)
                    }
                    if (!item['__update_col']) {
                      $set?.value?.(item, '__update_col', { [key]: true })
                    }
                    $set?.value?.(item, key, curVal)
                  }
                })
                triggerEditCell?.value?.(targetSelectionRangeIndexes)
                return false
              }
            }

            tableData?.value?.forEach((item) => {
              let index = targetSelectionData.findIndex(
                (e) => e.rowKey && e.rowKey === item.rowKey
              )
              if (index > -1) {
                let curVal = Number(lastVal) + val * (index + 1)
                if (typeof lastVal === 'string') {
                  curVal = curVal + ''
                }
                if (!item['__update_col']) {
                  $set?.value?.(item, '__update_col', { [key]: true })
                }
                $set?.value?.(item, key, curVal)
              }
            })
            triggerEditCell?.value?.(targetSelectionRangeIndexes)
            return false
          }
        } else if (sourceSelectionData?.length > 0) {
          const rowKey = sourceSelectionData[0]?.rowKey
          if (rowKey) {
            const sourceData = tableData?.value?.find(
              (item) => item.rowKey === rowKey
            )
            let key = Object.keys(sourceSelectionData[0]).find(
              (e) => e !== 'rowKey'
            )
            tableData?.value?.forEach((item, tIndex) => {
              for (let index = targetSelectionRangeIndexes.startRowIndex; index <= targetSelectionRangeIndexes.endRowIndex; index++) {
                if (tIndex > -1 && tIndex === index) {
                  if (!item['__update_col']) {
                    $set?.value?.(item, '__update_col', { [key]: true })
                  }
                }
              }
            })
            if (sourceData) {
              nextTick(() => {
                triggerEditCell?.value?.(
                  targetSelectionRangeIndexes,
                  sourceData
                )
              })
            }
          }
        }
      }
    },
  }))

  const contextMenus = computed(() => {
    let arr = [
      { type: 'CUT' },
      { type: 'COPY' },
      { type: 'SEPARATOR' },
    ]

    if (addButton?.value) {
      arr.push(
        { type: 'insertRowAbove', label: '上方插入行' },
        { type: 'insertRowsAbove', label: '上方插入多行' },
        { type: 'insertRowBelow', label: '下方插入行' },
        { type: 'insertRowsBelow', label: '下方插入多行' },
        { type: 'SEPARATOR' }
      )
    }

    arr.push(
      { type: 'removeRow', label: '删除选中行数据' },
      { type: 'SEPARATOR' },
      {
        type: 'CALCULATE',
        label: '计算',
        children: [
          { type: 'SUM', label: '求和' },
          { type: 'AVG', label: '平均值' },
          { type: 'COUNT', label: '计数' },
          { type: 'MAX', label: '最大值' },
          { type: 'MIN', label: '最小值' },
        ],
      }
    )

    const addChildButton = v2data?.value?.rowButton?.find((item) =>
      item.button_type.includes('addchild')
    )
    if (addChildButton) {
      const treeMenus = [
        { type: 'addchild', label: '添加下级节点' },
        { type: 'changeParent', label: '更改父节点' },
        { type: 'SEPARATOR' },
      ]
      arr.unshift(...treeMenus)
    }
    return arr
  })

  const contextmenuBodyOption = computed(() => ({
    beforeShow: ({
      isWholeRowSelection,
      selectionRangeKeys,
      selectionRangeIndexes,
    }) => {
      console.log('---contextmenu body beforeShow--')
      console.log('isWholeColSelection::', isWholeRowSelection)
      console.log('selectionRangeKeys::', selectionRangeKeys)
      console.log('selectionRangeIndexes::', selectionRangeIndexes)
      return false
    },
    afterMenuClick: ({
      type,
      selectionRangeKeys,
      selectionRangeIndexes,
    }) => {
      console.log('---contextmenu body afterMenuClick--')
      console.log('type::', type)
      console.log('selectionRangeKeys::', selectionRangeKeys)
      console.log('selectionRangeIndexes::', selectionRangeIndexes)
      const endRowIndex = selectionRangeIndexes.endRowIndex
      let startRowIndex = selectionRangeIndexes.startRowIndex
      const startRow = cloneDeep(tableData?.value?.[startRowIndex])

      if (['SUM', 'AVG', 'COUNT', 'MIN', 'MAX'].includes(type)) {
        const startColIndex = selectionRangeIndexes.startColIndex
        const endColIndex = selectionRangeIndexes.endColIndex
        const rows = tableData?.value?.slice(startRowIndex, endRowIndex + 1)
        const cols = columns?.value
          .slice(startColIndex, endColIndex + 1)
          .map((item) => item.field)
        console.log(rows, cols, ':::求和计数:::')
        let result = null
        let valid = 0

        switch (type) {
          case 'SUM':
            result = rows.reduce((res, cur) => {
              cols.forEach((col) => {
                if (!Number.isNaN(Number(cur[col]))) {
                  valid++
                  res += Number(cur[col])
                }
              })
              return res
            }, 0)
            break
          case 'AVG':
            result =
              rows.reduce((res, cur) => {
                cols.forEach((col) => {
                  if (!Number.isNaN(Number(cur[col]))) {
                    valid++
                    res += Number(cur[col])
                  }
                })
                return res
              }, 0) / valid
            break
          case 'COUNT':
            if (cols.length > rows.length) {
              $message?.value?.error('行数跟列数只能有一个大于1')
              return
            } else if (cols.length > rows.length) {
              result = cols.length
              valid++
            } else {
              result = rows.length
              valid++
            }
            break
          case 'MIN':
            result = rows.reduce((res, cur) => {
              cols.forEach((col) => {
                if (!Number.isNaN(Number(cur[col]))) {
                  res = Math.min(res, Number(cur[col]))
                  valid++
                }
              })
              return res
            }, Number.MAX_SAFE_INTEGER)
            break
          case 'MAX':
            result = rows.reduce((res, cur) => {
              cols.forEach((col) => {
                if (!Number.isNaN(Number(cur[col]))) {
                  res = Math.max(res, Number(cur[col]))
                  valid++
                }
              })
              return res
            }, Number.MIN_SAFE_INTEGER)
            break
        }

        if (valid === 0) {
          result = null
        }

        if (
          ![
            null,
            Number.MAX_SAFE_INTEGER,
            Number.MIN_SAFE_INTEGER,
          ].includes(result)
        ) {
          $confirm?.value?.(
            `${type}结果为： ${result} ,是否将结果复制到剪切板？`,
            '提示',
            { type: 'success' }
          )
            .then(() => {
              copyTextToClipboard(result).then((res) => {
                console.log(res)
                if (res.success) {
                  $message?.value?.success('复制成功')
                } else if (res.msg) {
                  $message?.value?.error(res.msg)
                } else {
                  $message?.value?.error('复制失败')
                }
              })
            })
            .catch(() => {
              console.log('取消复制')
            })
        } else {
          $message?.value?.error('计算异常！请检查数据格式是否正确')
        }
      } else if (type === 'addchild') {
        if (startRow?.__flag === 'add') {
          $message?.value?.error('新增行不能直接添加下级节点,请先保存操作!')
          return
        }
        $set?.value?.(tableData?.value?.[startRowIndex], '__unfold', true)
        insert2Rows?.value?.(startRowIndex + 1, startRow)
      } else if (type === 'changeParent') {
        if (startRow?.__flag === 'add') {
          $message?.value?.error('新增行不能直接更改父节点,请先保存操作!')
          return
        }
        if (startRow.__flag !== 'add' && !startRow?.__button_auth?.edit) {
          $message?.value?.error('没有当前行的编辑权限')
          return
        }
        showChangeParent?.value?.(startRow)
      } else if (['insertRowBelow', 'insertRowsBelow'].includes(type)) {
        let lastChildIndex = -1
        if (listType?.value === 'treelist' && treeInfo?.value?.pidCol) {
          lastChildIndex = tableData?.value?.findLastIndex(
            (item) =>
              item[treeInfo?.value?.pidCol] === startRow[treeInfo?.value?.idCol]
          )
          if (lastChildIndex != -1) {
            startRowIndex = lastChildIndex
          }
        }

        let aNumber = 1
        if (type === 'insertRowsBelow') {
          aNumber = Number(window.prompt('输入插入的行数', ''))
          if (!aNumber) {
            $message?.value?.('用户取消操作')
            return
          } else if (aNumber < 0) {
            $message?.value?.('只能输入大于0的整数')
            return
          }
        }
        for (let index = 0; index < aNumber; index++) {
          const rIndex = startRowIndex + index + 1
          insert2Rows?.value?.(rIndex, startRow?.__parent_row)
        }
      } else if (['insertRowAbove', 'insertRowsAbove'].includes(type)) {
        let aNumber = 1
        if (type === 'insertRowsAbove') {
          aNumber = Number(window.prompt('输入插入的行数', ''))
          if (!aNumber) {
            $message?.value?.('用户取消操作')
            return
          } else if (aNumber < 0) {
            $message?.value?.('只能输入大于0的整数')
            return
          }
        }
        for (let index = 0; index < aNumber; index++) {
          insert2Rows?.value?.(startRowIndex + index, startRow?.__parent_row)
        }
      } else if (type === 'removeRow') {
        let willDeleteLocalRows = []
        let willDeleteOriginRows = []
        tableData?.value?.forEach((item, index) => {
          if (index >= startRowIndex && index <= endRowIndex) {
            if (item.__flag == 'add') {
              item.__index = index
              willDeleteLocalRows.push(item.__id)
            } else {
              willDeleteOriginRows.push(item)
            }
          }
        })

        let text = `此操作将永久删除该第${selectionRangeIndexes.startRowIndex + 1}至第${selectionRangeIndexes.endRowIndex + 1}行数据，是否继续操作？`
        if (selectionRangeIndexes.endRowIndex - selectionRangeIndexes.startRowIndex == 0) {
          text = `此操作将永久删除该第${selectionRangeIndexes.startRowIndex + 1}行数据，是否继续操作？`
        }
        $confirm?.value?.(text, '提示', {
          distinguishCancelAndClose: true,
          confirmButtonText: '确认',
          cancelButtonText: '点错了',
          type: 'error',
        })
          .then(() => {
            if (willDeleteLocalRows?.length) {
              if (tableData?.value) {
                tableData.value = tableData.value.filter(
                  (item) => !willDeleteLocalRows.includes(item.__id)
                )
              }
            }
            if (willDeleteOriginRows?.length) {
              if (!deleteButton?.value?.service_name) {
                $message?.value?.({
                  type: 'error',
                  message: '没有删除已有数据权限',
                })
                return false
              }
              deleteRow?.value?.(willDeleteOriginRows)
            }
          })
          .catch((action) => {
            $message?.value?.({
              type: 'info',
              message: '用户取消操作',
            })
          })
      }
    },
    contextmenus: contextMenus.value,
  }))

  const onCtrlS = debounce(
    function () {
      saveData?.value?.()
    },
    1000,
    {
      leading: true,
      trailing: false,
    }
  )

  function bindKeydownListener(e = {}) {
    const keyCode = e.keyCode || e.which
    keyCode === 116 && e.preventDefault()

    if (keyCode === 27 && showFieldEditor?.value) {
      showFieldEditor.value = false
    }

    if (showFieldEditor?.value) {
      return
    }

    if (e.ctrlKey || e.metaKey) {
      if (['z', 'Z'].includes(e.key)) {
        if (e.shiftKey) {
          redo?.value?.()
        } else {
          undo?.value?.()
        }
      } else if (['Y', 'y'].includes(e.key)) {
        redo?.value?.()
      } else if (e.key === 's') {
        e.preventDefault()
        console.log('CTRL+S')
        onCtrlS()
      } else if (e.key === '+' || e.key === '=') {
        console.log('CTRL +')
        e.preventDefault()
        const selection = tableRef?.value?.getRangeCellSelection()
        let index = 0
        if (selection?.selectionRangeIndexes?.endRowIndex) {
          index = selection?.selectionRangeIndexes?.endRowIndex
        }
        insert2Rows?.value?.(index)
      }
    } else {
      if (keyCode === 116) {
        console.log('F5被按下')
        $message?.value?.({
          type: 'info',
          message: '刷新数据',
          duration: 500,
        })
      }
    }
  }

  function initDocumentEventListener() {
    removeDocumentEventListener()
    keydownHandler.value = bindKeydownListener
    document.addEventListener('keydown', keydownHandler.value)
  }

  function removeDocumentEventListener() {
    if (keydownHandler.value) {
      document.removeEventListener('keydown', keydownHandler.value)
      keydownHandler.value = null
    }
  }

  function setupEventListeners() {
    initDocumentEventListener()
  }

  function cleanupEventListeners() {
    removeDocumentEventListener()
  }

  return {
    selectionStats,
    eventCustomOption,
    cellAutofillOption,
    contextmenuBodyOption,
    contextMenus,
    handleCellSelection,
    calculateSelectionStats,
    bindKeydownListener,
    initDocumentEventListener,
    removeDocumentEventListener,
    setupEventListeners,
    cleanupEventListeners,
    onCtrlS,
  }
}

export function createEventHandlerContext() {
  const selectionStats = reactive({
    visible: false,
    sum: 0,
    count: 0,
    numericCount: 0,
    avg: 0,
    min: 0,
    max: 0
  })

  const keydownHandler = ref(null)

  function initDocumentEventListener(handler) {
    removeDocumentEventListener()
    keydownHandler.value = handler
    document.addEventListener('keydown', keydownHandler.value)
  }

  function removeDocumentEventListener() {
    if (keydownHandler.value) {
      document.removeEventListener('keydown', keydownHandler.value)
      keydownHandler.value = null
    }
  }

  return {
    selectionStats,
    keydownHandler,
    initDocumentEventListener,
    removeDocumentEventListener,
  }
}
