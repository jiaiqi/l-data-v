import { ref, reactive, computed, toRefs } from 'vue'
import { useUserStore } from '@/stores/user.js'

export function usePermission(props) {
  const {
    v2data,
    addColsMap,
    updateColsMap,
    disabled,
  } = toRefs(props || {})

  const userStore = useUserStore()

  const isSuperAdmin = ref(false)
  const showAllFields = ref(false)

  const isAdmin = computed(() => {
    return userStore?.hasRole('admin') || userStore?.hasRole('ADMIN')
  })

  const addButton = computed(() => {
    return v2data?.value?.gridButton?.find(
      (item) =>
        item.button_type.includes('add') &&
        item.permission &&
        item.service_name
    )
  })

  const deleteButton = computed(() => {
    return v2data?.value?.rowButton?.find(
      (item) =>
        item.button_type.includes('delete') &&
        item.permission &&
        item.service_name
    )
  })

  const updateButton = computed(() => {
    return v2data?.value?.rowButton?.find(
      (item) =>
        item.button_type?.includes('edit') &&
        item.permission &&
        item.service_name
    )
  })

  const detailButton = computed(() => {
    return v2data?.value?.rowButton?.find((item) =>
      item.button_type?.includes('detail')
    )
  })

  const gridButton = computed(() => {
    return v2data?.value?.gridButton?.filter((item) => {
      if (['select', 'refresh'].includes(item.button_type)) {
        return false
      }
      if (['增加弹出']?.includes(item.operate_type)) {
        return false
      }
      if (!item.permission) {
        return false
      }
      return true
    })
  })

  const rowButton = computed(() => {
    return v2data?.value?.rowButton
      ?.filter((item, index) => {
        item._index = index
        return !['edit'].includes(item.button_type) && item.permission
      })
      ?.map((item) => {
        return {
          label: item.button_name,
          ...item,
        }
      })
  })

  function isFieldEditable(row, column) {
    if (isSuperAdmin.value) {
      return true
    }

    if (row.__flag === 'add') {
      return !!addColsMap?.value?.[column.field]?.in_add
    }

    if (row._edit_field && Array.isArray(row._edit_field)) {
      return row._edit_field.includes(column.field)
    }

    if (!row?.__button_auth?.edit) {
      return false
    }

    return !!updateColsMap?.value?.[column.field]?.in_update
  }

  function setButtonAuth(btns, data) {
    const obj = {}
    if (Array.isArray(btns) && btns?.length) {
      btns.forEach((btn, index) => {
        if (
          data?._buttons?.length &&
          data?._buttons?.length === btns?.length
        ) {
          if (data?._buttons[index] === 1) {
            obj[btn.button_type] = true
          } else if (data?._buttons[index] === 0) {
            obj[btn.button_type] = false
          }
        } else {
          obj[btn.button_type] = btn.permission === true
        }
      })
    }
    return obj
  }

  function toggleSuperAdmin() {
    isSuperAdmin.value = !isSuperAdmin.value
  }

  function toggleShowAllFields() {
    showAllFields.value = !showAllFields.value
  }

  function hasRowEditPermission(row) {
    if (isSuperAdmin.value) {
      return true
    }
    return row?.__button_auth?.edit === true
  }

  function hasRowDeletePermission(row) {
    if (isSuperAdmin.value) {
      return true
    }
    return row?.__button_auth?.delete === true
  }

  function canAddRow() {
    return !!addButton.value?.permission
  }

  function canUpdateRow() {
    return !!updateButton.value?.permission
  }

  function canDeleteRow() {
    return !!deleteButton.value?.permission
  }

  return {
    isSuperAdmin,
    showAllFields,
    isAdmin,
    addButton,
    deleteButton,
    updateButton,
    detailButton,
    gridButton,
    rowButton,
    isFieldEditable,
    setButtonAuth,
    toggleSuperAdmin,
    toggleShowAllFields,
    hasRowEditPermission,
    hasRowDeletePermission,
    canAddRow,
    canUpdateRow,
    canDeleteRow,
  }
}

export function createPermissionContext() {
  const state = reactive({
    isSuperAdmin: false,
    showAllFields: false,
  })

  const userStore = useUserStore()

  const isAdmin = computed(() => {
    return userStore?.hasRole('admin') || userStore?.hasRole('ADMIN')
  })

  function toggleSuperAdmin() {
    state.isSuperAdmin = !state.isSuperAdmin
  }

  function toggleShowAllFields() {
    state.showAllFields = !state.showAllFields
  }

  return {
    ...toRefs(state),
    isAdmin,
    toggleSuperAdmin,
    toggleShowAllFields,
  }
}

export function useButtonPermission(v2data) {
  const addButton = computed(() => {
    return v2data?.value?.gridButton?.find(
      (item) =>
        item.button_type.includes('add') &&
        item.permission &&
        item.service_name
    )
  })

  const deleteButton = computed(() => {
    return v2data?.value?.rowButton?.find(
      (item) =>
        item.button_type.includes('delete') &&
        item.permission &&
        item.service_name
    )
  })

  const updateButton = computed(() => {
    return v2data?.value?.rowButton?.find(
      (item) =>
        item.button_type?.includes('edit') &&
        item.permission &&
        item.service_name
    )
  })

  const detailButton = computed(() => {
    return v2data?.value?.rowButton?.find((item) =>
      item.button_type?.includes('detail')
    )
  })

  const gridButton = computed(() => {
    return v2data?.value?.gridButton?.filter((item) => {
      if (['select', 'refresh'].includes(item.button_type)) {
        return false
      }
      if (['增加弹出']?.includes(item.operate_type)) {
        return false
      }
      if (!item.permission) {
        return false
      }
      return true
    })
  })

  const rowButton = computed(() => {
    return v2data?.value?.rowButton
      ?.filter((item, index) => {
        item._index = index
        return !['edit'].includes(item.button_type) && item.permission
      })
      ?.map((item) => {
        return {
          label: item.button_name,
          ...item,
        }
      })
  })

  return {
    addButton,
    deleteButton,
    updateButton,
    detailButton,
    gridButton,
    rowButton,
  }
}

export function useFieldPermission(isSuperAdmin, addColsMap, updateColsMap) {
  function isFieldEditable(row, column) {
    if (isSuperAdmin?.value) {
      return true
    }

    if (row.__flag === 'add') {
      return !!addColsMap?.value?.[column.field]?.in_add
    }

    if (row._edit_field && Array.isArray(row._edit_field)) {
      return row._edit_field.includes(column.field)
    }

    if (!row?.__button_auth?.edit) {
      return false
    }

    return !!updateColsMap?.value?.[column.field]?.in_update
  }

  return {
    isFieldEditable,
  }
}

export function useRowPermission(isSuperAdmin) {
  function hasRowEditPermission(row) {
    if (isSuperAdmin?.value) {
      return true
    }
    return row?.__button_auth?.edit === true
  }

  function hasRowDeletePermission(row) {
    if (isSuperAdmin?.value) {
      return true
    }
    return row?.__button_auth?.delete === true
  }

  function setButtonAuth(btns, data) {
    const obj = {}
    if (Array.isArray(btns) && btns?.length) {
      btns.forEach((btn, index) => {
        if (
          data?._buttons?.length &&
          data?._buttons?.length === btns?.length
        ) {
          if (data?._buttons[index] === 1) {
            obj[btn.button_type] = true
          } else if (data?._buttons[index] === 0) {
            obj[btn.button_type] = false
          }
        } else {
          obj[btn.button_type] = btn.permission === true
        }
      })
    }
    return obj
  }

  return {
    hasRowEditPermission,
    hasRowDeletePermission,
    setButtonAuth,
  }
}
