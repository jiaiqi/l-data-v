import dayjs from "dayjs";

/**
 * 格式化日期为指定类型的字符串
 * @param {Date|string|number} jsDate - 要格式化的日期对象、字符串或时间戳
 * @param {string} type - 日期类型：'date'、'datetime'、'year'、'month'、'time'
 * @param {string} [format] - 可选的格式化字符串，仅对 datetime 类型有效
 * @returns {string} 格式化后的日期字符串
 * @throws {Error} 当传入不支持的类型时抛出错误
 * @example
 * formatDate(new Date(), 'date') // '2023-12-01'
 * formatDate(new Date(), 'datetime', 'yyyy-MM-dd HH:mm') // '2023-12-01 14:30'
 */
export function formatDate(jsDate, type, format) {
  if ("date" === type) {
    return dayjs(jsDate).format("YYYY-MM-DD");
  } else if ("datetime" === type) {
    // 检查是否有自定义格式
    if (format && format == "yyyy-MM-dd HH:mm") {
      return dayjs(jsDate).format("YYYY-MM-DD HH:mm");
    } else {
      // 默认返回完整的日期时间格式
      return dayjs(jsDate).format("YYYY-MM-DD HH:mm:ss");
    }
  } else if ("year" === type) {
    return dayjs(jsDate).format("YYYY");
  } else if ("month" === type) {
    // 月份格式固定为当月第一天
    return dayjs(jsDate).format("YYYY-MM" + "-01");
  } else if ("time" === type) {
    // time 类型直接返回原值
    return jsDate;
  } else {
    throw new Error("unsupport: " + type);
  }
}

/**
 * 将数字金额转换为中文大写金额
 * @param {string|number} money - 要转换的金额
 * @returns {string} 中文大写金额字符串
 * @example
 * money2Zh(123.45) // '壹佰贰拾叁元肆角伍分'
 * money2Zh(1000) // '壹仟元整'
 */
export function money2Zh(money) {
  // 汉字的数字
  let cnNums = new Array(
    "零",
    "壹",
    "贰",
    "叁",
    "肆",
    "伍",
    "陆",
    "柒",
    "捌",
    "玖"
  );
  // 基本单位
  let cnIntRadice = new Array("", "拾", "佰", "仟");
  // 对应整数部分扩展单位
  let cnIntUnits = new Array("", "万", "亿", "兆");
  // 对应小数部分单位
  let cnDecUnits = new Array("角", "分", "毫", "厘");
  // 整数金额时后面跟的字符
  let cnInteger = "整";
  // 整型完以后的单位
  let cnIntLast = "元";
  // 最大处理的数字
  let maxNum = 999999999999999.9999;
  // 金额整数部分
  let integerNum;
  // 金额小数部分
  let decimalNum;
  // 输出的中文金额字符串
  let chineseStr = "";
  // 分离金额后用的数组，预定义
  let parts;

  if (money == "") {
    return "";
  }
  money = parseFloat(money);
  if (money >= maxNum) {
    // 超出最大处理数字
    return "";
  }
  if (money == 0) {
    chineseStr = cnNums[0] + cnIntLast + cnInteger;
    return chineseStr;
  }
  // 转换为字符串进行分割处理
  money = money.toString();
  if (money.indexOf(".") == -1) {
    // 没有小数点，全部为整数部分
    integerNum = money;
    decimalNum = "";
  } else {
    // 有小数点，分离整数和小数部分
    parts = money.split(".");
    integerNum = parts[0];
    decimalNum = parts[1].substr(0, 4); // 最多取4位小数
  }

  // 获取整型部分转换
  if (parseInt(integerNum, 10) > 0) {
    let zeroCount = 0; // 连续零的计数
    let IntLen = integerNum.length;
    for (let i = 0; i < IntLen; i++) {
      let n = integerNum.substr(i, 1); // 当前数字
      let p = IntLen - i - 1; // 当前位置（从右往左数）
      let q = p / 4; // 万、亿、兆的位置
      let m = p % 4; // 在当前单位内的位置
      if (n == "0") {
        zeroCount++;
      } else {
        if (zeroCount > 0) {
          // 前面有零，需要添加"零"
          chineseStr += cnNums[0];
        }
        // 归零
        zeroCount = 0;
        chineseStr += cnNums[parseInt(n)] + cnIntRadice[m];
      }
      if (m == 0 && zeroCount < 4) {
        // 添加万、亿、兆等单位
        chineseStr += cnIntUnits[q];
      }
    }
    chineseStr += cnIntLast; // 添加"元"
  }

  // 小数部分处理
  if (decimalNum != "") {
    let decLen = decimalNum.length;
    for (let i = 0; i < decLen; i++) {
      let n = decimalNum.substr(i, 1);
      if (n != "0") {
        // 非零小数位才添加
        chineseStr += cnNums[Number(n)] + cnDecUnits[i];
      }
    }
  }
  // 最终结果处理
  if (chineseStr == "") {
    chineseStr += cnNums[0] + cnIntLast + cnInteger;
  } else if (decimalNum == "") {
    // 没有小数部分，添加"整"
    chineseStr += cnInteger;
  }
  return chineseStr;
}

/**
 * 格式化金额为千分位显示格式
 * @param {string|number} valueStr - 要格式化的金额字符串或数字
 * @returns {string} 格式化后的金额字符串，如果输入无效则返回 "invalid value"
 * @example
 * formatMoney("1234.56") // "1,234.56"
 * formatMoney("-1000") // "-1,000.00"
 */
export function formatMoney(valueStr) {
  let value = valueStr;
  let isNegative = false;
  // 处理 null 值
  if (value === null || value === "null") {
    valueStr = "";
  }
  // 检查是否为负数
  if (valueStr.indexOf("-") !== -1) {
    valueStr = valueStr.replace("-", "");
    isNegative = true;
  }
  // 验证输入是否为有效数字格式
  if (/[^0-9\.]/.test(valueStr)) return "invalid value";
  // 确保有小数点
  valueStr = valueStr.replace(/^(\d*)$/, "$1.");
  // 确保有两位小数
  valueStr = (valueStr + "00").replace(/(\d*\.\d\d)\d*/, "$1");
  // 临时将小数点替换为逗号
  valueStr = valueStr.replace(".", ",");
  // 添加千分位分隔符
  var re = /(\d)(\d{3},)/;
  while (re.test(valueStr)) {
    valueStr = valueStr.replace(re, "$1,$2");
  }

  // 将小数部分的逗号还原为小数点
  valueStr = valueStr.replace(/,(\d\d)$/, ".$1");
  // 恢复负号
  if (isNegative) {
    valueStr = "-" + valueStr;
  }
  // 处理以小数点开头的情况
  return valueStr.replace(/^\./, "0.");
}

/**
 * 递归遍历对象，对每个属性执行访问器函数
 * @param {Object} obj - 要遍历的对象
 * @param {Function} visitor - 访问器函数，接收 (obj, key) 参数
 * @param {Function} filter - 过滤器函数，接收 (obj, key) 参数，返回 boolean 决定是否继续递归
 * @example
 * traverseObj(data, (obj, key) => console.log(key), (obj, key) => typeof obj[key] === 'object')
 */
export function traverseObj(obj, visitor, filter) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      visitor(obj, key);
      if (filter(obj, key)) {
        traverseObj(obj[key], visitor, filter);
      }
    }
  }
}

/**
 * 获取指定周数偏移的周开始和结束时间
 * @param {number} e - 周数偏移量，0表示当前周，负数表示之前的周，正数表示之后的周
 * @returns {Array<string>} 返回包含开始时间和结束时间的数组，格式为 ["开始时间,结束时间"]
 * @example
 * getWeekStartAndEnd(0) // 当前周
 * getWeekStartAndEnd(-1) // 上一周
 * getWeekStartAndEnd(1) // 下一周
 */
export function getWeekStartAndEnd(e) {
  console.log("增量", e);
  let days = 1000 * 60 * 60 * 24; // 一天的毫秒数
  let times = new Date().getTime(); // 当前时间戳
  let year = new Date().getFullYear();
  let month = new Date().getMonth() + 1;
  let sDays = new Date().getDate() - new Date().getDay();
  let sNum = times - new Date().getDay() * days; // 本周开始时间戳
  let eNum = times + (7 - new Date().getDay()) * days; // 本周结束时间戳
  // let sDate = new Date(
  //   (new Date(sNum + (e *days * 7 ))).getYear() + 1900,
  //   (new Date(sNum + (e *days * 7 ))).getMonth(),
  //   (new Date(sNum + (e *days * 7 ))).getDate()
  // )
  // let eDate = new Date(
  //   (new Date(eNum + (e * days * 7 ))).getYear() + 1900,
  //   (new Date(eNum + (e * days * 7 ))).getMonth(),
  //   (new Date(eNum + (e * days * 7 ))).getDate()
  // )
  // 计算目标周的开始时间
  let sDate =
    new Date(sNum + e * days * 7).getYear() +
    1900 +
    "-" +
    (new Date(sNum + e * days * 7).getMonth() + 1) +
    "-" +
    new Date(sNum + e * days * 7).getDate() +
    " 00:00:00";
  // 计算目标周的结束时间
  let eDate =
    new Date(eNum + e * days * 7).getYear() +
    1900 +
    "-" +
    (new Date(eNum + e * days * 7).getMonth() + 1) +
    "-" +
    new Date(eNum + e * days * 7).getDate() +
    " 00:00:00";
  return [sDate + "," + eDate];
}

/**
 * 获取指定天数偏移的日期开始和结束时间
 * @param {number} e - 天数偏移量，0表示当天，负数表示之前的天，正数表示之后的天
 * @returns {Array<string>} 返回包含开始时间和结束时间的数组，格式为 ["开始时间,结束时间"]
 * @example
 * getDayStartAndEnd(0) // 今天
 * getDayStartAndEnd(-1) // 昨天
 * getDayStartAndEnd(1) // 明天
 */
export function getDayStartAndEnd(e) {
  let days = 1000 * 60 * 60 * 24; // 一天的毫秒数
  let times = new Date().getTime(); // 当前时间戳
  // 今天的开始时间
  let nowDay =
    new Date().getYear() +
    1900 +
    "-" +
    (new Date().getMonth() + 1) +
    "-" +
    new Date().getDate() +
    " 00:00:00";
  // 明天的开始时间
  let nowDate =
    new Date(times + (0 + 1) * days).getYear() +
    1900 +
    "-" +
    (new Date(times + (0 + 1) * days).getMonth() + 1) +
    "-" +
    new Date(times + (0 + 1) * days).getDate() +
    " 00:00:00";

  // 目标日期的开始时间
  let sDate =
    new Date(times + e * days).getYear() +
    1900 +
    "-" +
    (new Date(times + e * days).getMonth() + 1) +
    "-" +
    new Date(times + e * days).getDate() +
    " 00:00:00";
  
  if (e == 0) {
    // 当天：从今天开始到明天开始
    return [sDate + "," + nowDate];
  } else if (e < 0) {
    // 过去的日期：从目标日期到今天开始
    return [sDate + "," + nowDay];
  } else {
    // 未来的日期：从今天开始到目标日期
    return [nowDay + "," + sDate];
  }
}
/**
 * 获取指定月数偏移的月开始和结束时间
 * @param {number} e - 月数偏移量，0表示当前月，负数表示之前的月，正数表示之后的月
 * @returns {Array<string>} 返回包含开始时间和结束时间的数组，格式为 ["开始时间,结束时间"]
 * @example
 * getMonthStartAndEnd(0) // 当前月
 * getMonthStartAndEnd(-1) // 上个月
 * getMonthStartAndEnd(1) // 下个月
 */
export function getMonthStartAndEnd(e) {
  // -1 0 2
  let days = 1000 * 60 * 60 * 24; // 一天的毫秒数（未使用）
  let times = new Date().getTime(); // 当前时间戳（未使用）
  let nowY = new Date().getFullYear(); // 当前年份
  let nowM = new Date().getMonth() + 1; // 当前月份
  let sMonth = nowM; // 开始月份
  let eMonth = nowM + 1; // 结束月份
  let sYear = nowY; // 开始年份
  let eYear = nowY; // 结束年份
  
  if (e < 0) {
    // 处理负偏移（过去的月份）
    if (nowM + e >= 0) {
      // 不跨年的情况
      sMonth = nowM + e == 0 ? 1 : nowM + e;
      eMonth = nowM + 1 > 12 ? 1 : nowM + 1;
    } else {
      // 跨年的情况
      sMonth = 12 + (nowM + e);
      eMonth = nowM + 1 > 12 ? 1 : nowM + 1;
      sYear = nowY--;
    }

    // 处理结束月份跨年
    if (nowM + 1 > 12) {
      eMonth = 1;
      eYear = nowY++;
    } else {
      eMonth = nowM + 1;
      eYear = nowY;
    }
  } else if (e > 0) {
    // 处理正偏移（未来的月份）
    sMonth = nowM;
    eMonth = 12 - nowM >= e ? nowM + e : e - (12 - nowM);
    if (!(12 - nowM) >= e) {
      eYear = nowY++;
    }
  }

  let sMonthTime = sYear + "-" + sMonth + "-" + 1 + " 00:00:00";
  let eMonthTime = eYear + "-" + eMonth + "-" + 1 + " 00:00:00";
  return [sMonthTime + "," + eMonthTime];
}

/**
 * 获取指定年数偏移的年开始和结束时间
 * @param {number} e - 年数偏移量，0表示当前年，负数表示之前的年，正数表示之后的年
 * @returns {Array<string>} 返回包含开始时间和结束时间的数组，格式为 ["开始时间,结束时间"]
 * @example
 * getYearStartAndEnd(0) // 当前年
 * getYearStartAndEnd(-1) // 去年
 * getYearStartAndEnd(1) // 明年
 */
export function getYearStartAndEnd(e) {
  // -1 0 2
  let nowY = new Date().getFullYear(); // 当前年份
  let sYear = nowY; // 开始年份
  let eYear = nowY + 1; // 结束年份
  
  if (e > 0) {
    // 处理正偏移（未来的年份）
    sYear = nowY;
    eYear = nowY + e;
  } else {
    // 处理负偏移或当前年（过去的年份）
    eYear = nowY + 1;
    sYear = nowY + e;
  }
  
  // 注意：这里使用的是当前年份而不是计算出的年份，可能是bug
  let sYearTime = nowY + "-" + 1 + "-" + 1 + " 00:00:00";
  let eYearTime = nowY + "-" + 1 + "-" + 1 + " 00:00:00";
  return [sYearTime + "," + eYearTime];
}

/**
 * 获取当前周的开始日期
 * @returns {Date} 当前周的开始日期（周日）
 * @example
 * weekStart() // 返回本周周日的日期对象
 */
export function weekStart() {
  return new Date(
    new Date().getYear() + 1900,
    new Date().getMonth(),
    new Date().getDate() - new Date().getDay() // 减去当前是周几，得到周日
  );
}

/**
 * 获取当前周的结束日期
 * @returns {Date} 当前周的结束日期（周六）
 * @example
 * weekEnd() // 返回本周周六的日期对象
 */
export function weekEnd() {
  return new Date(
    new Date().getYear() + 1900,
    new Date().getMonth(),
    new Date().getDate() + (6 - new Date().getDay()) // 加上到周六的天数
  );
}

/**
 * 获取当前月的开始日期
 * @returns {Date} 当前月的第一天
 * @example
 * monthStart() // 返回本月1号的日期对象
 */
export function monthStart() {
  let now = new Date();
  return new Date(now.getYear() + 1900, now.getMonth(), 1);
}

/**
 * 获取当前月的结束日期
 * @returns {Date} 当前月的最后一天
 * @example
 * monthEnd() // 返回本月最后一天的日期对象
 */
export function monthEnd() {
  let now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  // 下个月的第0天就是当前月的最后一天
  const lastDay = new Date(year, month + 1, 0);
  return lastDay;
}

/**
 * 解析URL参数为对象
 * @param {string} url - 包含查询参数的URL字符串
 * @returns {Object|undefined} 解析后的参数对象，如果URL无效则返回undefined
 * @example
 * parseUrlParams("http://example.com?name=john&age=25") 
 * // 返回 { name: "john", age: "25" }
 */
export function parseUrlParams(url) {
  if (!url) {
    return;
  }
  if (url && url.indexOf("?") === -1) {
    return;
  }
  let params = {};
  let urlParams = url.split("?")[1].split("&"); // 分割查询参数
  urlParams.forEach((item) => {
    let key = item.split("=")[0]; // 参数名
    let value = item.split("=")[1]; // 参数值
    params[key] = value;
  });
  return params;
}

/**
 * 提取字符串中的日期字符串
 * @param {string} str - 要提取日期的字符串
 * @returns {Array<string>} 匹配到的日期字符串数组，如果没有匹配到则返回空数组
 * @example
 * extractDates("今天是2023-12-01，明天是2023/12/02") 
 * // 返回 ["2023-12-01", "2023/12/02"]
 */
export function extractDates(str) {
  // 匹配 YYYY-MM-DD 或 YYYY/MM/DD 格式的日期
  const datePattern = /(\d{4})(\/|-)?(0[1-9]|1[0-2])\2(0[1-9]|[12]\d|3[01])/g;
  let matches = str.match(datePattern);
  return matches ? matches : [];
}

/**
 * 从字符串中提取并格式化日期或时间戳
 * 支持多种日期格式：YYYYMMDD, YYYY/MM/DD, YYYY-MM-DD, YYYY.M.D, YYYY.M, YY.M.D, YY.M, M.D, YY-M-D, YY-MM-D, YY-M-DD 或者 Unix 时间戳 (10 or 13 digits)
 * @param {string} str - 要提取日期的字符串
 * @returns {string} 格式化后的日期字符串（YYYY-MM-DD格式），如果没有匹配到则返回空字符串
 * @example
 * extractAndFormatDatesOrTimestamps("2023.12.1") // "2023-12-01"
 * extractAndFormatDatesOrTimestamps("1640995200") // "2022-01-01" (时间戳)
 * extractAndFormatDatesOrTimestamps("23.12.1") // "2023-12-01"
 */
export function extractAndFormatDatesOrTimestamps(str) {
  const currentYear = new Date().getFullYear();

  // 匹配 YYYYMMDD, YYYY-MM-DD, YYYY/MM/DD 格式的日期
  const fullYearDatePattern = /(\d{4})(\/|-|\.)(0[1-9]|1[0-2])\2(0[1-9]|[12]\d|3[01])/g;

  // 匹配 YYMMDD, YY-MM-DD, YY/MM/DD 格式的日期
  const shortYearDatePattern = /(\d{2})(\/|-|\.)(0[1-9]|1[0-2])\2(0[1-9]|[12]\d|3[01])/g;

  // 匹配 YYYY.M.D 格式的日期
  const fullYearDotDatePattern = /(\d{4})\.(0?[1-9]|1[0-2])\.(0?[1-9]|[12]\d|3[01])/g;

  // 匹配 YYYY.M 格式的日期
  const fullYearDotMonthPattern = /(\d{4})\.(0?[1-9]|1[0-2])/g;

  // 匹配 YY.M.D 格式的日期
  const shortYearDotDatePattern = /(\d{2})\.(0?[1-9]|1[0-2])\.([12]\d|3[01]|0?[1-9])/g;

  // 匹配 YY.M 格式的日期
  const shortYearDotMonthPattern = /(\d{2})\.(0?[1-9]|1[0-2])/g;

  // 匹配 M.D 或 M.DD 或 MM.DD 格式的日期
  const monthDayPattern = /(0?[1-9]|1[0-2])\.([12]\d|0?[1-9])/g;

  // 匹配 YY-M-D, YY-MM-D, YY-M-DD 格式的日期
  const shortYearDashDatePattern = /(\d{2})-(0?[1-9]|1[0-2])-(0?[1-9]|[12]\d)/g;

  // 匹配 10位或13位的时间戳
  const timestampPattern = /\b\d{10}(?:\d{3})?\b/g;

  let matches;

  // 尝试匹配时间戳格式
  matches = timestampPattern.exec(str);
  if (matches) {
    // 将时间戳转换为 YYYY-MM-DD 格式
    let timestamp = parseInt(matches[0], 10);
    let date;

    // 判断时间戳是以秒还是毫秒为单位
    if (matches[0].length === 10) {
      // 如果是秒级时间戳，乘以1000转换为毫秒
      date = new Date(timestamp * 1000);
    } else if (matches[0].length === 13) {
      // 如果是毫秒级时间戳，直接使用
      date = new Date(timestamp);
    }

    return date.toISOString().split('T')[0];
  }

  // 尝试匹配完整年份的日期格式
  matches = fullYearDatePattern.exec(str);
  if (matches) {
    let yearPart = matches[1];
    let monthPart = matches[3];
    let dayPart = matches[4];

    return `${yearPart}-${monthPart}-${dayPart}`;
  }

  // 尝试匹配两位数年份的日期格式
  matches = shortYearDatePattern.exec(str);
  if (matches) {
    let yearPart = `20${matches[1]}`; // 假设是21世纪的年份，可根据需要调整

    let monthPart = matches[3];
    let dayPart = matches[4];

    return `${yearPart}-${monthPart}-${dayPart}`;
  }

  // 尝试匹配 YYYY.M.D 格式的日期
  matches = fullYearDotDatePattern.exec(str);
  if (matches) {
    let yearPart = matches[1];
    let monthPart = matches[2].padStart(2, '0'); // 补零到两位
    let dayPart = matches[3].padStart(2, '0'); // 补零到两位

    return `${yearPart}-${monthPart}-${dayPart}`;
  }

  // 尝试匹配 YYYY.M 格式的日期
  matches = fullYearDotMonthPattern.exec(str);
  if (matches) {
    let yearPart = matches[1];
    let monthPart = matches[2].padStart(2, '0'); // 补零到两位

    return `${yearPart}-${monthPart}-01`; // 默认为该月第一天
  }

  // 尝试匹配 YY.M.D 格式的日期
  matches = shortYearDotDatePattern.exec(str);
  if (matches) {
    let yearPart = `20${matches[1]}`; // 假设是21世纪的年份，可根据需要调整
    let monthPart = matches[2].padStart(2, '0'); // 补零到两位
    let dayPart = matches[3].padStart(2, '0'); // 补零到两位

    return `${yearPart}-${monthPart}-${dayPart}`;
  }

  // 尝试匹配 YY.M 格式的日期
  matches = shortYearDotMonthPattern.exec(str);
  if (matches) {
    let yearPart = `20${matches[1]}`; // 假设是21世纪的年份，可根据需要调整
    let monthPart = matches[2].padStart(2, '0'); // 补零到两位

    return `${yearPart}-${monthPart}-01`; // 默认为该月第一天
  }

  // 尝试匹配 M.D 或 M.DD 或 MM.DD 格式的日期
  matches = monthDayPattern.exec(str);
  if (matches) {
    let monthPart = matches[1].padStart(2, '0'); // 补零到两位
    let dayPart = matches[2].padStart(2, '0'); // 补零到两位

    return `${currentYear}-${monthPart}-${dayPart}`; // 使用当前年份
  }

  // 尝试匹配 YY-M-D, YY-MM-D, YY-M-DD 格式的日期
  matches = shortYearDashDatePattern.exec(str);
  if (matches) {
    let yearPart = `20${matches[1]}`; // 假设是21世纪的年份，可根据需要调整
    let monthPart = matches[2].padStart(2, '0'); // 补零到两位
    let dayPart = matches[3].padStart(2, '0'); // 补零到两位

    return `${yearPart}-${monthPart}-${dayPart}`;
  }

  // 如果没有匹配到任何内容，返回空字符串或其他默认值
  return '';
}

/**
 * 从字符串中提取数字并连接，保留最多一个小数点
 * @param {string} str - 要提取数字的字符串
 * @returns {string} 连接后的数字字符串，如果没有匹配到数字则返回空字符串
 * @example
 * extractConcatNumbersWithSingleDecimal("价格123.45元，税费6.78元") // "123.456.78"
 * extractConcatNumbersWithSingleDecimal("abc123def456.789xyz") // "123456.789"
 */
export function extractConcatNumbersWithSingleDecimal(str) {
  // 正则表达式用于匹配整数或小数（确保小数点前后都是数字）
  const numberPattern = /\d+(\.\d+)?/g;
  let matches = str.match(numberPattern);
  if (!matches) return '';

  // 用于构建最终结果的变量
  let result = '';
  let decimalPointSeen = false; // 标记是否已经遇到小数点

  matches.forEach(match => {
    // 遍历每个匹配项，处理其中的小数点
    for (let i = 0; i < match.length; i++) {
      if (match[i] === '.' && !decimalPointSeen) {
        // 如果遇到第一个小数点，则保留它
        decimalPointSeen = true;
        result += match[i];
      } else if (match[i] !== '.') {
        // 只添加数字字符，忽略后续的小数点
        result += match[i];
      }
    }
  });

  return result;
}
