const fs   = require('fs');
const path = require('path');

// Pastikan folder logs ada
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

const logFile = path.join(logsDir, 'bot.log');

/**
 * Format tanggal ke string lokal
 */
function timestamp() {
  return new Date().toLocaleString('id-ID', {
    timeZone:    'Asia/Makassar', // WITA — sesuaikan jika perlu
    day:         '2-digit',
    month:       '2-digit',
    year:        'numeric',
    hour:        '2-digit',
    minute:      '2-digit',
    second:      '2-digit',
  });
}

/**
 * Tulis log ke console DAN file
 * @param {'INFO'|'WARN'|'ERROR'} level
 * @param {string} message
 */
function log(level, message) {
  const line = `[${timestamp()}] [${level}] ${message}`;
  console.log(line);
  fs.appendFileSync(logFile, line + '\n', 'utf8');
}

module.exports = {
  info:  (msg) => log('INFO',  msg),
  warn:  (msg) => log('WARN',  msg),
  error: (msg) => log('ERROR', msg),
};
