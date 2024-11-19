const express = require('express');
const app = express();
const cors = require('cors')

const port = 3000;

app.use(cors())

app.get('/healthz', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200);
  res.send();
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});