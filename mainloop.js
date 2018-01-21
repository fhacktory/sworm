let WorldMaxBlockX = 15;
let WorldMaxBlockY = 15;
let MaxNewBlocks = 5;
let TurnDelay = 5000;

let firstCall = true;
let timeout = null;
let actionsQueue = [];
let windForce = 0;

// start spawns the player and send the spawn action,
// then, starts the mainloop waiting for its turn.
function start() {
  GetWorld().then(function(state) {
    let newW = false;

    let rndPlayerPos = findPlayerPosition(state);

    // no available world, generate one
    if (!state || !state.world) {
      state = newWorld(rndPlayerPos);
      SendWorld(state);
      newW = true;
    } else {
      windForce = state.wind;
    }

    // display the world
    setWorld(state);
    // display the players
    setPlayers(state);
    DisplayScores(state.players);

    // sends the spawn action to firebase
    // if we're spawning
    if (!newW && !state.players[playerName]) {
      let action = {
        username: playerName,
        type: "spawn",
        time: firebase.database.ServerValue.TIMESTAMP,
        x: rndPlayerPos.x,
        y: rndPlayerPos.y,
      }

      SendAction(playerName, action)
    }

    if (playerName === "remeh") {
      timeout = setTimeout(function() { send(state) }, TurnDelay);
    }

    SubscribeActions(function(actions) {
      // we need to get the state to have its time
      GetWorld().then(function(s) {
        console.log("fill actionsQueue");
        if (!actions) {
          return;
        }
        actionsQueue = actions;
        let keys = Object.keys(actions);
        for (key in actions) {
          let a = actions[key];
          if (s.time - TurnDelay - 1000 > a.time) {
            delete actionsQueue[key];
          }
        }
      });
    });
    SubscribeNewWorld(function(s) {
      if (!firstCall) {
        interrupt(s);
      } else {
        firstCall = false;
      }
    });
  }).catch(function(error) {
    // TODO(remy): error handling
    console.error("start:", error);
  });
}

function interrupt(state) {
  timeout = clearTimeout(timeout);
  console.log("interrupt");

  windForce = state.wind;

  let newState = simulation(state);
  console.log("after simulation");
  console.log(newState);
  DisplayScores(newState.players);

  if (playerName == "remeh") {
    timeout = setTimeout(function() { send(newState) }, TurnDelay);
  }
}

function setPlayers(state) {
  for (idx in state.players) {
    let player = state.players[idx];

		var x = player.x * (boxWidth) + boxWidth/2;
		var options = {
			playerId: player.name,
			x: x,
			y: 500
		};

		spawnPlayer(options);
  }
}

function newWorld(playerPos) {
  console.log("newWorld()");
  let bs = [];
  for (let i = 0; i < 20; i++) {
    bs.push({
      x: i,
      y: 0,
      type: "ground",
    });
  }

  let players = {};
  players[playerName] = {
    frags: 0,
    deaths: 0,
    name: playerName,
    x: playerPos.x,
    y: playerPos.y,
  }

  return {
    wind: 0,
    players: players,
    world: bs,
  }
}

function findPlayerPosition(state) {
  let rv = -1;

  if (state == null) {
    return {
      x: Math.floor(Math.random()*10),
      y: 600,
    };
  }

  for (let i = 0; i < 100; i++) {
    let value = Math.floor(Math.random()*(WorldMaxBlockX-1));
    let ok = true;

    for (player in state.players) {
      if (player.x >= value && player.x <= (value+1)) {
        ok = false;
        break;
      }
    }

    if (ok) {
      rv = value;
      break;
    }
  }

  return {x: rv, y: 600};
}

// getBlock goes through the blocks of the
// state to return the one at the given position.
function getBlock(state, x, y) {
  for (idx in state.world) {
    let b = state.world[idx];
    if (b.x === x && b.y === y) {
      return b;
    }
  }

  // block not found, identify it as the sky
  return {
    type: "sky",
    x: x,
    y: y,
  }
}

function updateWorld(state) {
  for (let idx in state.world) {
    let b = state.world[idx];
    let block = getBlock(state, b.x, b.y);

	  var x = (b.x * boxWidth) + (boxWidth/2);
	  var y = (28) + (boxWidth/2) + (b.y * boxWidth);

    if (block.type === "sky" && b.type === "ground") {
      // add
      window.addBox(x, y);
    } else if (block.type === "ground" && b.type === "sky") {
      window.removeBox(x, y);
    }
  }
}

function setWorld(state) {
  for (let idx in state.world) {
    let b = state.world[idx];
    var x = (b.x * boxWidth) + (boxWidth/2);
    var y = (28) + (boxWidth/2) + (b.y * boxWidth);
    window.addBox(x, y);
  }
}

// simulation of all players after having retrieved
// them from firebase.
function simulation(state) {
  let newState = state;
  // simulate all players action
  for (idx in actionsQueue) {
    let action = actionsQueue[idx];
    newState = simulate(newState, action);
  }
  actionsQueue = [];
  return newState;
}

function simulate(state, action) {
  switch (action.type) {
    case "rocket":
      let dx = (action.vector[2] - action.vector[0]) / 30;
      let dy = (action.vector[3] - action.vector[1]) / 30;
      playerShoot(action.username, dx, dy);
      break;
    case "move":
      let mdx = (action.vector[2] - action.vector[0]) / 30;
      let mdy = (action.vector[3] - action.vector[1]) / 30;
      playerJump(action.username, mdx, mdy);
      break;
    case "spawn":
      state.players = state.players ? state.players : {};
      state.players[action.username] = {
        x: action.x,
        y: action.y,
        name: action.username,
        frags: 0,
        deaths: 0,
      };
      let options = {
        x: (action.x * boxWidth) + (boxWidth/2),
        y: action.y,
        playerId: action.username,
      }
      spawnPlayer(options);
      break;
  }

  console.log("simulate:", action);

  return state;
}

function send(state) {
  console.log("send");
  // generate some wind

  let sign = 1-Math.random()*2;
  let wind = sign*(Math.random()*100);

  // TODO(remy): generate some new blocks

  // wind contains the information the new world.
  // send them to firebase

  state.wind = wind;
  state.time = firebase.database.ServerValue.TIMESTAMP;

  //PurgeActions();
  SendWorld(state);
}
//TODO
window.playerHit = function(player_qui_a_tire, player_touche){
	console.log("playerHit", player_qui_a_tire, player_touche);
};
window.blockHit = function(x, y){
	console.log("blockHit", x, y);
};
