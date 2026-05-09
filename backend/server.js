require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const { ensureDataDirs } = require('./services/storage');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/contexts', require('./routes/contexts'));
app.use('/api/cards', require('./routes/cards'));
app.use('/api/clipboard', require('./routes/clipboard'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/tracker', require('./routes/tracker'));
app.use('/api/goals', require('./routes/goals'));

const PORT = process.env.PORT || 4000;
ensureDataDirs().then(() => {
  app.listen(PORT, () => console.log(`Personal OS backend running on :${PORT}`));
});
