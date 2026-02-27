// Skrypt do opóźnienia startu Electrona
const { spawn } = require('cross-spawn');

console.log('Czekam 3 sekundy na start Vite...');

setTimeout(() => {
  console.log('Uruchamiam Electron...');
  const electron = spawn('npm', ['run', 'electron'], { stdio: 'inherit' });
  electron.on('error', (err) => {
    console.error('Błąd uruchamiania Electrona:', err);
  });
}, 3000);
