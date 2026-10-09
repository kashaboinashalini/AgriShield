const http = require('http');

function call(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = { ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}), ...(token ? { Authorization: 'Bearer ' + token } : {}) };
    const r = http.request({ hostname: '127.0.0.1', port: 5000, path, method, headers }, (res) => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(b) }); } catch { resolve({ status: res.statusCode, body: b }); }
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

(async () => {
  // 1) Login demo
  let r = await call('POST', '/api/auth/demo', { password: 'Demo@123' });
  console.log('POST /api/auth/demo =>', r.status);
  if (r.status !== 200) { process.exit(0); }
  const token = r.body.data && r.body.data.token;
  console.log('token acquired');

  // 2) List farms
  let farmsR = await call('GET', '/api/farms', null, token);
  console.log('GET /api/farms =>', farmsR.status);
  const farms = farmsR.body.data || [];
  const farm = farms.find(f => f.active) || farms[0];
  console.log('active farm:', farm && farm.farmName, farm && farm._id);

  // 3) Weather
  if (farm && farm._id) {
    let w = await call('GET', `/api/weather/current/${farm._id}`, null, token);
    console.log('GET /api/weather/current/:id =>', w.status);
  }

  // 4) Risk history
  let hr = await call('GET', '/api/risk/history', null, token);
  console.log('GET /api/risk/history =>', hr.status, hr.body ? hr.body.slice(0, 120) : '');

  // 5) Disasters
  let dr = await call('GET', '/api/disasters', null, token);
  console.log('GET /api/disasters =>', dr.status, dr.body ? dr.body.slice(0, 120) : '');

  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });