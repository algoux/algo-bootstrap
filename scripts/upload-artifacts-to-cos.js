const fs = require('fs').promises;
const path = require('path');
const COS = require('cos-nodejs-sdk-v5');

const args = process.argv.slice(2);
const releaseVersion = args[0];
const baseDir = path.join(__dirname, '../release');

const REMOTE_PATH = (process.env.COS_BASE_PATH || 'algo-bootstrap/release/') + releaseVersion + '/';

async function listFiles(dir, maxDepth = Infinity, filter, _depth = 0) {
  if (_depth > 0 && _depth > maxDepth) {
    return [];
  }
  let files = await fs.readdir(dir, { withFileTypes: true });
  let fileNames = [];

  for (let file of files) {
    let fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      fileNames = fileNames.concat(await listFiles(fullPath, maxDepth, filter, _depth + 1));
    } else {
      fileNames.push(path.relative(baseDir, fullPath));
    }
  }

  return fileNames.filter(filter || Boolean).filter(Boolean);
}

async function main() {
  if (
    !process.env.COS_SECRET_ID ||
    !process.env.COS_SECRET_KEY ||
    !process.env.COS_BUCKET ||
    !process.env.COS_REGION
  ) {
    throw new Error('COS_SECRET_ID, COS_SECRET_KEY, COS_BUCKET, COS_REGION must be set');
  }
  if (!releaseVersion) {
    throw new Error('Usage: node upload-artifacts-to-cos.js <releaseVersion>');
  }
  console.log(`Uploading artifacts for ${releaseVersion}`);
  const cos = new COS({
    Domain: process.env.COS_DOMAIN,
    SecretId: process.env.COS_SECRET_ID,
    SecretKey: process.env.COS_SECRET_KEY,
  });
  const files = await listFiles(
    baseDir,
    0,
    (file) =>
      file.endsWith('.dmg') ||
      file.endsWith('.exe') ||
      file.endsWith('.zip') ||
      file.endsWith('.AppImage'),
  );
  for (const file of files) {
    const remotePath = `${REMOTE_PATH}${file}`;
    console.log(`Uploading ${file} -> ${remotePath}`);
    await cos.uploadFile({
      Bucket: process.env.COS_BUCKET,
      Region: process.env.COS_REGION,
      Key: remotePath,
      FilePath: path.join(baseDir, file),
    });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
