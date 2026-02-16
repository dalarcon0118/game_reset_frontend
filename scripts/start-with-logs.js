const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Intentar liberar el puerto 8081 antes de empezar
try {
  console.log('Checking for processes on port 8081...');
  const stdout = execSync('lsof -t -i:8081').toString();
  if (stdout) {
    const pids = stdout.trim().split('\n');
    console.log(`Killing processes on port 8081: ${pids.join(', ')}`);
    pids.forEach(pid => {
      try {
        process.kill(pid, 'SIGKILL');
      } catch (e) {}
    });
  }
} catch (e) {
  // lsof falla si no hay procesos, esto es normal
}

// Crear directorio de logs si no existe (mantenido por si se ejecuta directo)
const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// const logFilePath = path.join(logDir, 'frontend.log');
// const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

const startDevPath = path.join(__dirname, '..', 'start-dev.js');
console.log(`Starting project at ${path.join(__dirname, '..')}`);
console.log(`Using script: ${startDevPath}`);

const child = spawn('node', [startDevPath], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit'
});

child.on('error', (err) => {
  console.error(`Failed to start child process: ${err.message}`);
});

child.on('close', (code) => {
  console.log(`Child process exited with code ${code}`);
  process.exit(code);
});
