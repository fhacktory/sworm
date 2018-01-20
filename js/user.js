function createCookie(name, value, days) {
    var expires;

    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    } else {
        expires = "";
    }
    document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + expires + "; path=/";
}

function readCookie(name) {
    var nameEQ = encodeURIComponent(name) + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ')
            c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0)
            return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
}

function eraseCookie(name) {
    createCookie(name, "", -1);
}

const COOKIE_NAME = "swormPlayerName";

let playerName = readCookie(COOKIE_NAME);

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
    time: new Date().getTime(),
		vector: [
			start.x,
			600 - start.y,
			stop.x,
			600 - stop.y,
		]
	}
        SendAction(playerName, new_action);
}

function DisplayScores(playerList){
	$('#scores').show();
	var data = "";
	for(index in playerList){
		data += "<tr><td>" + playerList[index].username + "</td><td>" + playerList[index].frag + "</td><td>" + playerList[index].death + "</td></tr>";
	}
	$('#scoresBody').html(data);
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
	createCookie(COOKIE_NAME, playerName);
	join();
});

function join(){
	playerNameInput.value = playerName
	playerNameInput.disabled = true;
	joinButton.disabled = true;
	start();
}

if(playerName){
	join();
}
