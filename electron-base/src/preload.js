// preload.js 的作用是充当主进程和渲染进程之间的桥梁
const { contextBridge, ipcRenderer } = require('electron')

// 暴露API到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
    // ipcRenderer.invoke 是 ipcRenderer 模块中的一个方法，用于在渲染进程中调用主进程中的异步方法
    // 调用 IPC 通信
    getBangumi: () => ipcRenderer.invoke('get-bangumi'),
    downloadBangumiData: () => ipcRenderer.invoke('download-bangumi-data'),
    saveBangumi: (data) => ipcRenderer.invoke('save-bangumi', data),
    // 添加进度监听
    onDownloadProgress: (callback) => {
        // 移除之前的监听器
        ipcRenderer.removeAllListeners('download-progress')
        // 添加新的监听器
        ipcRenderer.on('download-progress', (event, progress) => {
            callback(progress)
        })
    },
    // 移除进度监听
    removeDownloadProgress: () => {
        ipcRenderer.removeAllListeners('download-progress')
    }
})