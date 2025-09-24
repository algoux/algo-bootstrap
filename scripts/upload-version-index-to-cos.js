const fs = require('fs-extra');
const path = require('path');
const md5File = require('md5-file');
const COS = require('cos-nodejs-sdk-v5');

const args = process.argv.slice(2);
const releaseVersion = args[0];
const baseDir = path.join(__dirname, '../artifacts');

const VERSION_INDEX_FILE = 'version.json';
const REMOTE_FILE_PATH = (process.env.COS_BASE_PATH || 'algo-bootstrap/') + VERSION_INDEX_FILE;
const CDN_URL_BASE =
  (process.env.CDN_URL_BASE || 'https://cdn.algoux.cn/algo-bootstrap/release/') +
  releaseVersion +
  '/';
const TZ = process.env.TZ || 'Asia/Shanghai';

async function listFiles(dir, filter) {
  let files = await fs.readdir(dir, { withFileTypes: true });
  let fileNames = [];

  for (let file of files) {
    let fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      fileNames = fileNames.concat(await listFiles(fullPath));
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
    throw new Error('Usage: node upload-version-index-to-cos.js <releaseVersion>');
  }
  console.log(`Uploading version index for ${releaseVersion}`);
  const cos = new COS({
    Domain: process.env.COS_DOMAIN,
    SecretId: process.env.COS_SECRET_ID,
    SecretKey: process.env.COS_SECRET_KEY,
  });
  const files = await listFiles(baseDir);
  const filePlatformArchRegMap = {
    'win32-arm64': /arm64-.*\.exe$/,
    'win32-x64': /x64-.*\.exe$/,
    'darwin-arm64': /arm64-.*\.dmg$/,
    'darwin-x64': /x64-.*\.dmg$/,
  };
  const filePlatformArchMap = {
    'win32-arm64': {
      url: '',
      md5: '',
    },
    'win32-x64': {
      url: '',
      md5: '',
    },
    'darwin-arm64': {
      url: '',
      md5: '',
    },
    'darwin-x64': {
      url: '',
      md5: '',
    },
  };
  for (const pa of Object.keys(filePlatformArchRegMap)) {
    const file = files.find((file) => filePlatformArchRegMap[pa].test(file));
    if (!file) {
      console.error(`No file found for ${pa}`);
      process.exit(1);
    }
    const md5 = await md5File(path.join(baseDir, file));
    filePlatformArchMap[pa].url = `${CDN_URL_BASE}${file}`;
    filePlatformArchMap[pa].md5 = md5;
  }

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const versionIndex = {
    version: releaseVersion,
    url: 'https://ab.algoux.cn/',
    releaseDate: formatter.format(new Date()),
    ...filePlatformArchMap,
  };
  console.log('Version index:', versionIndex);

  console.log(`Uploading to ${REMOTE_FILE_PATH}`);
  await cos.putObject({
    Bucket: process.env.COS_BUCKET,
    Region: process.env.COS_REGION,
    Key: REMOTE_FILE_PATH,
    Body: JSON.stringify(versionIndex, null, 2),
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
