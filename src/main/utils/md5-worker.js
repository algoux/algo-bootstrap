const os = require('os');
const md5File = require('md5-file');
const { default: Queue } = require('p-queue');

const args = process.argv.slice(2);

if (args.length < 1) {
  process.stderr.write('Usage: node md5-worker.js <input-file-path1> <input-file-path2> ...\n');
  process.exit(1);
}

const inputFilePaths = args.map((p) => p.trim());

process.title = 'ab-md5-worker';

async function main() {
  const results = [];
  const concurrency = Math.max(Math.floor(os.cpus().length * 0.5), 1);
  process.stderr.write(`Using concurrency: ${concurrency}\n`);
  const queue = new Queue({ concurrency });

  const start = performance.now();
  for (let i = 0; i < inputFilePaths.length; i++) {
    const filePath = inputFilePaths[i];
    queue.add(async () => {
      try {
        const start = performance.now();
        const md5 = await md5File(filePath);
        const end = performance.now();
        results.push({ index: i, md5, time: end - start });
      } catch (error) {
        process.stderr.write(`Error calculating MD5 for ${filePath}: ${error}\n`);
        results.push({ index: i, error: error.message });
      }
    });
  }

  await queue.onIdle();
  results.sort((a, b) => a.index - b.index);
  results.forEach((r) => {
    delete r.index;
  });
  const end = performance.now();

  if (process.send) {
    process.send(results);
  }

  process.stdout.write(JSON.stringify(results, null, 2));
  process.stderr.write(`Total time: ${end - start}ms\n`);
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
