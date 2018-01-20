let WorldMaxBlockX = 15;
let WorldMaxBlockY = 15;
let MaxNewBlocks = 5;
let TurnDelay = 15000;

let playerName = "bobsaget";

let state = null;

// nextActions returns the next action the
// player wants to execute.
function nextAction() {
  return {
    player: playerName,
    type: "rocket",
    vector: [40, 40, 300, 300],
  }
}

// start spawns the player and send the spawn action,
// then, starts the mainloop waiting for its turn.
function start() {
  GetWorld().then(function(state) {
    // no available world, generate one
    console.log("world:", state);

    if (!state) {
      state = newWorld();
      SendWorld(state);
    }

    setWorld(state);

    spawnPlayers();

    // puts the player somewhere in the world

    let position = findPosition(state);
    if (position.x === -1) {
      console.error("can't spawn the player");
      return;
    }

    // sends the spawn action to firebase

    let action = {
      username: "bobsaget",
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

function newWorld() {
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

function setWorld(state) {
  for (let idx in state.world) {
    let b = state.world[idx];

		var x = (b.x * boxWidth * 2) + (boxWidth);
		var y = 60 + (boxWidth) + (b.y * boxWidth * 2);
    console.log(b.x);

		var options = {
			path: 'wall',
			x: x,
			y: y,
			width: boxWidth,
			height: boxWidth,
			options: {
				density: 100,
				friction: 1,
				restitution: 0,
			}
		};

		var box = new Box(options);
		gameObjects.push(box);
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
