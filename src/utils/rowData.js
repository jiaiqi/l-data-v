const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const isValidKey = (key) => key !== undefined && key !== null && key !== "";

function uniq(list) {
  return [...new Set(list.filter(isValidKey))];
}

function getColumnKeys(col = {}) {
  const pageKeys = uniq([col.columns, col.aliasName, col.alias_name, col.name]);
  const realKeys = uniq([
    col.table_column,
    col.tableColumn,
    col.originalColumns,
    col.original_columns,
    col.colName,
    col.col_name,
    col.real_column,
    col.realColumn,
    col.columns,
  ]);
  return { pageKeys, realKeys };
}

export function getRowValue(row = {}, fieldName, columns = []) {
  if (!row || !isValidKey(fieldName)) {
    return undefined;
  }

  if (hasOwn(row, fieldName)) {
    return row[fieldName];
  }

  const col = Array.isArray(columns)
    ? columns.find((item) => {
        const { pageKeys, realKeys } = getColumnKeys(item);
        return realKeys.includes(fieldName) || pageKeys.includes(fieldName);
      })
    : null;

  if (!col) {
    return undefined;
  }

  const { pageKeys, realKeys } = getColumnKeys(col);
  const key = [...pageKeys, ...realKeys].find((item) => hasOwn(row, item));
  return key ? row[key] : undefined;
}

export function buildRowDataContext(row = {}, columns = []) {
  const data = { ...(row || {}) };

  if (Array.isArray(columns)) {
    columns.forEach((col) => {
      const { pageKeys, realKeys } = getColumnKeys(col);
      const valueKey = [...pageKeys, ...realKeys].find((key) => hasOwn(row, key));
      if (!valueKey) {
        return;
      }
      const value = row[valueKey];
      [...pageKeys, ...realKeys].forEach((key) => {
        if (!hasOwn(data, key)) {
          data[key] = value;
        }
      });
    });
  }

  return data;
}
