
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
    const body = document.body;
    const offsetX = html && html.scrollLeft || body && body.scrollLeft || 0;
    const offsetY = html && html.scrollTop || body && body.scrollTop || 0;
    e.pageX = e.clientX + offsetX - (html.clientLeft || 0);
    e.pageY = e.clientY + offsetY - (html.clientTop || 0);
  }
  return { x: e.pageX, y: e.pageY };
}

export { getElementPos,  getMousePos };
