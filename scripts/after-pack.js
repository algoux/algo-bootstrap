const path = require('path');
const { execSync } = require('child_process');

module.exports = (data) => {
  if (data.electronPlatformName === 'darwin') {
    const shell = path.join(__dirname, 'mac-code-sign.sh');
    execSync(shell, { stdio: 'inherit' });
  }
};
