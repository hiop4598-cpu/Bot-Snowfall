const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/callback', (req, res) => {
  const code = req.query.code || 'ไม่มีรหัส code';
  res.send(`เชื่อมต่อสำเร็จ! รหัส OAuth2 Code ของคุณคือ: ${code}`);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
