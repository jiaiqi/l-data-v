import { getImagePath } from "./http";

// 处理后端返回的样式数据
const formatStyleData = (json) => {
  const str = JSON.stringify(json);
  if (!isJSON(str)) return "";

  let obj = {};
  for (let key in json) {
    let _key = key.replace("_", "-");
    obj[_key] = json[key];
    if (_key === "background-image") {
      obj[_key] = `url(${getImagePath(json[key])})`;
    }
  }
  return obj;
};

const isJSON = (str) => {
  if (typeof str == "string") {
    try {
      let obj = JSON.parse(str);
      if (typeof obj == "object" && obj) {
        return true;
      } else {
        return false;
      }
    } catch (e) {
      console.log("error：" + str + "!" + e);
      return false;
    }
  }
  return false;
};

export const renderStr = (str, obj = {}) => {
  if (typeof obj === "object" && str && typeof str === "string") {
    str = str.replace(/\$\{(.*?)\}/g, (match, key) => {
      key = key.trim();
      let result = obj[key];
      let arr = key.split(".");
      if (arr?.length) {
        result = obj;
        arr.forEach((item) => {
          try {
            result =
              result[item] || result[item] === false || result[item] === 0
                ? result[item]
                : "";
            if (result === 0) {
              result = "0";
            }
          } catch (e) {
            //TODO handle the exception
          }
        });
      }
      return result;
    });
  }
  return str;
};
/**
 * @function processStrings
 * @description 该函数处理两个以数字结尾的字符串，并根据特定规则返回一个对象。
 * @param {string} str1 - 第一个输入字符串，应以数字结尾。
 * @param {string} str2 - 第二个输入字符串，也应以数字结尾。
 * @returns {object} 返回的对象包含以下键值对：
 * - `{string} result`: 根据以下规则计算出的新字符串：
 *   1. 如果任一参数不以数字结尾，则结果为 `str2`。
 *   2. 如果两个参数结尾的数字相同，则结果为 `str2`。
 *   3. 如果两个参数结尾数字不同且前面的字符串部分相同，则结果为由 `str2` 前面的字符串拼接 (`num2 - num1 + num2`) 组成的新字符串。
 *   4. 如果两个参数结尾数字不同且前面的字符串部分也不同，则结果为 `str2`。
 * - `{diff} diff`: `num2 - num1` 的差值。
 */
function processStrings(str1, str2) {
  const regex = /\d+$/;
  if (typeof str1 == "number" && typeof str2 == "number") {
    return { result: str2 - str1 + str2, diff: str2 - str1 };
  }
  // 检查两个字符串是否都以数字结尾
  if (!regex.test(str1) || !regex.test(str2)) {
    return { result: str2, diff: null };
  }

  // 获取两个字符串末尾的数字
  const num1 = parseInt(str1.match(regex)[0], 10);
  const num2 = parseInt(str2.match(regex)[0], 10);

  // 计算差值
  const difference = num2 - num1;

  // 如果两个数字相同
  if (num1 === num2) {
    return { result: str2, diff: difference };
  }

  // 获取两个字符串前面的部分
  const prefix1 = str1.replace(regex, "");
  const prefix2 = str2.replace(regex, "");

  // 如果前面的字符串部分相同
  if (prefix1 === prefix2) {
    const result = `${prefix2}${num2 - num1 + num2}`;
    return { result, diff: difference };
  } else {
    return { result: str2, diff: difference };
  }
}

/**
 *
 * @param {string} str 以数字结尾的字符串
 * @param {number} num 要累加的数字
 * @param {number} rate 累加数字的倍率
 * @returns {string} 返回str前缀拼接str结尾数字加上num*rate的字符串
 */
function appendNumber(str, num, rate = 1) {
  if (typeof str === 'number') {
    return str + num * rate;
  }
  // 获取字符串末尾的数字
  const lastNum = parseInt(str.match(/\d+$/)[0], 10);
  // 将数字加上第二个参数
  const resultNum = lastNum + num * rate;
  // 将结果转换为字符串并替换原字符串的末尾数字
  return str.replace(/\d+$/, String(resultNum));
}

export { formatStyleData, processStrings, appendNumber };



// 复制文字到剪贴板
export async function copyTextToClipboard(text) {
  let success = false;
  let msg = ''
  if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      try {
          // 使用现代API
          await navigator.clipboard.writeText(text);
          console.log('文本已成功复制到剪贴板');
          success = true;
      } catch (err) {
          console.error('现代API复制文本失败: ', err);
          msg = `复制文本失败:${err}`
      }
  }

  // 如果现代API不可用或失败，回退到execCommand方式
  if (!success) {
      // 创建临时textarea元素并添加到body中
      const textarea = document.createElement('textarea');
      textarea.style.position = 'fixed';  // 防止滚动条出现
      textarea.style.top = 0;
      textarea.style.left = 0;
      textarea.style.width = '2em';
      textarea.style.height = '2em';
      textarea.style.padding = 0;
      textarea.style.border = 'none';
      textarea.style.outline = 'none';
      textarea.style.boxShadow = 'none';
      textarea.style.background = 'transparent';
      textarea.value = text;
      document.body.appendChild(textarea);

      // 选择文本框中的内容，并尝试复制
      textarea.select();
      try {
          success = document.execCommand('copy');
          console.log(success ? '文本已成功复制到剪贴板' : '复制文本失败');
      } catch (err) {
          console.error('无法复制文本: ', err);
          msg = `复制文本失败:${err}`
      }
      // 移除textarea元素
      document.body.removeChild(textarea);
  }

  return {
    success,
    msg
  };
}
