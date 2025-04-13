const { app } = require('electron')
const path = require('path')

// 导入模块
const { createWindow } = require(path.join(__dirname, 'src/windowManager'))
const { setupIPC } = require(path.join(__dirname, 'src/ipcManager'))

app.whenReady().then(() => {
    // 创建主窗口
    createWindow()
    
    // 设置IPC通信
    setupIPC()
})