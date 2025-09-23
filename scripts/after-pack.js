const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

module.exports = () => {
  if (os.platform() === 'darwin') {
    const shell = path.join(__dirname, 'mac-code-sign.sh');
    execSync(shell, { stdio: 'inherit' });
  }
};
