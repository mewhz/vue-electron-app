const { ipcMain } = require('electron')
const { readBangumiData, downloadBangumiData } = require('./bangumiManager')

function setupIPC() {
    // 在主进程注册一个处理器
    ipcMain.handle('get-bangumi', () => {
        return readBangumiData()
    });
    
    ipcMain.handle('download-bangumi', () => {
        return downloadBangumiData()
    });
}
module.exports = {
    setupIPC
} 