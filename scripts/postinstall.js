const cp = require('child_process');

if (process.platform === 'darwin') {
  cp.execSync('npm i --save-optional node-pty', { stdio: 'inherit' });
}
if (process.platform === 'win32') {
  cp.execSync('npm i --save-optional native-reg', { stdio: 'inherit' });
}
