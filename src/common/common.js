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
  if (typeof obj === 'object' && str && typeof str === 'string') {
    str = str.replace(/\$\{(.*?)\}/g, (match, key) => {
      key = key.trim()
      let result = obj[key]
      let arr = key.split('.')
      if (arr?.length) {
        result = obj
        arr.forEach(item => {
          try {
            result = (result[item]||result[item]===false||result[item]===0) ? result[item] : '';
            if (result === 0) {
              result = '0'
            }
          } catch (e) {
            //TODO handle the exception
          }
        })
      }
      return result
    })
  }
  return str
}
export { formatStyleData };
