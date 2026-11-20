const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1573366716535406622';
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || '';
const REDIRECT_URI = 'https://bot-snowfall.onrender.com/callback';

app.use(express.static(path.join(__dirname, 'public')));

app.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.redirect('/?error=missing_code');
  }

  if (!CLIENT_SECRET) {
    return res.redirect(`/?username=connected_user&global_name=Discord%20User&id=0`);
  }

  try {
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.redirect('/?error=token_failed');
    }

    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();

    const query = new URLSearchParams({
      id: userData.id || '',
      username: userData.username || 'user',
      global_name: userData.global_name || userData.username || 'user',
      avatar: userData.avatar || '',
    });

    return res.redirect(`/?${query.toString()}`);
  } catch (err) {
    console.error(err);
    return res.redirect('/?error=server_error');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
