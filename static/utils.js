'use strict';

function getElementPos(elem) {
	const box = elem.getBoundingClientRect();
	const x = box.left + pageXOffset;
	const y = box.top + pageYOffset;
	const pos = {x: x, y: y};
	return pos;
}

function getMousePos(e) {
	e = e || window.event;

	if ( e.pageX === null && e.clientX !== null ) {
		const html = document.documentElement;
		const body = document.body;
		e.pageX = e.clientX + (html && html.scrollLeft || body && body.scrollLeft || 0) - (html.clientLeft || 0);
		e.pageY = e.clientY + (html && html.scrollTop || body && body.scrollTop || 0) - (html.clientTop || 0);
	}
	return {x: e.pageX, y: e.pageY};
}

export { getElementPos,  getMousePos };
