console.clear()

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const tokkoRoutes = require('./routes/tokko');
const metaRoutes = require('./routes/meta');
const juanitaRoutes = require('./routes/juanita');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/tokko', tokkoRoutes);
app.use('/api/meta', metaRoutes);
app.use('/api/juanita', juanitaRoutes);


app.get('/', (req, res) => {
  res.json({
    mensaje: 'pong'
  })
})

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
