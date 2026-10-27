const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');

const loadLocalEnv = () => {
  const envPath = path.join(projectRoot, '.env');
  if (!fs.existsSync(envPath)) return;

  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach((line) => {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || match[1].startsWith('#') || process.env[match[1]] !== undefined) return;

    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  });
};

loadLocalEnv();
const moderate = require('../api/moderate');
const port = Number(process.env.LOCAL_API_PORT || 3001);

const sendJson = (res, status, payload) => {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
};

const readJsonBody = (req) => new Promise((resolve, reject) => {
  let body = '';
  req.setEncoding('utf8');
  req.on('data', (chunk) => {
    body += chunk;
    if (body.length > 5000) {
      reject(new Error('Request body is too large.'));
      req.destroy();
    }
  });
  req.on('end', () => {
    try {
      resolve(body ? JSON.parse(body) : {});
    } catch (_error) {
      reject(new Error('Request body must be valid JSON.'));
    }
  });
  req.on('error', reject);
});

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (requestUrl.pathname === '/api/health') {
    return sendJson(res, 200, { api: 'ready', openRouterConfigured: Boolean(process.env.OPENROUTER_API_KEY) });
  }
  if (requestUrl.pathname !== '/api/moderate') return sendJson(res, 404, { error: 'API route not found.' });

  try {
    req.body = await readJsonBody(req);
  } catch (error) {
    return sendJson(res, 400, { error: error.message });
  }

  const headers = {};
  const response = {
    setHeader(name, value) { headers[name] = value; },
    status(statusCode) { res.statusCode = statusCode; return this; },
    json(payload) {
      res.writeHead(res.statusCode || 200, {
        'Content-Type': 'application/json; charset=utf-8',
        ...headers,
      });
      res.end(JSON.stringify(payload));
      return this;
    },
  };

  await moderate(req, response);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Local moderation API listening on http://127.0.0.1:${port}`);
});

server.on('error', (error) => {
  console.error(`Local moderation API failed to start: ${error.message}`);
  process.exitCode = 1;
});
