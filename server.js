const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/callback', (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send('ไม่พบรหัส OAuth2 Code กรุณากดเชื่อมต่อจากหน้าเว็บใหม่อีกครั้ง');
  }
  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>เชื่อมต่อสำเร็จ - Bot Snowfall</title>
      <style>
        body {
          font-family: sans-serif;
          background: #111318;
          color: #fff;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          padding: 16px;
        }
        .box {
          background: #1b1f29;
          padding: 24px;
          border-radius: 14px;
          max-width: 440px;
          width: 100%;
          box-shadow: 0 10px 30px rgba(0,0,0,0.4);
        }
        code {
          display: block;
          background: #111318;
          padding: 10px;
          border-radius: 8px;
          word-break: break-all;
          margin-top: 10px;
          color: #7289da;
        }
        a {
          display: inline-block;
          margin-top: 16px;
          padding: 10px 14px;
          background: #5865F2;
          color: #fff;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="box">
        <h2>เชื่อมต่อ Discord สำเร็จ!</h2>
        <p>ได้รับรหัส OAuth2 Code เรียบร้อยแล้ว:</p>
        <code>${code}</code>
        <a href="/">กลับไปที่หน้าเว็บหลัก</a>
      </div>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
