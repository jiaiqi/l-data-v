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


/**
 * 从HTML字符串中提取纯文本内容
 * @param {string} html - HTML字符串
 * @returns {string} 提取的纯文本
 */
export function getTextFromHtml(html) {
  // 参数验证
  if (!html || typeof html !== 'string') {
    return ''
  }

  // 检查是否支持DOMParser
  if (typeof DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')
      
      // 优先使用textContent，降级到innerText
      const text = doc.body.textContent || doc.body.innerText || ''
      return text.trim()
    } catch (error) {
      console.warn('DOMParser解析失败，降级到正则表达式方案:', error)
      // 降级到正则表达式方案
      return getTextFromHtmlByRegex(html)
    }
  }

  // 不支持DOMParser时使用正则表达式方案
  return getTextFromHtmlByRegex(html)
}

/**
 * 使用正则表达式从HTML中提取文本（降级方案）
 * @param {string} html - HTML字符串
 * @returns {string} 提取的纯文本
 */
function getTextFromHtmlByRegex(html) {
  if (!html || typeof html !== 'string') {
    return ''
  }

  return html
    // 移除script和style标签及其内容
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    // 移除HTML注释
    .replace(/<!--[\s\S]*?-->/g, '')
    // 将br标签转换为换行符
    .replace(/<br\s*\/?>/gi, '\n')
    // 将p、div等块级元素转换为换行符
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
    // 移除所有HTML标签
    .replace(/<[^>]*>/g, '')
    // 解码HTML实体
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    // 清理多余的空白字符
    .replace(/\s+/g, ' ')
    .trim()
}