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

function SendVector(canvas, start, stop){
	clearCanvas(canvas);
	var new_action = {
		type: action,
		vector: [
			start.x,
			start.y,
			stop.x,
			stop.y,
		]
	}
        SendAction(playerName, new_action);
}

var canvas = document.getElementById('inputCanvas');
var context = canvas.getContext('2d');
var mouseDownPos = null;
var action = "rocket";

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
	SendVector(canvas, mouseDownPos, getMousePos(canvas, evt));
	mouseDownPos = null;
}, false);

canvas.addEventListener('keydown', function (e) {
	if (e.key == "Control"){
		action = "move";
	}
}, false);

canvas.addEventListener('keyup', function (e) {
	if (e.key == "Control"){
		action = "rocket";
	}
}, false);

canvas.setAttribute('tabindex','0');
canvas.focus();



var joinButton = document.getElementById('joinButton');
var playerNameInput = document.getElementById('playerName');
joinButton.addEventListener("click", function(e){
	if(playerNameInput.value == ''){
		return;
	}
	playerName = playerNameInput.value;
	playerNameInput.disabled = true;
	joinButton.disabled = true;
	start();
});
