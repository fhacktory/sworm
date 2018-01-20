function clearCanvas(canvas, message) {
	var context = canvas.getContext('2d');
	context.clearRect(0, 0, canvas.width, canvas.height);
}

function getMousePos(canvas, evt) {
	var rect = canvas.getBoundingClientRect();
	return {
		x: evt.clientX - rect.left,
		y: evt.clientY - rect.top
	};
}

function DrawVector(canvas, start, stop){
	var context=canvas.getContext("2d");
	context.clearRect(0, 0, 600, 600);
	context.beginPath();
	context.moveTo(start.x, start.y);
	context.lineTo(stop.x, stop.y);
	context.stroke();
}

function SendAction(canvas, start, stop){
	clearCanvas(canvas);
	console.log(action, start, stop); //TODO Do the real action
}

var canvas = document.getElementById('inputCanvas');
var context = canvas.getContext('2d');
var mouseDownPos = null;
var action = "shoot";

canvas.addEventListener('mousedown', function(evt) {
	mouseDownPos = getMousePos(canvas, evt);
}, false);

canvas.addEventListener('mousemove', function(evt) {
	if(mouseDownPos == null){
		return;
	}
	DrawVector(canvas, mouseDownPos, getMousePos(canvas, evt));
}, false);

canvas.addEventListener('mouseup', function(evt) {
	SendAction(canvas, mouseDownPos, getMousePos(canvas, evt));
	mouseDownPos = null;
}, false);

canvas.addEventListener('keydown', function (e) {
	if (e.key == "Control"){
		action = "jump";
	}
}, false);

canvas.addEventListener('keyup', function (e) {
	if (e.key == "Control"){
		action = "shoot";
	}
}, false);

canvas.setAttribute('tabindex','0');
canvas.focus();
