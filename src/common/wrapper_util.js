import isBoolean from "lodash/isBoolean"
import lodashExtend from "lodash/extend"
import isFunction from "lodash/isFunction"

export class ActionWrapper4Button {
  // 按钮模型构造函数
  constructor(e){
    this.visible = true;
    this.disable = false;
    this.handlerFunc = null;
    this._moreConfig = {
      "type": "text", 
      "style":"", 
      "size":"", 
      "icon":"",
      "button_para" : false
    }
    
  }

  setVisible(value) {
    this.visible = value;
  }

  evalVisible(rowData) {
    return this.evalVersatileFlagVar(this.visible, rowData);
  }

  setDisable(value) {
    this.disable = value;
  }

  evalDisable(rowData) {
    return this.evalVersatileFlagVar(this.disable, rowData);
  }

  setLabel(value){
    this.button_name = value;
  }

  setSeq(value){
    this.seq = value;
  }



  evalVersatileFlagVar(flagVar, rowData) {
    if (isBoolean(flagVar)) {
      return flagVar;
    } else if (isFunction(flagVar)) {
      return flagVar(rowData);
    } else {
      return !!flagVar;
    }
  }


}
export function getButtonPara(buttons) {
  // 创建按钮分组
  let arr = []
  let noGroupBtns = []
  buttons.forEach((btn)=>{
    if(btn.hasOwnProperty("_moreConfig") && 
    btn._moreConfig.hasOwnProperty("button_para") && 
    btn._moreConfig.button_para && btn._moreConfig.button_para.group_tag){
      arr.push(btn._moreConfig.button_para.group_tag)
    }else{
      noGroupBtns.push(btn)
    }
  })
  // console.log("需要分组的按钮",arr)
  let resbuttons = noGroupBtns
  arr = Array.from(new Set(arr))
  let btnGroup = {
    "button_type":"_btn_group",
    "button_icon":"el-icon-s-operation",
    "button_name":"",
    "buttons":[],
  }
  if(arr.length > 0){
    for(let key in arr){
      btnGroup = {
        "button_type":"_btn_group",
        "button_name":"",
        "type": "primary", 
        "style":"plain", 
        "size":"mini", 
        "icon":"",
        "buttons":[]
      }
      for(let nKey in buttons){
        // buttons[nKey].permission = true  // 开发测试所有按钮都重载 赋予 权限
        if( buttons[nKey].permission && buttons[nKey].hasOwnProperty("_moreConfig") && 
        buttons[nKey]._moreConfig.hasOwnProperty("button_para") && 
        buttons[nKey]._moreConfig.button_para && buttons[nKey]._moreConfig.button_para.group_tag &&
        buttons[nKey]._moreConfig.button_para.group_tag === arr[key]
        ){
          btnGroup.permission = true
          btnGroup.button_name = arr[key]
          btnGroup.buttons.push(buttons[nKey])
        }else{
         
          
        }
      }
      resbuttons.push(btnGroup)
    }
  }
  

  return resbuttons
}

export function wrapButton(button,type) {
  let self = this
  let extend = lodashExtend(new ActionWrapper4Button(), button);  // 按钮工厂函数
  /**
   * 处理自定义按钮 风格
   */

  let buttonStyle = {
    "grid":{
      "type": "primary", 
      "style":"", 
      "size":"small", 
      "icon":""
    },
    "row":{
      "type": "primary", 
      "style":"plain", 
      "size":"mini", 
      "icon":""
    },
    "form":{
      "type": "primary", 
      "style":"", 
      "size":"mini", 
      "icon":""
    }
  }
  if(type){
    if(type === "grid"){
      extend._moreConfig = buttonStyle.grid
    }else if(type === "form"){
      extend._moreConfig = buttonStyle.form
    }else if(type === "row"){
      // console.log("extend----row",extend,extend.more_config)
      extend._moreConfig = buttonStyle.row
    }
  }else{
    extend._moreConfig = buttonStyle.grid
  }
  
  if(extend && extend.more_config !== null && extend.more_config !== undefined && extend.more_config !== "" ){
    // console.info("extend----_moreConfig",extend.more_config)
    let reqConfig = JSON.parse(extend.more_config) 
    try {
      extend._moreConfig.type = reqConfig.type ? reqConfig.type : extend._moreConfig.type
      extend._moreConfig.style = reqConfig.style ? reqConfig.style : extend._moreConfig.style
      extend._moreConfig.size = reqConfig.size ? reqConfig.size : extend._moreConfig.size
      extend._moreConfig.icon = reqConfig.icon ? reqConfig.icon : extend._moreConfig.icon
      extend._moreConfig.button_para = reqConfig.button_para ? reqConfig.button_para : false  // 是否需要分组
      // console.log("JSON.parsemoreConfig",extend._moreConfig.button_para)
    } catch (error) {
      // console.log(error)
      return extend
    }

  
    return extend
  }
  
  return extend;
}

export class Wrapper4Header {
  constructor(){
    this.visible = true;
  }

  setVisible(value) {
    this.visible = value;
  }

  evalVisible(rowData) {
    return this.evalVersatileFlagVar(this.visible, rowData);
  }

  setLabel(value){
    this.button_name = value;
  }

  setSeq(value){
    this.seq = value;
  }

  evalVersatileFlagVar(flagVar) {
    if (isBoolean(flagVar)) {
      return flagVar;
    } else if (isFunction(flagVar)) {
      return flagVar();
    } else {
      return !!flagVar;
    }
  }
}


export function wrapHeader(header) {
  let extend = lodashExtend(new Wrapper4Header(), header);
  return extend;
}