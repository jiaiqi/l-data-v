// export const eventCustomOption = {
//   bodyRowEvents: ({ row, rowIndex }) => {
//     return {
//       dblclick: (event) => {
//         console.log("dblclick::", row, rowIndex, event);
//         return false;
//       },
//       contextmenu: (event) => {
//         console.log("bodyRowEvents::", row, rowIndex, event);
//         event.preventDefault();
//         return false;
//       },
//     };
//   },
// }

// export const cellStyleOption = {
//   // 单元格自定义class
//   bodyCellClass: ({ row, column, rowIndex }) => {
//     // if (row?.__flag === "add") {
//     if (row?.__flag === "add" && column.field === "index") {
//       // 新增行直接显示为绿色背景 不用判断字段有没有值
//       return "table-body-cell__add";
//     }
//     if (
//       row?.__flag === "update" &&
//       !["__flag", "rowKey", "__id", "__unfold"].includes(column.field)
//     ) {
//       if (column.field === "index") {
//         return "table-body-cell__update-index";
//       }
//       // 某行某列绑定的值跟备份的数据中此行此列绑定的值不同时  增加class
//       const oldRowData = this.oldTableData.find(
//         (item) => item.__id && item.__id === row.__id
//       );

//       if (row[column.field] !== oldRowData[column.field]) {
//         if (row[column.field] === null || row[column.field] === "") {
//           return "table-body-cell__update null-value";
//         }
//         return "table-body-cell__update";
//       }
//     }
//   },
// }