const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');

const port = 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/healthz', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200);
  res.send({ status: 'OK' });
});

const gameMemory = {};

app.post('/move', (req,res) => {
  const { field, narrowing, gameId } = req.body;
  
  res.setHeader('Content-Type', 'application/json');
  res.status(200);

  gameMemory[gameId] = {};
  
  for (let x = 0; x <= field.length; x++ ) {
    for (let y = 0; y <= field[0].length; y++) {
      
    }
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});