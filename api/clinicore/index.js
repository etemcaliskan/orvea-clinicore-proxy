// Example Node/Express proxy for Clinicoresuite
// Use on your own server / Vercel / Render / Railway

import express from 'express';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const WAPI_TOKEN = process.env.CLINICORE_WAPI_TOKEN; // for read endpoints

app.get('/api/clinicore/services', async (req, res) => {
  try {
    const url = new URL('https://wapi.clinicoresuite.app/services');
    const response = await fetch(url, {
      headers: {
        AuthorizationToken: WAPI_TOKEN,
        Accept: 'application/json'
      }
    });
    const text = await response.text();
    res.status(response.status).type('application/json').send(text);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/clinicore/slots', async (req, res) => {
  try {
    const { service, days, date, users, user, offices, remote } = req.query;
    const url = new URL('https://wapi.clinicoresuite.app/slots');
    if (service) url.searchParams.set('service', service);
    if (days) url.searchParams.set('days', days);
    if (date) url.searchParams.set('date', date);
    if (offices) url.searchParams.set('offices', offices);
    if (remote) url.searchParams.set('remote', remote);
    if (users) {
      String(users).split(',').filter(Boolean).forEach(v => url.searchParams.append('users[]', v));
    } else if (user) {
      url.searchParams.append('users[]', user);
    }
    const response = await fetch(url, {
      headers: {
        AuthorizationToken: WAPI_TOKEN,
        Accept: 'application/json'
      }
    });
    const text = await response.text();
    res.status(response.status).type('application/json').send(text);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/clinicore/book', async (req, res) => {
  try {
    const form = new URLSearchParams();
    Object.entries(req.body || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') form.append(k, String(v));
    });

    const response = await fetch('https://clinicoresuite.app/rejestracja/order', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: form.toString()
    });

    const text = await response.text();
    res.status(response.status).type('application/json').send(text);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy running on http://localhost:${PORT}`);
});
