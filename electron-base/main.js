const { app, dialog } = require('electron')
const path = require('path')

// 导入模块
const { createWindow } = require(path.join(__dirname, 'src/windowManager'))
const { setupIPC } = require(path.join(__dirname, 'src/ipcManager'))
const { closeDb } = require(path.join(__dirname, 'src/database'))
const { loadConfig, getConfigFilePath } = require(path.join(__dirname, 'src/configManager'))

app.whenReady().then(() => {
    try {
        // **步骤 1: 加载配置**
        console.log('应用准备就绪，开始加载配置文件...')
        loadConfig() // 同步加载配置
        console.log('配置文件加载完成。')

        // **步骤 2: 创建主窗口**
        console.log('开始创建主窗口...')
        createWindow()
        console.log('主窗口创建完成。')

        // **步骤 3: 设置 IPC 通信**
        console.log('开始设置 IPC 通信...')
        setupIPC()
        console.log('IPC 通信设置完成。')

    } catch (error) {
        console.error('应用初始化过程中发生严重错误:', error)
        // 显示错误对话框给用户
        dialog.showErrorBox(
            '应用启动失败',
            `无法加载应用配置或初始化窗口/IPC。
错误: ${error.message}
配置路径: ${getConfigFilePath() || '未知'}
请检查配置文件。`
        )
        app.quit() // 退出应用
    }
})

// 其他应用生命周期事件处理
app.on('window-all-closed', () => {
    console.log('所有窗口已关闭。')
    if (process.platform !== 'darwin') {
        app.quit() // 非 macOS 平台关闭所有窗口后退出应用
    }
})

// 监听应用退出事件，确保关闭数据库连接
app.on('will-quit', () => {
    console.log('应用即将退出，关闭数据库连接...')
    closeDb()
    console.log('应用退出处理完成。')
})

app.on('activate', () => {
    // macOS specific logic
})