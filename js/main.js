var b2Vec2 = Box2D.Common.Math.b2Vec2
	, b2AABB = Box2D.Collision.b2AABB
	, b2BodyDef = Box2D.Dynamics.b2BodyDef
	, b2Body = Box2D.Dynamics.b2Body
	, b2FixtureDef = Box2D.Dynamics.b2FixtureDef
	, b2Fixture = Box2D.Dynamics.b2Fixture
	, b2World = Box2D.Dynamics.b2World
	, b2MassData = Box2D.Collision.Shapes.b2MassData
	, b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
	, b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
	, b2DebugDraw = Box2D.Dynamics.b2DebugDraw
	, b2MouseJointDef =  Box2D.Dynamics.Joints.b2MouseJointDef
	, b2Shape = Box2D.Collision.Shapes.b2Shape
	, b2RevoluteJointDef = Box2D.Dynamics.Joints.b2RevoluteJointDef
	, b2Joint = Box2D.Dynamics.Joints.b2Joint
	, b2PrismaticJointDef = Box2D.Dynamics.Joints.b2PrismaticJointDef
	, b2ContactListener = Box2D.Dynamics.b2ContactListener
	, b2Settings = Box2D.Common.b2Settings
	, b2Mat22 = Box2D.Common.Math.b2Mat22
	, b2EdgeChainDef = Box2D.Collision.Shapes.b2EdgeChainDef
	, b2EdgeShape = Box2D.Collision.Shapes.b2EdgeShape
	, b2WorldManifold = Box2D.Collision.b2WorldManifold
	;

var world;
var ctx;
var canvas_width;
var canvas_height;
var gameObjects = [];
var clouds = [];
var trails = [];
var explosions = [];
var to_destroy = [];
var boxWidth = 30;
var bloodOverlay = false;
var bloodOverlayTtl = 0;

var images = {};

var prepareImages = function(){
	getCachedImage("rocket");
	getCachedImage("player-jumping");
	getCachedImage("player-dead");
	getCachedImage("blood");
	for (var i = 0; i < 9;i++){
		getCachedImage("trail-" + i);
	}
	for (var i = 0; i < 13;i++){
		getCachedImage("explosion-" + i);
	}
};

var addClouds = function(){
	var numberOfClouds = 10 + Math.round(Math.random() * 5);
	for (var i = 0; i < numberOfClouds;i++){
		var cloudNumber = 1;
		var width = 114;
		var height = 80;
		var rand = Math.random();
		if (rand > 0.6){
			cloudNumber = 2;
			width = 100;
			height = 70;
		}
		if (rand > 0.8){
			cloudNumber = 3;
			width = 55;
			height = 40;
		}
		var options = {
			rand: Math.random(),
			type: "cloud",
			path: "cloud-" + cloudNumber,
			x: (Math.random() * 700) - 100 ,
			y: (300) + Math.random() * 300 ,
			width: (width) ,
			height: (height)
		}
		clouds.push(options);
		
	}
};

Math.degrees = function(radians) {
  return radians * 180 / Math.PI;
};

var get_offset = function(vector) {
	return new b2Vec2(vector.x - 0, Math.abs(vector.y - this.canvas_height));
}

var getCachedImage = function(path){
	var cachedImage = images[path];
	if (!cachedImage){
		cachedImage = new Image();
		cachedImage.src = "images/" + path + ".png";
		images[path] = cachedImage;
	}
	return cachedImage;
};

var playSound = function(sound){
	var audio = new Audio("sounds/" + sound + ".mp3");
	audio.play();
};

var _removeBlood = function (){
	bloodOverlay = false;
	bloodOverlayTtl = 0;
};

var _getPlayersPositions = function(){
	var positions = [];
	for (var i = 0, l = gameObjects.length; i<l; i++){
		var gameObject = gameObjects[i];
		if (gameObject.path != "player"){
			continue;
		}
		var position = gameObject.body.GetPosition();
		
		var x = Math.round(position.x * scale);
		var y = Math.round(position.y * scale);
		var o = {
			playerId: gameObject.playerId,
			x: x,
			y: y
			
		}
		positions.push(o);
	}
	return positions;
};

var performDestroy = function() {
	for (var i = 0, l = to_destroy.length; i<l; i++){
		var o = to_destroy[i];
		console.log("destroying ...", o);
		destroyObjectFromScene(o);
	}
	to_destroy = [];
}
 
//box2d to canvas scale , therefor 1 metre of box2d = 100px of canvas :)
var scale = 100;

var draw_world = function (world, context) {
	//console.log("draw_world");
    //first clear the canvas
    ctx.clearRect( 0 , 0 , canvas_width, canvas_height );
     
    ctx.fillStyle = '#333';
    ctx.fillRect(0,0, canvas_width, canvas_height);
	
	var cachedImage = getCachedImage("background");
	ctx.drawImage(cachedImage, 0 , 0 , canvas_width, canvas_height);
         
    //convert the canvas coordinate directions to cartesian
    ctx.save();
    ctx.translate(0 , canvas_height);
    ctx.scale(1 , -1);
    //world.DrawDebugData();
	if (window.windForce !== undefined){
		for (var i = 0, l = clouds.length; i<l; i++){
			var cloud = clouds[i];
			if (cloud.x > 690){
				cloud.x = (Math.random() * - 20) - 100;
			} else if (cloud.x < -150){
				cloud.x = (Math.random() * 20) + 660;
			}
			var cachedImage = getCachedImage(cloud.path);
			ctx.translate(cloud.x, cloud.y);
			ctx.drawImage(cachedImage , -cloud.width / 2 , -cloud.height / 2, cloud.width, cloud.height);
			ctx.translate(-cloud.x, -cloud.y);
			var randAdd = windForce < 0 ? cloud.rand * -1 : cloud.rand;
			cloud.x += ((windForce) / 100) + (randAdd / 2);
		}
	}
	
	for (var i = 0, l = trails.length; i<l; i++){
		var o = trails[i];
		if (o.ttl > 1000){
			continue;
		}
		var idx = Math.round(o.ttl / 3);
		if (idx < 0 || idx > 9){
			continue;
		}
		var cachedImage = getCachedImage("trail-" + idx);
		ctx.translate(o.x, o.y);
		ctx.drawImage(cachedImage, -16 / 2 , -16 / 2, 16, 16);
		o.ttl++;
		ctx.translate(-o.x, -o.y);
	}
	for (var i = 0, l = explosions.length; i<l; i++){
		var o = explosions[i];
		if (o.ttl > 1500){
			continue;
		}
		var idx = Math.round(o.ttl / 3);
		if (idx < 0 || idx > 13){
			continue;
		}
		var cachedImage = getCachedImage("explosion-" + idx);
		ctx.translate(o.x, o.y);
		//ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
		
		//ctx.fillRect(0, 0, 10, 10);
		var explosionWidth = 80;
		var explosionHeight = 88;
		ctx.drawImage(cachedImage, -explosionWidth / 2 , -explosionHeight / 2 + 20, explosionWidth, explosionHeight);
		o.ttl++;
		ctx.translate(-o.x, -o.y);
	}
	for (var i = 0, l = gameObjects.length; i<l; i++){
		var gameObject = gameObjects[i];
		gameObject.draw();
	}
    ctx.restore();
	
	if (bloodOverlay){
		bloodOverlayTtl++;
		var cachedImage = getCachedImage("blood");
		ctx.globalAlpha = bloodOverlayTtl / 100;
		ctx.drawImage(cachedImage, 0 , 0 , 600, 235);
		ctx.globalAlpha = 1;
	}
};


var Box = function(options){
	this.x = options.x;
	this.y = options.y;
	this.width = options.width;
	this.height = options.height;
	this.type = options.type;
	this.path = options.path;
	this.playerId = options.playerId;
	this.owner = options.owner;
	options.options.user_data = this;
	this.body = createBox(options.x / scale, options.y / scale, options.width / 2 / scale, options.height / 2 / scale, options.options);
};

Box.prototype.draw = function(){
	if(this.body == null) {
		return false;
	}
	//var c = get_offset(this.body.GetPosition());
	if (this.type == "rocket"){
		var velocity = this.body.GetLinearVelocity();
		var rotation = Math.atan2(-velocity.x, velocity.y);
		this.body.SetAngle(rotation);
	}
	var c = this.body.GetPosition();
	var sx = c.x * scale;
	var sy = c.y * scale;
	var width = this.width;// / scale;
	var height = this.height; // / scale;
	ctx.translate(sx, sy);
	var cachedImage = getCachedImage(this.path);
	var bodyAngle = this.body.GetAngle();
	ctx.rotate(bodyAngle);
	ctx.drawImage(cachedImage , -width / 2 , -height / 2, width, height);
	if (this.type == "rocket"){
		// trail
		if (Math.round(sx) % 3 == 0){
			trails.push({
				ttl: 0,
				x: sx,
				y: sy
			});
		}
	}
	ctx.rotate(-bodyAngle);
	
	if (this.type == "player"){
		var textSize = this.playerId.length * 5;
		var textTranslateX = -textSize;
		var textTranslateY = height + 12;
		ctx.translate(textTranslateX, textTranslateY);
		//ctx.rotate(Math.PI / 2);
		ctx.scale(1, -1);
		var textPositionX = sx - (width / 2) - 10;
		var textPositionY = sy - (height / 2) - 10;
		ctx.font = '14pt sans-serif';
		ctx.textBaseline = "top";
		ctx.lineJoin = "round";
		ctx.strokeStyle = "#111";
		ctx.lineWidth = 5;

		ctx.strokeText(this.playerId, 10, 10);                 // stroke
		ctx.globalCompositeOperation = "destination-out";  // will delete what's under
		ctx.fillText(this.playerId, 10, 10);                   //   on next draw
		ctx.globalCompositeOperation = "source-over";      // normal comp. mode
		ctx.fillStyle = "#3366FF";                 // draw in target fill/color
		ctx.fillText(this.playerId, 10, 10);
		//ctx.rotate(-Math.PI / 2);
		ctx.scale(1, -1);
		ctx.translate(-textTranslateX, -textTranslateY);
	}
	ctx.translate(-sx, -sy);

};

Box.prototype.addVelocity = function(vel) {
	var b = this.body;
	var v = b.GetLinearVelocity();
	v.Add(vel);
	//set the new velocity
	b.SetLinearVelocity(v);
};



var spawnPlayer = function(options){
	console.log("spawning player ...", options);
	options.path = "player";
	options.type = "player";
	options.width = 31;
	options.height = 38;
	options.playerId = options.playerId;
	options.options = {
		density: 1
	};
	var box = new Box(options);
	box.body.SetFixedRotation(true);
	box.body.SetSleepingAllowed(false);
	gameObjects.push(box);
};

var destroyObjectFromScene = function(o){
	if(o.body == null) {
		return;
	}
	for (var i = 0, l = gameObjects.length; i<l; i++){
		var gameObject = gameObjects[i];
		if (o === gameObject){
			//alert(1);
			gameObjects.splice(i, 1);
			break;
		}
	}
	o.body.GetWorld().DestroyBody( o.body );
	o.body = null;
};

var destroyObject = function(o){
	to_destroy.push(o);
};

var onPlayerDeath = function(player){
	playSound("Explosion1");
	player.path = "player-dead";
	var position = player.body.GetPosition();
	var x = Math.round(position.x * scale);
	var y = Math.round(position.y * scale);
	explosions.push({
		ttl: 0,
		x: x,
		y: y
	});
	var isMyself = player.playerId == window.playerName;
	if (isMyself){
		bloodOverlay = true;
		bloodOverlayTtl = 0;
	}
	setTimeout(function(){
		destroyObject(player);
	}, 2 * 1000);
};

var setupCollisionHandler = function(){
	
	b2ContactListener.prototype.BeginContact = function (contact) {
		var a = contact.GetFixtureA().GetUserData();
		var b = contact.GetFixtureB().GetUserData();
		
		// rocket tombe sur un mur
		if (a.type == "rocket" && a.active != false && b.type == "wall"){
			a.active = false;
			playSound("Explosion1");
			destroyObject(a);
			destroyObject(b);
			window.blockHit(b.x, b.y);
		}
		if (b.type == "rocket" && b.active != false && a.type == "wall"){
			b.active = false;
			playSound("Explosion1");
			destroyObject(b);
			destroyObject(a);
			window.blockHit(a.x, a.y);
		}
		// rocket tombe sur un joueur
		if (a.type == "rocket" && a.active != false && b.type == "player"){
			if (a.owner != b.playerId){
				a.active = false;
				destroyObject(a);
				onPlayerDeath(b);
				window.playerHit(a.owner, b.playerId);
			}
		}
		if (b.type == "rocket" && b.active != false && a.type == "player"){
			if (b.owner != a.playerId){
				b.active = false;
				destroyObject(b);
				onPlayerDeath(a);
				window.playerHit(b.owner, a.playerId);
			}
		}
		// rocket tombe sur le sol
		if (a.type == "rocket" && a.active != false && (b.type == "ground" || b.type == "ground-area")){
			a.active = false;
			destroyObject(a);
		}
		if (b.type == "rocket" && b.active != false && (a.type == "ground" || a.type == "ground-area")){
			b.active = false;
			destroyObject(b);
		}
		// joueur sort de l'arene
		if (a.type == "ground-area" && b.type == "player"){
			window.playerHit(b.playerId, b.playerId);
			destroyObject(b);
			
		}
		if (b.type == "ground-area" && a.type == "player"){
			window.playerHit(a.playerId, a.playerId);
			destroyObject(a);
		}
		// joueur retomber sur le sol ou sur un wall
		if (a.type == "player" && (b.type == "ground" || b.type == "wall")){
			a.path = "player";
		}
		if (b.type == "player" && (a.type == "ground" || a.type == "wall")){
			b.path = "player";
		}
	}
};


 
//Create box2d world object
function createWorld() {
    //Gravity vector x, y - 10 m/s2 - thats earth!!
    var gravity = new b2Vec2(0, -10);
     
    world = new b2World(gravity , true );
         
    //setup debug draw
    var debugDraw = new b2DebugDraw();
    debugDraw.SetSprite(document.getElementById("canvas").getContext("2d"));
    debugDraw.SetDrawScale(scale);
    debugDraw.SetFillAlpha(0.5);
    debugDraw.SetLineThickness(1.0);
    debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
     
    world.SetDebugDraw(debugDraw);
    
	// ground
	var options = {
		type: "ground",
		path: "ground",
		x: 0 ,
		y: 10 ,
		width: (600 * 2) ,
		height: 19 * 2 ,
		options: {type : b2Body.b2_staticBody}
	}
	var box = new Box(options);
	gameObjects.push(box);
	
	var options = {
		type: "ground-area",
		path: "ground",
		x: -10 ,
		y: 200 ,
		width: 20 ,
		height: 1000 ,
		options: {type : b2Body.b2_staticBody}
	}
	var box = new Box(options);
	gameObjects.push(box);
	
	var options = {
		type: "ground-area",
		path: "ground",
		x: 610 ,
		y: 200 ,
		width: 20 ,
		height: 1000 ,
		options: {type : b2Body.b2_staticBody}
	}
	var box = new Box(options);
	gameObjects.push(box);
	
	setupCollisionHandler();
     
    return world;
}       
 

var findMultipleBox = function(x){
	x = Math.round(x);
	var intPart = x % (boxWidth * 2);
	x = x - intPart;
	x += (boxWidth);
	return x;
};

var spawnPlayers = function(){
	var initialPositions = [4, 7, 9];
	for (var i = 0, l = initialPositions.length; i < l ; i++){
		var initialPosition = initialPositions[i];
		//var x = Math.random() * (canvas_width);
		//x = findMultipleBox(p.x * scale);
		var x = initialPosition * (boxWidth * 2);
		x += (boxWidth);
		var options = {
			playerId: "player" + i,
			x: x,
			y: 500
		};
		spawnPlayer(options);
	}
};

var createBoxes = function () {
	var boxHeight = boxWidth;
	var initialPositions = [0, 1, 1, 2, 5, 5, 6, 7, 7, 7, 7, 8, 9, 10, 12, 14];
	var initialNumberOfBoxToSpawn = 20;
	var yOffsetByIndex = {};
	for (var i = 0, l = initialPositions.length; i < l ; i++){
		var initialPosition = initialPositions[i];
		//var x = Math.random() * (canvas_width);
		//x = findMultipleBox(x);
		var x = initialPosition * (boxWidth * 2);
		x += (boxWidth);
		var yOffset = yOffsetByIndex[x] || 0;
		yOffset += (boxHeight * 2) + 10;
		yOffsetByIndex[x] = yOffset;
		var y =  60 + yOffset;
		
		//console.log(x, y);
		var options = {
			type: "wall",
			path: "wall",
			x: x,
			y: y,
			width: (boxWidth - 1),
			height: (boxHeight - 1), 
			options: {
				density: 1,
				friction: 1,
				restitution: 0
			}
		};
		var box = new Box(options);
		gameObjects.push(box);
	}
}

var _removeBox = function(x, y){
	for (var i = 0, l = gameObjects.length; i<l; i++){
		var gameObject = gameObjects[i];
		if (gameObject.type != "wall"){
			continue;
		}
		var position = gameObject.body.GetPosition();
		
		var wallX = Math.round(position.x * scale);
		var wallY = Math.round(position.y * scale);
		
		if (wallX == x && wallY == y){
			destroyObject(gameObject);
			return;
		}
	}
	console.log("_removeBox::Impossible de supprimer la box", x, y);
};

var _addBox = function(x, y){
	var options = {
		type: "wall",
		path: "wall",
		x: x,
		y: y,
		width: boxWidth,
		height: boxWidth,
		options: {
			type : b2Body.b2_staticBody,
			density: 100,
			friction: 1,
			restitution: 0,
		}
	};

	var box = new Box(options);
	gameObjects.push(box);
};
 
//Create standard boxes of given height , width at x,y
var createBox = function (x, y, width, height, options) {
     //default setting
    options = $.extend(true, {
        'density' : 0.1,
        'friction' : 1.0 ,
        'restitution' : 0 ,
         
        'linearDamping' : 0.0 ,
        'angularDamping' : 0.0 ,
         
        'type' : b2Body.b2_dynamicBody
    }, options);
       
    var body_def = new b2BodyDef();
    var fix_def = new b2FixtureDef();
     
    fix_def.density = options.density;
    fix_def.friction = options.friction;
    fix_def.restitution = options.restitution;
     
    fix_def.shape = new b2PolygonShape();
         
    fix_def.shape.SetAsBox( width , height );
	
	
		
	
     
    body_def.position.Set(x , y);
     
    body_def.linearDamping = options.linearDamping;
    body_def.angularDamping = options.angularDamping;

    body_def.type = options.type;
	
    body_def.userData = fix_def.userData = options.user_data;
     
    var b = world.CreateBody( body_def );
    var f = b.CreateFixture(fix_def);
     
    return b;
}
 

var step = function () {
    var fps = 60;
    var timeStep = 1.0/fps;
     
    //move the world ahead , step ahead man!!
    world.Step(timeStep , 8 , 3);
    world.ClearForces();
			
	//garbage collect dead things
	performDestroy();
     
    draw_world(world, ctx);
};
 
/*
    Convert coordinates in canvas to box2d world
*/
var get_real = function (p){
    return new b2Vec2(p.x + 0, 6 - p.y);
};

var _playerJump = function(playerName, vx, vy){
	var player = _.findWhere(gameObjects, {playerId: playerName});
	if (!player){
		console.error("_playerJump::Impossible de trouver le joueur '" + playerName + "'");
		return;
	}
	if (vx < 0){
		vx = Math.max(vx, -1.5);
	} else {
		vx = Math.min(vx, 1.5);
	}
	if (vy < 0){
		vy = Math.max(vy, 5);
	} else {
		vy = Math.min(vy, 5);
	}
	var vector = new b2Vec2(vx, vy);
	player.path = "player-jumping";
	playSound("WORMPOP");
	player.addVelocity(vector);
};

var _playerShoot = function(playerName, vx, vy){
	var player = _.findWhere(gameObjects, {playerId: playerName});
	if (!player){
		console.error("_playerShoot::Impossible de trouver le joueur '" + playerName + "'");
		return;
	}
	var playerPosition = player.body.GetPosition();
	var playerPositionX = (playerPosition.x * scale) + (player.width / 2);
	var playerPositionY = (playerPosition.y * scale) + (player.height);
	var options = {
		owner: player.playerId,
		type: 'rocket',
		path: 'rocket',
		x: playerPositionX,
		y: playerPositionY,
		width: 12 ,
		height: 22, 
		options: {
			density: 1,
			friction: 1,
			restitution: 0
		}
	}
	
	var rocket = new Box(options);
	gameObjects.push(rocket);
	// ajout du vent
	vx += (windForce / 40);
	var vector = new b2Vec2(vx, vy);
	playSound("ROCKETRELEASE");
	rocket.addVelocity(vector);
};
 
// main entry point
var init = function(){
	
    var canvas = $('#canvas');
    ctx = canvas.get(0).getContext('2d');
     
    //first create the world
    world = createWorld();
	
	// pre-load images
	prepareImages();
	
	// 
    addClouds();
	 
    //get internal dimensions of the canvas
    canvas_width = parseInt(canvas.attr('width'));
    canvas_height = parseInt(canvas.attr('height'));
     
     window.setInterval(step, 1000 / 60);
};
init();

// temp
if (window.location.href.indexOf("debug") != -1){
	createBoxes();
	spawnPlayers();
	window.windForce = 30;
}

// points d'entrée
window.playerShoot = _playerShoot;
window.playerJump = _playerJump;
window.addBox = _addBox;
window.removeBox = _removeBox;
window.getPlayersPosition = _getPlayersPositions;
window.removeBlood = _removeBlood;