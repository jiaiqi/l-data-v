export function generateMapID(id, prefix) {
  let mapId = "";
  if (id) {
    mapId += `${prefix}-${id}`;
  } else {
    mapId += `${prefix}-${new Date().getTime()}`;
  }
  return mapId;
}

export function initMap(id) {
  let mapInstance = null;
  //定义地图中心点坐标
  const center = new TMap.LatLng(34.21544, 108.912218);
  //定义map变量，调用 TMap.Map() 构造函数创建地图
  mapInstance = new TMap.Map(document.getElementById(id), {
    center: center, //设置地图中心点坐标
    zoom: 17.2, //设置地图缩放级别
    pitch: 43.5, //设置俯仰角
    rotation: 45, //设置地图旋转角度
  });
  return mapInstance;
}
