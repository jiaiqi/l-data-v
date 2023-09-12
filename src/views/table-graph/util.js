import { Graph, Cell, Shape } from "@antv/x6";
import { GridLayout } from "@antv/layout";
import { Snapline } from "@antv/x6-plugin-snapline";
var graph = {};

const LINE_HEIGHT = 54;
const NODE_WIDTH = 200;

export const initGraph = (container, erData) => {
  Graph.registerPortLayout(
    "erPortPosition",
    (portsPositionArgs) => {
      return portsPositionArgs.map((_, index) => {
        return {
          position: {
            x: 0,
            y: (index + 1) * LINE_HEIGHT - 20,
          },
          angle: 0,
        };
      });
    },
    true
  );

  Graph.registerNode(
    "er-rect",
    {
      inherit: "rect",
      height: 30,
      markup: [
        {
          tagName: "rect", // 标签名
          selector: "body", // 选择器
        },
        {
          tagName: "text",
          selector: "label",
        },
        {
          tagName: "text",
          selector: "subText",
        },
      ],
      attrs: {
        body: {
          strokeWidth: 1,
          stroke: "#5F95FF",
          fill: "#5F95FF",
        },
        label: {
          fontWeight: "bold",
          fill: "#ffffff",
          fontSize: 12,
          refX: 100,
          refY: 10,
        },
        subText: {
          fill: "#ffffff",
          fontWeight: "bold",
          fontSize: 10,
          ref: "body",
          refX: 100,
          refY: 22,
        },
      },
      ports: {
        groups: {
          list: {
            markup: [
              {
                tagName: "rect",
                selector: "portBody",
              },
              {
                tagName: "text",
                selector: "portNameLabel",
              },
              {
                tagName: "text",
                selector: "portTypeLabel",
              },
              {
                tagName: "text",
                selector: "portNameColumn",
              },
            ],
            attrs: {
              portBody: {
                width: NODE_WIDTH,
                height: LINE_HEIGHT,
                strokeWidth: 1,
                stroke: "#5F95FF",
                fill: "#EFF4FF",
                magnet: true,
              },
              portNameColumn: {
                ref: "portBody",
                refX: 6,
                refY: 6,
                fontSize: 10,
              },
              portNameLabel: {
                ref: "portBody",
                refX: 6,
                refY: 22,
                fontSize: 10,
              },
              portTypeLabel: {
                ref: "portBody",
                refX: 6,
                refY: 38,
                fontSize: 10,
              },
            },
            position: "erPortPosition",
          },
        },
      },
    },
    true
  );

  graph = new Graph({
    container: container,
    // width:800,
    // height:1080,
    mousewheel: true, // 缩放
    panning: true, // 平移
    autoResize: true,
    background: {
      color: "#F2F7FA",
    },
    grid: {
      visible: true,
      type: "doubleMesh",
      args: [
        {
          color: "#eee", // 主网格线颜色
          thickness: 1, // 主网格线宽度
        },
        {
          color: "#ddd", // 次网格线颜色
          thickness: 1, // 次网格线宽度
          factor: 4, // 主次网格线间隔
        },
      ],
    },
    connecting: {
      allowBlank() {
        // 是否允许连接到画布空白位置的点，默认为 true，也支持通过函数的方式来动态调整。
        return false;
      },
      highlight: true,
      router: {
        name: "er",
        args: {
          offset: 25,
          direction: "H",
        },
      },
      createEdge() {
        return new Shape.Edge({
          attrs: {
            line: {
              stroke: "#5f95ff",
              strokeWidth: 1,
            },
          },
        });
      },
    },
  });

  //   const cells = [];
  //   erData.forEach((item) => {
  //     if (item.shape === "edge") {
  //       cells.push(graph.createEdge(item));
  //     } else {
  //       cells.push(graph.createNode(item));
  //     }
  //   });
  //   graph.resetCells(cells);
  graph.zoomToFit({ padding: 10, maxScale: 1 });
  graph.use(
    new Snapline({
      enabled: true,
    })
  );
  //   console.log(graph);
  const gridLayout = new GridLayout({
    type: "grid",
    width: 1920,
    height: 1080,
    center: [300, 200],
    preventOverlap: true,
    preventOverlapPadding: 20,
  });

  const newModel = gridLayout.layout({
    nodes: erData,
  });
  graph.fromJSON(newModel);
  // 对齐线
  graph.use(
    new Snapline({
      enabled: true,
    })
  );
  graph.fromJSON({
    edges: newModel,
  });
  // 居中
  graph.centerContent();
  return graph;
};

export const buildErData = (datas = []) => {
  return datas.map((item, index) => {
    return {
      id: `table_${item.table_name}`,
      shape: "er-rect",
      label: item.table_label,
      width: NODE_WIDTH,
      height: LINE_HEIGHT - 20,
      // subText:item.table_name,
      attrs: {
        subText: {
          text: item.table_name,
        },
        // label: item.table_label,
        // portNameLabel:item.table_name
      },
      //   position: {
      //     x: NODE_WIDTH,
      //     y: 100,
      //   },
      ports: item.columns
        ? item.columns.map((col) => {
            return {
              id: `table_col_${col.table_name}-${col.column_name}`,
              group: "list",
              attrs: {
                portNameColumn: {
                  text: `字段名：${col.column_name}`,
                },
                portNameLabel: {
                  text: `字段label：${col.label}`,
                },
                portTypeLabel: {
                  text: `字段类型：${col.col_type}`,
                },
              },
            };
          })
        : [],
    };
  });
};
export const erData = [
  {
    id: "1",
    shape: "er-rect",
    label: "学生",
    width: 150,
    height: 24,
    position: {
      x: 24,
      y: 150,
    },
    ports: [
      {
        id: "1-1",
        group: "list",
        attrs: {
          portNameLabel: {
            text: "ID",
          },
          portTypeLabel: {
            text: "STRING",
          },
        },
      },
      {
        id: "1-2",
        group: "list",
        attrs: {
          portNameLabel: {
            text: "Name",
          },
          portTypeLabel: {
            text: "STRING",
          },
        },
      },
      {
        id: "1-3",
        group: "list",
        attrs: {
          portNameLabel: {
            text: "Class",
          },
          portTypeLabel: {
            text: "NUMBER",
          },
        },
      },
      {
        id: "1-4",
        group: "list",
        attrs: {
          portNameLabel: {
            text: "Gender",
          },
          portTypeLabel: {
            text: "BOOLEAN",
          },
        },
      },
    ],
  },
  {
    id: "2",
    shape: "er-rect",
    label: "课程",
    width: 150,
    height: 24,
    position: {
      x: 250,
      y: 210,
    },
    ports: [
      {
        id: "2-1",
        group: "list",
        attrs: {
          portNameLabel: {
            text: "ID",
          },
          portTypeLabel: {
            text: "STRING",
          },
        },
      },
      {
        id: "2-2",
        group: "list",
        attrs: {
          portNameLabel: {
            text: "Name",
          },
          portTypeLabel: {
            text: "STRING",
          },
        },
      },
      {
        id: "2-3",
        group: "list",
        attrs: {
          portNameLabel: {
            text: "StudentID",
          },
          portTypeLabel: {
            text: "STRING",
          },
        },
      },
      {
        id: "2-4",
        group: "list",
        attrs: {
          portNameLabel: {
            text: "TeacherID",
          },
          portTypeLabel: {
            text: "STRING",
          },
        },
      },
      {
        id: "2-5",
        group: "list",
        attrs: {
          portNameLabel: {
            text: "Description",
          },
          portTypeLabel: {
            text: "STRING",
          },
        },
      },
    ],
  },
  {
    id: "3",
    shape: "er-rect",
    label: "老师",
    width: 150,
    height: 24,
    position: {
      x: 480,
      y: 350,
    },
    ports: [
      {
        id: "3-1",
        group: "list",
        attrs: {
          portNameLabel: {
            text: "ID",
          },
          portTypeLabel: {
            text: "STRING",
          },
        },
      },
      {
        id: "3-2",
        group: "list",
        attrs: {
          portNameLabel: {
            text: "Name",
          },
          portTypeLabel: {
            text: "STRING",
          },
        },
      },
      {
        id: "3-3",
        group: "list",
        attrs: {
          portNameLabel: {
            text: "Age",
          },
          portTypeLabel: {
            text: "NUMBER",
          },
        },
      },
    ],
  },
  {
    id: "4",
    shape: "edge",
    source: {
      cell: "1",
      port: "1-1",
    },
    target: {
      cell: "2",
      port: "2-3",
    },
    attrs: {
      line: {
        stroke: "#A2B1C3",
        strokeWidth: 2,
      },
    },
    zIndex: 0,
  },
  {
    id: "5",
    shape: "edge",
    source: {
      cell: "3",
      port: "3-1",
    },
    target: {
      cell: "2",
      port: "2-4",
    },
    attrs: {
      line: {
        stroke: "#A2B1C3",
        strokeWidth: 2,
      },
    },
    zIndex: 0,
  },
];
