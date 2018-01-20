////////////////////////////////////////
// COOKIES
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

// COOKIES
////////////////////////////////////////


var inputCanvas = document.getElementById('inputCanvas');
var context = inputCanvas.getContext('2d');
var mouseDownPos = null;
var action = "rocket";

var joinButton = document.getElementById('joinButton');
var playerNameInput = document.getElementById('playerName');

let playerName = readCookie(COOKIE_NAME);

function clearCanvas(inputCanvas, message) {
	var ctx = inputCanvas.getContext('2d');
	ctx.clearRect(0, 0, inputCanvas.width, inputCanvas.height);
}

function getMousePos(inputCanvas, evt) {
	var rect = inputCanvas.getBoundingClientRect();
	return {
		x: evt.clientX - rect.left,
		y: evt.clientY - rect.top
	};
}

function DrawVector(inputCanvas, start, stop){
	var ctx = inputCanvas.getContext("2d");
	ctx.clearRect(0, 0, 600, 600);
	ctx.beginPath();
	// offset perpendiculaire
	var dx = start.x - stop.x;
	var dy = start.y - stop.y;
	var dist = Math.sqrt(dx*dx + dy*dy);
	var dx = dx / dist;
	var dy = dy / dist;
	var N = dist / 10;
	var x3 = stop.x + (N/2)*dy;
	var y3 = stop.y - (N/2)*dx;
	var x4 = stop.x - (N/2)*dy;
	var y4 = stop.y + (N/2)*dx;
	ctx.moveTo(start.x, start.y);
	ctx.lineTo(x3, y3);
	ctx.lineTo(x4, y4);
	ctx.closePath();
	var gradient = ctx.createLinearGradient(start.x, start.y, 150, 100);
	if (action == "rocket"){
		gradient.addColorStop(0, "#FFFF00");
		gradient.addColorStop(0.5, "#FF9900");
		gradient.addColorStop(1, "#FF0000");	
	} else {
		gradient.addColorStop(0, "#66FFFF");
		gradient.addColorStop(0.5, "#6666FF");
		gradient.addColorStop(1, "#6600FF");	
	}
	
	ctx.fillStyle = gradient;
	ctx.fill();
	ctx.strokeStyle="#bbb";
	ctx.stroke();
}

function SendVector(inputCanvas, start, stop){
	clearCanvas(inputCanvas);
	if (!playerName){
		return;
	}
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


joinButton.addEventListener("click", function(e){
	if(playerNameInput.value == ''){
		return;
	}

	playerName = playerNameInput.value;
	createCookie(COOKIE_NAME, playerName);
	join();
});

var setUpInteractivityListeners = function(){
		
	inputCanvas.addEventListener('mousedown', function(evt) {
		mouseDownPos = getMousePos(inputCanvas, evt);
	}, false);

	inputCanvas.addEventListener('mousemove', function(evt) {
		if(mouseDownPos == null){
			return;
		}
		DrawVector(inputCanvas, mouseDownPos, getMousePos(inputCanvas, evt));
	}, false);

	inputCanvas.addEventListener('mouseup', function(evt) {
		SendVector(inputCanvas, mouseDownPos, getMousePos(inputCanvas, evt));
		mouseDownPos = null;
	}, false);

	inputCanvas.addEventListener('keydown', function (e) {
		if (e.key == "Control"){
			action = "move";
		}
	}, false);

	inputCanvas.addEventListener('keyup', function (e) {
		if (e.key == "Control"){
			action = "rocket";
		}
	}, false);

	inputCanvas.setAttribute('tabindex','0');
	inputCanvas.focus();

};

var join = function (){
	playerNameInput.value = playerName
	playerNameInput.disabled = true;
	joinButton.disabled = true;
	setUpInteractivityListeners();
	start();
}

if(playerName){
	join();
}

// temp
setUpInteractivityListeners();