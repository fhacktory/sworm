let WorldMaxBlockX = 20;
let WorldMaxBlockY = 20;
let MaxNewBlocks = 5;
let TurnDelay = 15000;

let playerName = "bobsaget";

let state = null;

// start spawns the player and send the spawn action,
// then, starts the mainloop waiting for its turn.
function start() {
  GetWorld().then(function(state) {
    // no available world, generate one

    if (!state || !state.world) {
      state = newWorld();
      SendWorld(state);
    }

    setWorld(state);

    setPlayers(state);

    // puts the player somewhere in the world

    let position = findPosition(state);
    if (position.x === -1) {
      console.error("can't spawn the player");
      return;
    }

    // sends the spawn action to firebase

    let action = {
      username: playerName,
      type: "spawn",
      position: position,
    }

    SendAction(playerName, action) // TODO(remy): error handling

    // starts the main loop

    run();
  }).catch(function(error) {
    // TODO(remy): error handling
    console.error("start:", error);
  });
}

function setPlayers(state) {
  for (idx in state.players) {
    let player = state.players[idx];

		var x = player.x * (boxWidth * 2) + boxWidth
		var options = {
			playerId: player.name,
			x: x,
			y: 500
		};

		spawnPlayer(options);
  }
}

function newWorld() {
  console.log("newWorld()");
  let bs = [];
  for (let i = 0; i < WorldMaxBlockX; i++) {
    bs.push({
      x: i,
      y: 0,
      type: "ground",
    });
  }

  return {
    next_turn: new Date().getTime()+15000,
    wind: 0,
    players: [],
    // NOTE(remy): could be new block
    world: bs,
  }
}

// findPosition looks for a free position
// upon a ground (for a player or new
// blocks).
function findPosition(state) {
  for (let x = 0; x < WorldMaxBlockX; x++) {
    for (let y = 0; y < WorldMaxBlockY; y++) {
      let block = getBlock(state, x, y);
      if (block.type === 'sky') {
        // lower bounds
        if (y === 0) {
          return {x: x, y: y};
        }
        // possible, ground under this?
        let under = getBlock(state, x, y-1);
        if (under.type === 'ground') {
          return {x: x, y: y};
        }
      }
    }
  }

  console.error("can't find a free position.");
  return {x: -1, y: -1};
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

function run() {
  let st = null;

  GetWorld().then(function (state) {
    if (!state.next_turn) {
      console.error("run: no next turn");
      return;
    }

    // redraw the world
    updateWorld(state);

    // wait for the end of the turn and execute
    let wait = state.next_turn - new Date().getTime();
    if (wait < 0) {
      wait = 0;
    }
    console.log("will wait", wait);
    setTimeout(function() {
      runActions(state)
    }, wait);

  }).catch(function(error) {
    console.log("run:", error);
  });
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

// runActions of all players after having retrieved
// them from firebase.
function runActions(state) {
  GetActions().then(function(actions) {
    // simulate all players action
    for (idx in actions) {
      let action = actions[idx];
      simulate(state, action);
    }

    // finalize the state
    end(state);
  }).catch(function(error) {
    console.error("runActions:", error);
  });
}

function simulate(state, action) {
  switch (action.type) {
    case "rocket":
      let dx = (action.vector[2] - action.vector[0]) / 100;
      let dy = (action.vector[3] - action.vector[1]) / 100;
      playerShoot(playerName, dx, dy);
      break;
    case "spawn":
      state.players = state.players ? state.players : {};
      state.players[action.username] = {
        x: action.position.x,
        y: action.position.y,
        name: action.username,
      };
      break;
  }
  console.log("simulate:", action);
}

function end(state) {
  // generate some wind

  let sign = 1-Math.random()*2;
  let wind = sign*(Math.random()*100);

  // generate some new blocks

  let blocks_n = Math.random() * MaxNewBlocks; // max amount of blocks
  let new_blocks = [];

  for (let i = 0; i < blocks_n; i++) {
    let pos = findPosition(state);
    if (pos.x === -1) {
      continue;
    }
    new_blocks.push({
      type: "ground",
      x: pos.x,
      y: pos.y,
    });
  }

  // wind and new_blocks contains the information the new world.
  // send them to firebase

  state.next_turn = new Date().getTime()+TurnDelay;
  state.wind = wind;
  state.new_blocks = new_blocks;
  SendWorld(state); // TODO(remy): error handling

  run();
}
