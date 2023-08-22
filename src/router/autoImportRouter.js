const getPageName = (str) => {
  const pattern = /^\/src\/views\/(\w*|\w*\-\w*)\/index\.vue$/;
  const result = pattern.test(str);
  if (result) {
    return str.split("/")[3];
  }
};
// 驼峰转-
const camelToHyphen = (str) => {
  if (typeof str !== "string") {
    return str;
  }
  const hyphenSplit = str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  return hyphenSplit;
};

function getModules() {
  const components = import.meta.glob("/src/views/**/*.vue");
  return components;
}
function getComponents() {
  const components = import.meta.globEager("/src/views/**/*.vue");
  return components;
}
export const importRouters = function () {
  let routerList = [];
  const modules = getModules();
  const components = getComponents();
  Object.keys(modules).forEach((key) => {
    const viewSrc = components[key];
    const file = viewSrc.default;
    const pattern = /^\/src\/views\/(\w*|\w*\-\w*)\/index\.vue$/;
    if (!pattern.test(key)) return;
    const pageName = file?.name || getPageName(key);
    routerList.push({
      path: `/${camelToHyphen(pageName)}`,
      name: `${pageName}`,
      component: modules[key],
    });
  });
  return routerList;
};
