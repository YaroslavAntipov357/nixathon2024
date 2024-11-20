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
    const user = field[1][6];
    return {
      row: 1,
      column: 6,
      user,
      isNorth: user.includes("N"),
      isSouth: user.includes("S"),
      isWest: user.includes("W"),
      isEast: user.includes("E"),
    };
  } else if (field[6][1]?.includes("P")) {
    const user = field[6][1];
    return {
      row: 6,
      column: 1,
      user,
      isNorth: user.includes("N"),
      isSouth: user.includes("S"),
      isWest: user.includes("W"),
      isEast: user.includes("E"),
    };
  } else if (field[11][6]?.includes("P")) {
    const user = field[11][6];
    return {
      row: 11,
      column: 6,
      user,
      isNorth: user.includes("N"),
      isSouth: user.includes("S"),
      isWest: user.includes("W"),
      isEast: user.includes("E"),
    };
  } else if (field[6][11]?.includes("P")) {
    const user = field[6][11];
    return {
      row: 6,
      column: 11,
      user,
      isNorth: user.includes("N"),
      isSouth: user.includes("S"),
      isWest: user.includes("W"),
      isEast: user.includes("E"),
    };
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
    switch (user?.user) {
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

const fireImmediately = (field, userObject, weights) => {
  const transposedField = field[0].map((_, colIndex) =>
    field.map((row) => row[colIndex])
  );
  const { row, column, user } = userObject;
  let fieldOfView;
  switch (user) {
    case "PE":
      fieldOfView = field[row].slice(column, column + 5);
      break;
    case "PW":
      fieldOfView = field[row].slice(column - 5, column);
      break;
    case "PN":
      fieldOfView = transposedField[column].slice(row - 5, row);
      break;
    case "PS":
      fieldOfView = transposedField[column].slice(row, row + 5);
      break;
  }
  const shouldFire = fieldOfView?.some((cell) => cell[0] === "E");

  if (shouldFire) {
    weights[ACTION_INDEX.fire].value = 100;
  }
};

const checkCellAhead = (field, user, weights) => {
  if (user?.isNorth) {
    const nextCell = field[user.row - 1][user.column];
    if (nextCell === "_") {
      weights[ACTION_INDEX.move].value = weights[ACTION_INDEX.move].value + 1;
    }
    if (nextCell === "A") {
      weights[ACTION_INDEX.left].value = weights[ACTION_INDEX.left].value + 1;
    }
    if (nextCell.indexOf("E") === 0) {
      weights[ACTION_INDEX.fire].value = weights[ACTION_INDEX.fire].value + 1;
    }
  }
  if (user?.isSouth) {
    const nextCell = field[user.row + 1][user.column];
    if (nextCell === "_") {
      weights[ACTION_INDEX.move].value = weights[ACTION_INDEX.move].value + 1;
    }
    if (nextCell === "A") {
      weights[ACTION_INDEX.left].value = weights[ACTION_INDEX.left].value + 1;
    }
    if (nextCell.indexOf("E") === 0) {
      weights[ACTION_INDEX.fire].value = weights[ACTION_INDEX.fire].value + 1;
    }
  }
  if (user?.isEast) {
    const nextCell = field[user.row][user.column + 1];
    if (nextCell === "_") {
      weights[ACTION_INDEX.move].value = weights[ACTION_INDEX.move].value + 1;
    }
    if (nextCell === "A") {
      weights[ACTION_INDEX.left].value = weights[ACTION_INDEX.left].value + 1;
    }
    if (nextCell.indexOf("E") === 0) {
      weights[ACTION_INDEX.fire].value = weights[ACTION_INDEX.fire].value + 1;
    }
  }
  if (user?.isWest) {
    const nextCell = field[user.row][user.column + 1];
    if (nextCell === "_") {
      weights[ACTION_INDEX.move].value = weights[ACTION_INDEX.move].value + 1;
    }
    if (nextCell === "A") {
      weights[ACTION_INDEX.left].value = weights[ACTION_INDEX.left].value + 1;
    }
    if (nextCell.indexOf("E") === 0) {
      weights[ACTION_INDEX.fire].value = weights[ACTION_INDEX.fire].value + 1;
    }
  }
};

app.post("/move", (req, res) => {
  const { field, narrowingIn, gameId } = req.body;

  res.setHeader("Content-Type", "application/json");
  res.status(200);

  console.log(gameMemory);

  if (!gameMemory[gameId]) {
    gameMemory[gameId] = {
      narrowingLevel: 1,
    };
  }

  if (narrowingIn === 1) {
    gameMemory[gameId].narrowingLevel = gameMemory[gameId].narrowingLevel + 1;
  }

  let { narrowingLevel } = gameMemory[gameId];

  const weights = [
    { action: "MOVE", value: 0.1 },
    { action: "RIGHT", value: 0 },
    { action: "LEFT", value: 0 },
    { action: "FIRE", value: 0 },
  ];

  const amountOfRows = 13;
  const amountOfColumns = 13;
  let user;

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
      const currentUser = field[row][column];
      if (currentUser.indexOf("P") === 0) {
        user = {
          row,
          column,
          user: currentUser,
          isNorth: currentUser.includes("N"),
          isSouth: currentUser.includes("S"),
          isWest: currentUser.includes("W"),
          isEast: currentUser.includes("E"),
        };
      }
    }
  }

  checkCellAhead(field, user, weights);
  fireImmediately(field, user, weights);

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

  console.log(user, weights);

  return res.send(nextMove);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
