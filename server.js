const express = require('express');
const app = express();
const cors = require('cors')

const port = 3000;

app.use(cors())

app.get('/healthz', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200);
  res.send({ status: 'OK' });
});

app.post('/move', (_req,res) => {
  const rand = Math.random() * 10;
  
  res.setHeader('Content-Type', 'application/json');
  res.status(200);

  if (rand <= 2.5) {
    return res.send({ move: 'M' })
  } else if (rand > 2.5 && rand <= 5) {
    return res.send({ move: 'R' })
  } else if (rand > 5 && rand <= 7.5) {
    return res.send({ move: 'L' })
  } else {
    return res.send({ move: 'F' })
  }
})

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});