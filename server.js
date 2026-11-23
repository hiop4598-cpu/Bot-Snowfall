const express = require('express');
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');

const app = express();
const PORT = process.env.PORT || 3000;

const CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1573366716535406622';
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || 'https://bot-snowfall.onrender.com/callback';
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';

const publicDir = path.join(__dirname, 'public');
const uploadDir = path.join(publicDir, 'uploads');

if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

let botClient = null;
let currentPresence = {
  name: 'Snowfall Status',
  type: 3, // 0 = Playing, 2 = Listening, 3 = Watching
  status: 'online'
};

function applyBotPresence() {
  if (!botClient || !botClient.user) return false;
  botClient.user.setPresence({
    activities: [{
      name: currentPresence.name,
      type: currentPresence.type
    }],
    status: currentPresence.status
  });
  return true;
}

app.post('/api/upload', express.raw({ type: '*/*', limit: '15mb' }), (req, res) => {
  try {
    const rawExt = String(req.headers['x-file-ext'] || '.gif')
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, '');
    const allowedExt = ['.gif', '.png', '.jpg', '.jpeg', '.webp'];
    const ext = allowedExt.includes(rawExt) ? rawExt : '.gif';

    if (!req.body || !Buffer.isBuffer(req.body) || req.body.length === 0) {
      return res.status(400).json({ ok: false, error: 'ไม่พบข้อมูลไฟล์ที่ส่งมา' });
    }

    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    fs.writeFileSync(path.join(uploadDir, fileName), req.body);
    return res.json({ ok: true, url: `/uploads/${fileName}` });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'บันทึกไฟล์ลงเซิร์ฟเวอร์ไม่สำเร็จ' });
  }
});

app.use(express.json());
app.use(express.static(publicDir));
app.use('/uploads', express.static(uploadDir));

app.get('/api/presence', (req, res) => {
  res.json({
    ok: true,
    botReady: Boolean(botClient && botClient.user),
    presence: currentPresence
  });
});

app.post('/api/presence', (req, res) => {
  const name = String(req.body?.name || '').trim();
  const type = Number(req.body?.type ?? 3);
  const allowedStatus = ['online', 'idle', 'dnd', 'invisible'];
  const status = allowedStatus.includes(req.body?.status) ? req.body.status : 'online';

  if (!name) {
    return res.status(400).json({ ok: false, error: 'กรุณากรอกข้อความสถานะ' });
  }

  currentPresence = {
    name: name.slice(0, 128),
    type: [0, 2, 3].includes(type) ? type : 3,
    status
  };

  const applied = applyBotPresence();
  return res.json({
    ok: true,
    applied,
    presence: currentPresence,
    message: applied ? 'อัปเดตสถานะบอทสำเร็จแล้ว' : 'บันทึกสถานะไว้แล้ว แต่บอทยังไม่ได้ล็อกอิน'
  });
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.redirect('/?auth_error=missing_code');
  if (!CLIENT_SECRET) return res.redirect('/?auth_error=missing_secret');

  try {
    const tokenParams = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: String(code),
      redirect_uri: REDIRECT_URI
    });

    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString()
    });
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok || !tokenJson.access_token) {
      return res.redirect('/?auth_error=token_failed');
    }

    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` }
    });
    const userJson = await userRes.json();
    if (!userRes.ok || !userJson.id) {
      return res.redirect('/?auth_error=user_failed');
    }

    const redirectQuery = new URLSearchParams({
      id: userJson.id,
      username: userJson.username || '',
      global_name: userJson.global_name || '',
      avatar: userJson.avatar || ''
    });

    return res.redirect(`/?${redirectQuery.toString()}`);
  } catch (err) {
    return res.redirect('/?auth_error=server_error');
  }
});

app.get('/health', (req, res) => {
  res.json({ ok: true, status: 'server running' });
});

if (BOT_TOKEN && BOT_TOKEN.trim().length > 20) {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds]
  });
  botClient = client;

  client.once('ready', () => {
    console.log(`Discord bot logged in as ${client.user.tag}`);
    applyBotPresence();
  });

  client.login(BOT_TOKEN.trim()).catch(err => {
    console.error('Discord bot login failed:', err.message);
  });
} else {
  console.log('DISCORD_BOT_TOKEN is not set yet.');
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
