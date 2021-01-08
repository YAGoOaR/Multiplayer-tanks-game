
function getElementPos(elem) {
  const box = elem.getBoundingClientRect();
  const x = box.left + pageXOffset;
  const y = box.top + pageYOffset;
  const pos = { x, y };
  return pos;
}

function getMousePos(e) {
  e = e || window.event;

  if (e.pageX === null && e.clientX !== null) {
    const html = document.documentElement;
    e.pageX = e.clientX - html.clientLeft || 0;
    e.pageY = e.clientY - html.clientTop || 0;
  }
  return { x: e.pageX, y: e.pageY };
}

export { getElementPos,  getMousePos };
