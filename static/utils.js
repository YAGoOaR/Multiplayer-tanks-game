
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

function setControlListeners(onMovement, onMousemove, onClick) {
  const keys = ['KeyW', 'KeyS', 'KeyA', 'KeyD'];
  const keysDown = [false, false, false, false];
  const events = ['keyup', 'keydown'];

  for (let j = 0; j <= 1; j++) {
    document.addEventListener(events[j], event => {
      for (const i in keys) {
        if (event.code === keys[i]) {
          keysDown[i] = j;
          const movement = {
            x: keysDown[3] - keysDown[2],
            y: keysDown[0] - keysDown[1]
          };
          onMovement(movement);
        }
      }
    });
  }

  document.addEventListener('mousedown', event => {
    if (event.which === 1) {
      onClick();
    }
  });

  document.onmousemove = e => {
    onMousemove(getMousePos(e));
  };
}

export { getElementPos,  getMousePos, setControlListeners };
