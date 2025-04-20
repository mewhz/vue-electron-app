const fs = require('fs')
const path = require('path')
const axios = require('axios')
const { BrowserWindow } = require('electron')
// 导入 database.js 中的数据库操作函数
const { getAllBangumi, insertBangumiBatch, updateBangumi, insertBangumi, deleteAllBangumi } = require('./database')

// 从数据库读取番剧数据 (现在调用 database.js 中的函数)
// !! 注意：此函数现在是同步的 !!
function readBangumiData() {
    try {
        // 直接调用 getAllBangumi 函数
        const data = getAllBangumi()
        return { success: true, data }
    } catch (error) {
        console.error('读取番剧数据失败 (bangumiManager):', error)
        // JSON 文件回退逻辑
        try {
            const jsonPath = path.join(__dirname, '../assets/bangumi-other.json')
            if (fs.existsSync(jsonPath)) {
                console.log('数据库读取失败，尝试从 JSON 文件迁移 (使用 insertBangumiBatch)...')
                const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
                // 迁移时，假设 JSON 数据也有 id，否则会失败或被跳过
                const migrationResult = insertBangumiBatch(jsonData)
                if (migrationResult.success) {
                    console.log('从 JSON 文件迁移数据成功。')
                    const data = getAllBangumi()
                    // 可选删除
                    // fs.unlinkSync(jsonPath)
                    return { success: true, data }
                } else {
                    console.error(`从 JSON 文件迁移数据失败，错误数: ${migrationResult.errors}`)
                    return { success: false, error: `JSON 迁移失败，错误数: ${migrationResult.errors}` }
                }
            } else {
                console.log('数据库为空，且未找到 JSON 回退文件。')
                return { success: true, data: [] } // 返回空数据
            }
        } catch (jsonError) {
            console.error('处理 JSON 回退或迁移时出错:', jsonError)
            return { success: false, error: `处理 JSON 回退时出错: ${jsonError.message}` }
        }
    }
}

// 下载番剧数据并存入数据库 (整体异步，数据库操作现在调用 database.js 的同步函数)
async function downloadBangumiData(config) {
    let downloadedItems = [] // 下载到的番剧数据
    try {
        // --- 异步下载逻辑开始 ---
        const { apiUrl, userId, fetchPageSize, fetchSubjectType, fetchCollectionType } = config
        if (!apiUrl || !userId) {
            throw new Error('配置中缺少 apiUrl 或 userId')
        }
        console.log(`开始异步下载番剧数据，API: ${apiUrl}, 用户ID: ${userId}...`)

        let pageNumber = 1
        let totalPages = 1
        let totalItems = 0
        let currentDownloaded = 0
        const mainWindow = BrowserWindow.getFocusedWindow()
        if (!mainWindow) {
            console.warn('无法获取主窗口，将无法发送下载进度。')
        }

        // 获取第一页以确定总页数
        console.log(`获取第一页数据... URL: ${apiUrl}`)
        const firstResponse = await axios.get(apiUrl, {
            params: {
                uid: userId,
                collectionType: fetchCollectionType,
                pageSize: fetchPageSize,
                pageNumber: 1,
                subjectType: fetchSubjectType
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (ElectronApp)' // 可以设置自定义 User-Agent
            }
        })

        if (firstResponse.data.code === 200) {
            totalPages = firstResponse.data.data.totalPages
            const firstList = firstResponse.data.data.list || []
            downloadedItems.push(...firstList)
            // 修正 totalItems 计算，使用 pageSize 更可靠
            totalItems = totalPages * fetchPageSize
            currentDownloaded = firstList.length
            console.log(`总页数: ${totalPages}, 第一页 ${firstList.length} 条数据已下载。估算总条数: ${totalItems}`)
            if (mainWindow && totalItems > 0) {
                const progress = Math.round((currentDownloaded / totalItems) * 100)
                mainWindow.webContents.send('download-progress', progress)
            }
        } else {
            console.error('获取番剧数据第一页失败:', firstResponse.data)
            throw new Error(`获取番剧元数据失败 (Code: ${firstResponse.data.code})`)
        }

        // 下载剩余页面
        while (pageNumber < totalPages) {
            pageNumber += 1
            console.log(`开始下载第 ${pageNumber} 页数据...`)
            try {
                const response = await axios.get(apiUrl, {
                    params: {
                        uid: userId,
                        collectionType: fetchCollectionType,
                        pageSize: fetchPageSize,
                        pageNumber: pageNumber,
                        subjectType: fetchSubjectType
                    },
                    headers: { 'User-Agent': 'Mozilla/5.0 (ElectronApp)' }
                })
                if (response.data.code === 200) {
                    const list = response.data.data.list || []
                    downloadedItems.push(...list)
                    currentDownloaded += list.length
                    console.log(`第 ${pageNumber} 页 (${list.length} 条) 下载完成。`)
                    if (mainWindow && totalItems > 0) {
                        const progress = Math.max(0, Math.min(100, Math.round((currentDownloaded / totalItems) * 100))) // 确保进度在 0-100
                        mainWindow.webContents.send('download-progress', progress)
                    }
                } else {
                    console.warn(`下载第 ${pageNumber} 页数据失败:`, response.data)
                }
            } catch (pageError) {
                console.error(`下载第 ${pageNumber} 页时发生网络错误:`, pageError)
            }
        }
        console.log(`异步下载完成，共获取 ${downloadedItems.length} 条数据。`)
        // --- 异步下载逻辑结束 ---

    } catch (error) {
        console.error('番剧数据下载过程中出错:', error)
        return { success: false, error: `下载失败: ${error.message}` }
    }

    // --- 同步数据库操作开始 ---
    // !! 注意：这部分如果数据量大，可能阻塞 UI !!
    try {
        console.log('开始同步清空数据库...')
        deleteAllBangumi() // 调用删除函数
        console.log('数据库已清空，开始同步插入新数据...')
        const insertResult = insertBangumiBatch(downloadedItems) // 调用批量插入函数

        if (insertResult.success) {
            console.log('成功将下载的数据同步保存到数据库 (删除后插入)。')
            return { success: true }
        } else {
            console.error(`同步插入下载数据失败，错误数: ${insertResult.errors}`)
            // 虽然插入失败，但数据已被删除，这可能不是理想状态
            return { success: false, error: `数据库插入失败，错误数: ${insertResult.errors}` }
        }
    } catch (dbError) {
        console.error('同步清空或插入数据到数据库时发生严重错误:', dbError)
        return { success: false, error: `数据库操作失败: ${dbError.message}` }
    }
    // --- 同步数据库操作结束 ---
}

// 保存（更新）单个番剧数据到数据库 (同步 API)
// !! 注意：此函数现在是同步的 !!
function saveBangumiData(data) {
    if (!data || data.id === null || data.id === undefined) {
        console.error('保存失败：缺少番剧 ID。')
        return { success: false, error: '缺少番剧 ID' }
    }
    try {
        console.log(`准备同步更新番剧 (ID: ${data.id})...`)
        // 调用 database.js 中的更新函数
        const updateResult = updateBangumi(data)

        if (updateResult.success && updateResult.changes > 0) {
            console.log(`同步更新番剧 (ID: ${data.id}) 成功。`)
            return { success: true }
        } else if (updateResult.success && updateResult.changes === 0) {
            console.warn(`同步更新番剧 (ID: ${data.id}) 时未找到匹配项。`)
            return { success: false, error: '未找到要更新的番剧' }
        } else {
            // 如果 updateBangumi 内部抛出错误，这里不会执行，但在上面 catch 处理
            // 这里处理 updateBangumi 返回 { success: false } 的情况 (虽然目前实现不会这样)
            console.error(`同步更新番剧 (ID: ${data.id}) 返回失败状态。`)
            return { success: false, error: '更新操作返回失败状态' }
        }
    } catch (error) {
        // 这个 catch 会捕获 updateBangumi 抛出的错误
        console.error(`同步保存番剧数据 (ID: ${data.id}) 到数据库时出错:`, error)
        return { success: false, error: `数据库更新失败: ${error.message}` }
    }
}

// 新增：添加单个番剧数据
// !! 注意：此函数现在是同步的 !!
function addBangumiData(data) {
    // if (!data || data.id === null || data.id === undefined) {
    //     console.error('添加失败：缺少番剧 ID。')
    //     return { success: false, error: '缺少番剧 ID' }
    // }
    try {
        // console.log(`准备同步添加新番剧 (ID: ${data.id})...`)
        // 调用 database.js 中的插入函数
        insertBangumi(data)
        // insertBangumi 成功时返回 { success: true }
        console.log(`同步添加新番剧 (ID: ${data.id}) 成功。`)
        return { success: true } // 只需返回成功状态
    } catch (error) {
        // 这个 catch 会捕获 insertBangumi 抛出的错误 (例如 UNIQUE 约束)
        console.error(`同步添加新番剧 (ID: ${data.id}) 到数据库时出错:`, error)
        return { success: false, error: `数据库添加失败: ${error.message}` }
    }
}

module.exports = {
    readBangumiData,
    downloadBangumiData,
    saveBangumiData,
    addBangumiData
} 