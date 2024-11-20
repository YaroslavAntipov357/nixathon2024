const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const ICONS = require("./constants");

const NEXT_MOVE_RIGHT = {
  S: "W",
  W: "N",
  N: "E",
  E: "S",
};

const NEXT_MOVE_LEFT = {
  S: "E",
  E: "N",
  N: "W",
  W: "S",
};

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
  if (move === "R") {
    return {
      ...user,
      user: `P${NEXT_MOVE_RIGHT[user.user[-1]]}`,
    };
  }
  if (move === "L") {
    return {
      ...user,
      user: `P${NEXT_MOVE_LEFT[user.user[-1]]}`,
    };
  }
  if (move === "M") {
    switch (user.user) {
      case "PS":
        return { ...user, row: user.row + 1 };
      case "PN":
        return { ...user, row: user.row - 1 };
      case "PE":
        return { ...user, column: user.column + 1 };
      case "PW":
        return { ...user, column: user.column - 1 };
    }
  }
};

const fireImmediately = (field, userObject) => {
  const transposedField = field[0].map((_, colIndex) =>
    array.map((row) => row[colIndex])
  );
  const { row, column, user } = userObject;
  const direction = user[-1];
  let fieldOfView;
  switch (direction) {
    case "E":
      fieldOfView = field[row].slice(column, column + 5);
      break;
    case "W":
      fieldOfView = field[row].slice(column - 5, column);
      break;
    case "N":
      fieldOfView = transposedField.slice(row, row + 5);
      break;
    case "S":
      fieldOfView = transposedField.slice(row - 5, row);
      break;
  }
  return fieldOfView.some((cell) => cell[0] === "E");
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
    { action: "MOVE", value: 1 },
    { action: "RIGHT", value: 0 },
    { action: "LEFT", value: 0 },
    { action: "FIRE", value: 0 },
  ];

  const amountOfRows = 13;
  const amountOfColumns = 13;

  for (
    let row = narrowingLevel;
    row <= amountOfRows - 1 - narrowingLevel;
    row++
  ) {
    for (
      let column = narrowingLevel;
      column <= amountOfColumns - 1 - narrowingLevel;
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
  const nextMove =
    MOVES[
      weights.reduce(
        (weight, weightToSend) =>
          weight.value > weightToSend.value ? weight : weightToSend,
        weights[0]
      ).action
    ];

  const newPosition = changePosition(user, nextMove.move);

  if (newPosition) {
    user.user = newPosition;
  }
  
  return res.send(nextMove);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
