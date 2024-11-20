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

const userAheadScenario = (row, column, position, weights) => {

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

  const { narrowingLevel, position } = gameMemory[gameId];

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
      userAheadScenario(row, column, position, weights);
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
