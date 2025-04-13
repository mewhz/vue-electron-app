const { BrowserWindow } = require('electron');
const path = require('path');
// BrowserWindow 创建和管理浏览器窗口

function createWindow() {

    const mainWindow = new BrowserWindow({
        width: 2880,
        height: 1800,
        webPreferences: {
            // 禁用 Node.js 集成
            nodeIntegration: false,
            // 启用上下文隔离
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        }
    });
    // 取消菜单可见
    mainWindow.setMenuBarVisibility(false);
    // 最大化窗口
    mainWindow.maximize();
    // mainWindow.loadURL('http://localhost:5173');
    mainWindow.loadURL('http://localhost:5173/bangumi/table');

    // 自动打开开发者工具
    mainWindow.webContents.openDevTools();

    return mainWindow;

}

module.exports = { createWindow };