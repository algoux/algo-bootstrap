const fs = require('fs');
const path = require('path');
const os = require('os');

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
const version = packageJson.version;

const sourceFile = path.join(__dirname, '../src/bin/abc.js');
const sourceContent = fs.readFileSync(sourceFile, 'utf8');

const processedContent = sourceContent.replace(/0\.0\.0/g, version);

const outputDir = path.join(__dirname, '../dist/bin');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const tempAbcPath = path.join(outputDir, 'abc.js');
fs.writeFileSync(tempAbcPath, processedContent);

// 创建 Unix/Linux/macOS 可执行文件 (abc)
const unixExecutable = `#!/bin/bash
# Algo Bootstrap CLI - Unix/Linux/macOS wrapper

SCRIPT_PATH="\${BASH_SOURCE[0]}"
if [ -L "$SCRIPT_PATH" ]; then
    SCRIPT_PATH="$(readlink -f "$SCRIPT_PATH")"
fi
SCRIPT_DIR="$(cd "$(dirname "$SCRIPT_PATH")" && pwd)"

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    ELECTRON_PATH="\${SCRIPT_DIR}/../../../MacOS/Algo Bootstrap"
    NODE_PATH="\${SCRIPT_DIR}/../../../Resources/app.asar/node_modules"
else
    echo "Unsupported platform: $OSTYPE"
    exit 1
fi

if [ ! -f "\$ELECTRON_PATH" ]; then
    echo "Error: Electron executable not found at \$ELECTRON_PATH"
    echo "Please make sure Algo Bootstrap is properly installed."
    exit 1
fi

ELECTRON_RUN_AS_NODE=1 NODE_PATH="\${NODE_PATH}" "\$ELECTRON_PATH" "\${SCRIPT_DIR}/abc.js" "\$@"
`;

// 创建 Windows 批处理文件 (abc.bat)
const windowsBatch = `@echo off
REM Algo Bootstrap CLI - Windows wrapper

set "SCRIPT_DIR=%~dp0"

set "ELECTRON_PATH=%SCRIPT_DIR%..\\..\\..\\Algo Bootstrap.exe"
set "NODE_PATH=%SCRIPT_DIR%..\\..\\app.asar\\node_modules"

if not exist "%ELECTRON_PATH%" (
    echo Error: Electron executable not found at %ELECTRON_PATH%
    echo Please make sure Algo Bootstrap is properly installed.
    exit /b 1
)

set "ELECTRON_RUN_AS_NODE=1"
set "NODE_PATH=%NODE_PATH%"
"%ELECTRON_PATH%" "%SCRIPT_DIR%\\abc.js" %*

REM pause
`;

const unixPath = path.join(outputDir, 'abc');
const windowsPath = path.join(outputDir, 'abc.bat');

fs.writeFileSync(unixPath, unixExecutable);
fs.writeFileSync(windowsPath, windowsBatch);

if (os.platform() !== 'win32') {
  fs.chmodSync(unixPath, '755');
}

console.log('CLI build completed:');
console.log(`- Version: ${version}`);
console.log(`- Unix executable: ${unixPath}`);
console.log(`- Windows batch: ${windowsPath}`);
console.log(`- Processed abc.js: ${tempAbcPath}`);
