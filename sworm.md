State
--

{
    "players": [ Player, Player, Player ],
    "world": [ Block, Block, Block ],
    "new_blocks": [ Block, Block, Block ],
    "wind": -40,
}

Player
--

{
    username: 'remeh',
    x: 10,
    y: 20,
    frags: 20,
}

Block
--

{
    x: 10,
    y: 10,
    type: 0,
}


Action
--

{
    "player": username,
    "type: "rocket", // none, rocket, move
    "vector": [], // x0, y0, x1, y1
}
