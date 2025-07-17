function getElementFullInfo(element) {
  if(!element) {
    return null;
  }
  const rect = element.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    // left: rect.left + window.scrollX,
    // top: rect.top + window.scrollY,
    width: rect.width,
    height: rect.height,
  };
}