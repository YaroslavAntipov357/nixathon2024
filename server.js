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

const fireImmediately = (field, userObject, weights) => {
  const transposedField = field[0].map((_, colIndex) =>
    field.map((row) => row[colIndex])
  );
  const { row, column, user } = userObject;
  let fieldOfView;
  switch (user) {
    case "PE":
      fieldOfView = field[row].slice(column, column + 4);
      break;
    case "PW":
      fieldOfView = field[row].slice(column - 4, column);
      break;
    case "PN":
      fieldOfView = transposedField[column].slice(row - 4, row);
      break;
    case "PS":
      fieldOfView = transposedField[column].slice(row, row + 4);
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
          isNorth: currentUser.indexOf("N") === 1,
          isSouth: currentUser.indexOf("S") === 1,
          isWest: currentUser.indexOf("W") === 1,
          isEast: currentUser.indexOf("E") === 1,
        };
      }
    }
  }

  checkCellAhead(field, user, weights);
  fireImmediately(field, user, weights);

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
