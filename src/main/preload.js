const { contextBridge, ipcRenderer } = require('electron');
require('@electron/remote/main').initialize();

// 暴露 Node.js API 到渲染进程
window.process = process;
window.require = require;

// 暴露 electron-better-ipc 的渲染进程部分
window.ipcRenderer = ipcRenderer;

process.once('loaded', () => {});
