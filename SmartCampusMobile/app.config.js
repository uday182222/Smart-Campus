const fs = require('fs');
const path = require('path');

function applyExpoPublicEnvFromFiles() {
  const root = __dirname;

  function applyFile(filename) {
    const fp = path.join(root, filename);
    if (!fs.existsSync(fp)) return;
    const text = fs.readFileSync(fp, 'utf8');
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      if (!key.startsWith('EXPO_PUBLIC_')) continue;
      let val = trimmed.slice(eq + 1).trim();
      const singleQuoted =
        val.length >= 2 && val.charCodeAt(0) === 39 && val.charCodeAt(val.length - 1) === 39;
      const doubleQuoted =
        val.length >= 2 && val.charCodeAt(0) === 34 && val.charCodeAt(val.length - 1) === 34;
      if (doubleQuoted || singleQuoted) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }

  applyFile('.env');
  applyFile('.env.local');
}

applyExpoPublicEnvFromFiles();

module.exports = require("./app.json");
