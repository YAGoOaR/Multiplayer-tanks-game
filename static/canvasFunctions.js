'use strict';

function drawRotatedImage(context, image, pos, angle, size) {
	context.save();
	context.translate(pos.x, pos.y);
	context.rotate(angle);
	context.drawImage(image, -size.x / 2, -size.y / 2, size.x, size.y);
	context.restore();
}

function clearCanvas(context, canvas){
	context.clearRect(0, 0, canvas.width, canvas.height);
}

export { clearCanvas, drawRotatedImage };
