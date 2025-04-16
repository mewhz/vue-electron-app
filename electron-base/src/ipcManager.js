const { ipcMain } = require('electron')
const { readBangumiData, downloadBangumiData, saveBangumiData } = require('./bangumiManager')

function setupIPC() {
    // 在主进程注册一个处理器
    ipcMain.handle('get-bangumi', () => {
        return readBangumiData()
    });
    
    ipcMain.handle('download-bangumi', () => {
        return downloadBangumiData()
    });

    ipcMain.handle('save-bangumi', async (_, data) => {
        try {
            const result = await saveBangumiData(data)
            return result
        } catch (error) {
            return { success: false, error: error.message }
        }
    })
}

module.exports = {
    setupIPC
} 