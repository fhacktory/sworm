/**
    Box2d basics, uses debugdraw
    Silver Moon
    m00n.silv3r@gmail.com
*/
 
//Global classnames from Box2d namespace

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
var to_destroy = [];
var boxWidth = 30;

var images = {};

var get_offset = function(vector) {
	return new b2Vec2(vector.x - 0, Math.abs(vector.y - this.canvas_height));
}

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
         
    //convert the canvas coordinate directions to cartesian
    ctx.save();
    ctx.translate(0 , canvas_height);
    ctx.scale(1 , -1);
    //world.DrawDebugData();
	
	for (var i = 0, l = gameObjects.length; i<l; i++){
		var gameObject = gameObjects[i];
		gameObject.draw();
	}
    ctx.restore();
	
};


var Box = function(options){
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
	var c = this.body.GetPosition();
	var sx = c.x * scale;
	var sy = c.y * scale;
	var width = this.width;// / scale;
	var height = this.height; // / scale;
	ctx.translate(sx, sy);
	/*
	console.log("getPosition()", this.body.GetPosition());
	console.log("width", width);
	console.log("height", height);
	console.log("translate", sx, sy)
	*/
	var cachedImage = images[this.path];
	if (!cachedImage){
		cachedImage = new Image();
		cachedImage.src = "images/" + this.path + ".png";
		images[this.path] = cachedImage;
	}
	var bodyAngle = this.body.GetAngle();
	ctx.rotate(bodyAngle);
	ctx.drawImage(cachedImage , -width / 2 , -height / 2, width, height);
	ctx.rotate(-bodyAngle);
	ctx.translate(-sx, -sy);
};

Box.prototype.addVelocity = function(vel)
{
	var b = this.body;
	var v = b.GetLinearVelocity();
	
	v.Add(vel);
	//set the new velocity
	b.SetLinearVelocity(v);
};



var spawnPlayer = function(options){
	options.path = "player-green";
	options.type = "player";
	options.width = 24;
	options.height = 40;
	options.playerId = options.playerId;
	options.options = {
		density: 1
	};
	var box = new Box(options);
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
	//o.dead = true;
};

var destroyObject = function(o){
	to_destroy.push(o);
};

var setupCollisionHandler = function(){
	
	b2ContactListener.prototype.BeginContact = function (contact) {
		//now come action time
		var a = contact.GetFixtureA().GetUserData();
		var b = contact.GetFixtureB().GetUserData();
		
		if (a.type == "rocket" && a.active != false && b.type == "wall"){
			a.active = false;
			destroyObject(a);
			destroyObject(b);
		}
		if (b.type == "rocket" && b.active != false && a.type == "wall"){
			b.active = false;
			destroyObject(b);
			destroyObject(a);
		}
		//console.log(a.active, a.type, b.type);
		if (a.type == "rocket" && a.active != false && b.type == "player"){
			if (a.owner != b.playerId){
				a.active = false;
				destroyObject(a);
				b.path = "player-dead";
			}
		}
		//console.log(b.active, a.type, b.type);
		if (b.type == "rocket" && b.active != false && a.type == "player"){
			if (b.owner != a.playerId){
				b.active = false;
				destroyObject(b);
				a.path = "player-dead";
			}
		}
		if (a.type == "rocket" && a.active != false && b.type == "ground"){
			a.active = false;
			destroyObject(a);
		}
		if (b.type == "rocket" && b.active != false && a.type == "ground"){
			b.active = false;
			destroyObject(b);
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

var _playerShoot = function(playerName, vx, vy){
	
	var player = _.findWhere(gameObjects, {playerId: playerName});
	if (!player){
		console.error("Impossible de trouver le joueur '" + playerName + "'");
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
	var vector = new b2Vec2(vx, vy);
	rocket.addVelocity(vector);
};
 
// main entry point
var init = function(){
	
    var canvas = $('#canvas');
    ctx = canvas.get(0).getContext('2d');
     
    //first create the world
    world = createWorld();
     
    //get internal dimensions of the canvas
    canvas_width = parseInt(canvas.attr('width'));
    canvas_height = parseInt(canvas.attr('height'));
     
    //click event handler on our world
	/*
    canvas.click( function(e) {
        var p = get_real(new b2Vec2(e.clientX / scale, e.clientY / scale));
    });
	*/
     
     window.setInterval(step, 1000 / 60);
};
init();

// points d'entrée
window.playerShoot = _playerShoot;
window.addBox = _addBox;
window.removeBox = _removeBox;

start();

