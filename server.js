const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");

const port = 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/healthz", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.status(200);
  res.send({ status: "OK" });
});

const gameMemory = {};

const MOVES = {
  MOVE: { move: "M" },
  RIGHT: { move: "R" },
  LEFT: { move: "L" },
  FIRE: { move: "F" },
};

const ACTION_INDEX = {
  move: 0,
  right: 1,
  left: 2,
  fire: 3,
};

const findInitialUser = (field) => {
  if (field[1][6]?.includes("P")) {
    return { row: 1, column: 6, user: field[1][6] };
  } else if (field[6][1]?.includes("P")) {
    return { row: 6, column: 1, user: field[6][1] };
  } else if (field[11][6]?.includes("P")) {
    return { row: 11, column: 6, user: field[11][6] };
  } else if (field[6][11]?.includes("P")) {
    return { row: 6, column: 11, user: field[6][11] };
  }
};

const userAheadScenario = (row, column, position, weights) => {};

const checkSafeAroundScenario = (
  field,
  row,
  column,
  user,
  weights,
  narrowingLevel
) => {
  if (user.row - narrowingLevel <= 0) {
    weights[ACTION_INDEX.move] += 0.1;
  }

  if (field[row][column] === ICONS.asteroid && column === user.column) {
    if (row - user.row === 1) {
      weights[ACTION_INDEX.right].value += 0.1;
      weights[ACTION_INDEX.left].value += 0.1;
    }
  }

  if (field[row][column] === ICONS.asteroid && row === user.row) {
    if (column - user.column === 1) {
      weights[ACTION_INDEX.right].value += 0.1;
      weights[ACTION_INDEX.move].value += 0.1;
    }

    if (column - user.column === -1) {
      weights[ACTION_INDEX.left].value += 0.1;
      weights[ACTION_INDEX.move].value += 0.1;
    }
  }
};

const changePosition = (user, move) => {
  if (move !== "M") return user;
  switch (user.user[-1]) {
    case "S":
      return { ...user, row: user.row + 1 };
    case "N":
      return { ...user, row: user.row - 1 };
    case "E":
      return { ...user, column: user.column + 1 };
    case "W":
      return { ...user, column: user.column - 1 };
  }
};

app.post("/move", (req, res) => {
  const { field, narrowingIn, gameId } = req.body;

  res.setHeader("Content-Type", "application/json");
  res.status(200);

  if (!gameMemory[gameId]) {
    gameMemory[gameId] = {
      user: findInitialUser(field),
      narrowingLevel: 1,
    };
  }

  if (narrowingIn === 1) {
    gameMemory[gameId].narrowingLevel = gameMemory[gameId].narrowingLevel + 1;
  }

  const { narrowingLevel, user } = gameMemory[gameId];

  const weights = [
    { action: "MOVE", value: 0 },
    { action: "RIGHT", value: 0 },
    { action: "LEFT", value: 0 },
    { action: "FIRE", value: 0 },
  ];

  for (
    let row = narrowingLevel;
    row <= field.length - 1 - narrowingLevel;
    row++
  ) {
    for (
      let column = narrowingLevel;
      column <= field[0].length - 1 - narrowingLevel;
      column++
    ) {
      // userAheadScenario(row, column, position, weights);
      // checkSafeAroundScenario(
      //   field,
      //   row,
      //   column,
      //   user,
      //   weights,
      //   narrowingLevel
      // );
    }
  }

  return res.send(
    MOVES[
      weights.reduce(
        (weight, weightToSend) =>
          weight.value > weightToSend.value ? weight : weightToSend,
        weights[0]
      ).action
    ]
  );
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
