const { ipcMain, dialog } = require('electron')
const fs = require('fs')
const path = require('path')
const { readBangumiData, downloadBangumiData, saveBangumiData, addBangumiData } = require('./bangumiManager')
const { getConfig, getConfigFilePath } = require('./configManager')
const db = require('./database')

function setupIPC() {
    // 获取番剧列表
    ipcMain.handle('get-bangumi', () => {
        console.log('IPC: 收到 get-bangumi 请求')
        try {
            // readBangumiData 是同步的
            const result = readBangumiData()
            console.log('IPC: get-bangumi 处理完成')
            return result
        } catch (error) {
            console.error('IPC: 处理 get-bangumi 时出错:', error)
            return { success: false, error: error.message }
        }
    })

    // 下载最新番剧数据
    ipcMain.handle('download-bangumi-data', async () => {
        console.log('IPC: 收到 download-bangumi-data 请求')
        try {
            const config = getConfig()
            console.log('IPC: 使用配置调用 downloadBangumiData...', config)
            // 将配置传递给 bangumiManager 中的函数
            const result = await downloadBangumiData(config)
            console.log('IPC: download-bangumi-data 处理完成')
            return result
        } catch (error) {
            console.error('IPC: 处理 download-bangumi-data 时出错:', error)
            return { success: false, error: error.message }
        }
    })

    // 保存（更新）单个番剧信息
    ipcMain.handle('save-bangumi', (_, data) => {
        console.log('IPC: 收到 save-bangumi 请求', data ? data.name : '')
        try {
            // saveBangumiData 是同步的
            const result = saveBangumiData(data)
            console.log('IPC: save-bangumi 处理完成')
            return result
        } catch (error) {
            console.error('IPC: 处理 save-bangumi 时出错:', error)
            return { success: false, error: error.message }
        }
    })

    // 新增：添加单个番剧信息
    ipcMain.handle('add-bangumi', (_, data) => {
        console.log('IPC: 收到 add-bangumi 请求', data ? data.name : '')
        try {
            const result = addBangumiData(data)
            console.log('IPC: add-bangumi 处理完成')
            return result
        } catch (error) {
            // addBangumiData 内部会捕获并返回错误信息，理论上这里不太会再 catch
            console.error('IPC: 处理 add-bangumi 时出错:', error)
            return { success: false, error: error.message }
        }
    })

    // 新增：处理更新番剧排序
    ipcMain.handle('update-bangumi-order', (_, sortedIds) => {
        console.log('接收到 update-bangumi-order 请求')
        try {
            const result = db.updateBangumiOrder(sortedIds) // 调用数据库函数
            console.log('番剧排序更新成功')
            return { success: true, data: result } // 返回成功状态
        } catch (error) {
            console.error('更新番剧排序失败:', error)
            return { success: false, error: error.message } // 返回失败状态和错误信息
        }
    })

    // 获取配置文件的路径
    ipcMain.handle('get-config-file-path', () => {
        console.log('IPC: 收到 get-config-file-path 请求')
        try {
            const configPath = getConfigFilePath()
            console.log('IPC: 获取配置文件路径成功', configPath)
            return { success: true, path: configPath }
        } catch (error) {
            console.error('IPC: 处理 get-config-file-path 时出错:', error)
            return { success: false, error: error.message }
        }
    })

    // 新增：导出番剧数据为 JSON 文件
    ipcMain.handle('export-bangumi-json', async () => {
        console.log('IPC: 收到 export-bangumi-json 请求')
        try {
            // 1. 获取当前番剧数据 (同步)
            const bangumiResult = readBangumiData() // readBangumiData 内部调用 getAllBangumi，已包含 sort_order
            if (!bangumiResult.success) {
                console.error('导出失败：无法读取番剧数据。', bangumiResult.error)
                return { success: false, error: `无法读取番剧数据: ${bangumiResult.error}` }
            }
            let bangumiData = bangumiResult.data
            console.log(`准备导出 ${bangumiData.length} 条番剧数据...`)

            // 2. 移除 id 和 sort_order 字段
            const dataToExport = bangumiData.map(item => {
                const { id, sort_order, ...rest } = item; // 使用对象解构移除字段
                return rest; // 返回不包含 id 和 sort_order 的对象
            });
            console.log('已移除导出数据中的 id 和 sort_order 字段。');

            // 3. 打开文件保存对话框
            const { canceled, filePath } = await dialog.showSaveDialog({
                title: '导出番剧数据为 JSON',
                defaultPath: `bangumi_export_${Date.now()}.json`,
                filters: [
                    { name: 'JSON 文件', extensions: ['json'] },
                    { name: '所有文件', extensions: ['*'] }
                ]
            })

            // 4. 处理用户选择
            if (canceled) {
                console.log('用户取消了导出操作。')
                return { success: false, cancelled: true }
            }

            if (!filePath) {
                console.error('导出失败：未选择有效的保存路径。')
                return { success: false, error: '未选择有效的保存路径' }
            }

            console.log(`用户选择导出路径: ${filePath}`)

            // 5. 写入 JSON 文件 (同步)
            try {
                // 使用 JSON.stringify 将处理后的数据转换为格式化的 JSON 字符串
                const jsonData = JSON.stringify(dataToExport, null, 2)
                fs.writeFileSync(filePath, jsonData, 'utf8')
                console.log('成功将数据写入 JSON 文件。')
                return { success: true }
            } catch (writeError) {
                console.error('写入 JSON 文件时出错:', writeError)
                return { success: false, error: `写入文件失败: ${writeError.message}` }
            }
        } catch (error) {
            console.error('IPC: 处理 export-bangumi-json 时发生意外错误:', error)
            return { success: false, error: `导出过程中发生错误: ${error.message}` }
        }
    })

    // 新增：获取当前配置（可以选择性暴露）
    // 注意：直接暴露所有配置给渲染进程可能有安全风险，按需暴露
    // ipcMain.handle('get-current-config', () => {
    //     try {
    //         const config = getConfig()
    //         // 只返回部分安全的配置项
    //         return { success: true, config: { /* apiUrl: config.apiUrl */ } }
    //     } catch (error) {
    //         return { success: false, error: error.message }
    //     }
    // })

    console.log('所有 IPC 处理器已注册。')
}

module.exports = {
    setupIPC
} 