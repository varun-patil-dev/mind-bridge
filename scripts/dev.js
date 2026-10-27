const { spawn } = require('node:child_process');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const reactStart = require.resolve('react-scripts/scripts/start.js');
const children = [];
let shuttingDown = false;

const start = (label, command, args, extraEnv = {}) => {
  const child = spawn(command, args, {
    cwd: projectRoot,
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
  });
  children.push(child);
  child.on('error', (error) => {
    console.error(`${label} could not start:`, error.message);
    process.exitCode = 1;
    shutdown();
  });
  child.on('exit', (code, signal) => {
    if (!shuttingDown) {
      process.exitCode = code ?? (signal ? 1 : 0);
      shutdown();
    }
  });
  return child;
};

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  children.forEach((child) => {
    if (!child.killed) child.kill('SIGTERM');
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start('Local moderation API', process.execPath, [path.join(__dirname, 'local-api.js')]);
start('React development server', process.execPath, [reactStart], {
  BROWSER: 'none',
  HOST: '127.0.0.1',
  DANGEROUSLY_DISABLE_HOST_CHECK: 'true',
});
