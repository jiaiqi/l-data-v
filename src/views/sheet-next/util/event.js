/**
 * @description 绑定ctrl+z ctrl+y事件
 * @param {*} callBackUndo 撤销/回退事件
 * @param {*} callBackRedo 重做/前进事件
 */
export function bindKeyboardEvent(callBackUndo = null, callBackRedo = null) {
  //记录特殊键被按下
  let ctrlDown = false;
  let shiftDown = false;
  window.addEventListener("keydown", (e) => {
    if (["Control", "Meta"].includes(e.key)) {
      ctrlDown = true;
    }
    if (e.key === "Shift") {
      shiftDown = true;
    }
    if (ctrlDown) {
      if (
        (shiftDown && ["z", "Z"].includes(e.key)) ||
        (!shiftDown && ["Y", "y"].includes(e.key))
      ) {
        // 前进/重做 shift+ctrl+z | ctrl+y
        callBackRedo?.();
      } else if (!shiftDown && ["z", "Z"].includes(e.key)) {
        //后退/撤销 ctrl+z
        callBackUndo?.();
      }
    }
  });
  // 松开按键
  window.addEventListener("keyup", function (e) {
    if (["Control", "Meta"].includes(e.key)) {
      ctrlDown = false;
    }
    if (e.key === "Shift") {
      shiftDown = false;
    }
  });
  // 浏览器脱离焦点，释放
  window.onblur = function () {
    ctrlDown = false;
    shiftDown = false;
  };
}
