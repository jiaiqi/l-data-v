
export function createLinkUrlFunc(optionListV2, thisColName) {
  let func = function (data) {
    let service = optionListV2.serviceName
    let defaultSrvApp = resolveAppFromService(service);
    let srvApp = optionListV2.srv_app || defaultSrvApp
    let url = `/vpages/index.html#/detail/${service}/xxx?srvApp=${srvApp}&operate_params=`;

    let refedCol = optionListV2.refed_col
    let operateParams = {
      serviceName: service,
      condition: [{
        colName: refedCol,
        ruleType: "eq",
        value: data[thisColName]
      }]
    }
    // if(data.hasOwnProperty('id') && data.id !== null && data.id !== undefined){
    //   if(srvApp){
    //       url = `/vpages/index.html#/detail/${service}/${data.id}?srvApp=${srvApp}`;
    //   }else{
    //     url = `/vpages/index.html#/detail/${service}/${data.id}`
    //   }
    //   return url 
    // }else{
    //   console.log(url + JSON.stringify(operateParams))
    //   return url + encodeURIComponent(JSON.stringify(operateParams));
    // }
    return url + encodeURIComponent(JSON.stringify(operateParams));
  }

  return func;
}


export function resolveAppFromService(service) {
  let appList = ["auth", "sso"];
  let ret = appList.find(app => service.includes(app));
  return ret || "";
}
