const fs = require('fs-extra');

const args = process.argv.slice(2);

if (args.length < 4) {
  process.stderr.write(
    'Usage: node magic-worker.js <config-path> <output-path> <base-speed> <stage>\n',
  );
  process.exit(1);
}

const configPath = args[0];
const outputPath = args[1];
const baseSpeed = parseInt(args[2], 10);
const stage = parseInt(args[3], 10);

process.title = 'ab-magic-worker';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function appendChar(char, outputPath) {
  await fs.appendFile(outputPath, char, { encoding: 'utf-8' });
}

async function processConfigItem(configItem, outputPath) {
  if (configItem.delay) {
    await sleep(configItem.delay);
  }

  const speed = configItem.speed || 1;
  const charDelay = 1000 / baseSpeed / speed;
  const text = configItem.text || '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    await appendChar(char, outputPath);
    if (nextChar === '\n' || nextChar === '\r') {
      continue;
    }
    await sleep(charDelay);
  }

  return true;
}

async function main() {
  const config = await fs.readJSON(configPath);
  await fs.ensureFile(outputPath);
  if (!Number.isInteger(stage) || stage < 1) {
    process.stderr.write('Stage must be an integer greater than 0\n');
    process.exit(1);
  }
  if (!Number.isInteger(baseSpeed) || baseSpeed < 1) {
    process.stderr.write('Base speed must be an integer greater than 0\n');
    process.exit(1);
  }

  const itemIndexes = [];
  let inStage = false;
  for (let i = 0; i < config.length; i++) {
    const item = config[i];
    if (!inStage) {
      if (item.stage !== stage) {
        continue;
      }
      inStage = true;
    } else if (item.stage && item.stage !== stage) {
      break;
    }
    itemIndexes.push(i);
  }

  console.log(`Processing config indexes: [${itemIndexes.join(', ')}]`);
  for (const itemIndex of itemIndexes) {
    console.log(`Processing config item ${itemIndex}`);
    await processConfigItem(config[itemIndex], outputPath);
  }
  console.log(`Completed ${itemIndexes.length} items`);
}

process.on('SIGTERM', () => {
  process.stderr.write('Received SIGTERM, shutting down gracefully...\n');
  process.exit(0);
});

process.on('SIGINT', () => {
  process.stderr.write('Received SIGINT, shutting down gracefully...\n');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  process.stderr.write(`Uncaught exception: ${error}\n`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  process.stderr.write(`Unhandled rejection at: ${promise} reason: ${reason}\n`);
  process.exit(1);
});

main().then(() => {
  process.exit(0);
});
