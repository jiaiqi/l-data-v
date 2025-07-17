import { ElMessage } from 'element-ui'
export function evalBxExpr(expr, data, vm, defaultValue) {
  try {
    let user = top.user;
    return eval(expr);
  } catch (e) {
    return defaultValue || null;
  }
}

export function evalActionValidator(funcStr, data, vm) {
  let expr = "var zz=(" + funcStr + ")(vm, data); zz";
  let test = evalBxExpr(expr, data, vm);
  if (test !== true) {
    ElMessage({
      type: 'error',
      message: test
    });
    return false;
  } else {
    return true;
  }
}


export const resolveDefaultSrvApp = function (vm = {}) {
  let app = null;
  // search $srvApp from node to root
  let node = vm;
  while (!node.$srvApp) {
    if (node.$parent) {
      node = node.$parent;
    } else {
      break;
    }
  }

  if (node.$srvApp) {
    app = node.$srvApp;
  } else {
    // whole path does not have $srvApp,
    // try  page level
    if (node?.$route && node?.$route?.query?.srvApp) {
      app = node?.$route?.query?.srvApp;
    } else if (node?.$route && node?.$route?.query?.menuapp) {
      app = node?.$route?.query?.menuapp;
    } else {
      let defaultApp =
        (window.frameElement && window.frameElement.dataset["app"]) ||
        (top.window.pathConfig && top.window.pathConfig.application);
      app = defaultApp;
    }
  }
  return app;
};

export function getDispExps(item, data, params={}) {
  var result = true;
  let mainData = params?.mainData;
  //催办按钮只在 我的申请页面显示
  if (params?.listType != "mine" && item.button_type == "urge") {
    return false;
  }

  try {
    var disp_exps = item.disp_exps;
    if (disp_exps != undefined && disp_exps != "" && disp_exps != null) {
      result = eval(disp_exps);
    }
  } catch (err) { }

  // 使用后端返回的参数控制按钮显示隐藏
  if(typeof item?._btn_index==='number'&&Array.isArray(data?._buttons)){
    if(data._buttons[item._btn_index] === 1){
      result = true
    }
  }

  if (
    item.button_type === "batchupdate" &&
    this.showBatchEditButton !== true
  ) {
    result = false;
  }
  return result;
}