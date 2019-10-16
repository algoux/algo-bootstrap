import { exec } from 'promisify-child-process';

async function checkGcc() {
  console.log('check GCC');
  const { stdout, stderr } = await exec('gcc -v', {
    timeout: 10 * 1000,
    windowsHide: true,
  });
  console.log('out', stdout, 'err', stderr);
}

async function checkEnvironment() {
  const gcc = await checkGcc();
}

export default checkEnvironment;
