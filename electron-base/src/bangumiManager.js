const fs = require('fs')
const path = require('path')
const axios = require('axios')
const { ipcMain, BrowserWindow } = require('electron')

function readBangumiData() {
    try {
        const jsonPath = path.join(__dirname, '../assets/bangumi-other.json')
        const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
        return { success: true, data }
    } catch (error) {
        console.error('Error reading bangumi data:', error)
        throw { success: false, error: error.message };
    }
}

async function downloadBangumiData() {
    try {
        let pageNumber = 1;
        let totalPages = 1;
        let result = [];
        let totalItems = 0;
        let downloadedItems = 0;


        const fileName = 'bangumi-other.json';
        const filePath = path.join(__dirname, '../assets', fileName);

        // 确保 assets 目录存在
        const assetsDir = path.join(__dirname, '../assets');
        if (!fs.existsSync(assetsDir)) {
            fs.mkdirSync(assetsDir, { recursive: true });
        }

        // 获取主窗口
        const mainWindow = BrowserWindow.getFocusedWindow();
        if (!mainWindow) {
            console.error('No focused window found');
            return { success: false, error: 'No focused window' };
        }

        // 先获取总页数
        const firstResponse = await axios.get(url, {
            params: {
                // uid: 872987,
                collectionType: 0,
                pageSize: 15,
                pageNumber: 1,
                subjectType: 1
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (firstResponse.data.code === 200) {
            totalPages = firstResponse.data.data.totalPages;
            const firstList = firstResponse.data.data.list;
            result.push(...firstList);
            totalItems = totalPages * firstList.length;
            downloadedItems = firstList.length;
            
            // 发送第一个进度
            const progress = Math.round((downloadedItems / totalItems) * 100);
            mainWindow.webContents.send('download-progress', progress);
        }

        // 继续下载剩余页面
        while (pageNumber < totalPages) {
            pageNumber += 1;
            console.log(`开始下载第 ${pageNumber} 页数据...`);

            const response = await axios.get(url, {
                params: {
                    // uid: 872987,
                    collectionType: 0,
                    pageSize: 15,
                    pageNumber: pageNumber,
                    subjectType: 1
                },
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            if (response.data.code === 200) {
                const list = response.data.data.list;
                result.push(...list);
                downloadedItems += list.length;
                
                // 更新进度
                const progress = Math.round((downloadedItems / totalItems) * 100);
                mainWindow.webContents.send('download-progress', progress);

                console.log(`output->result`,result)
            }
        }

        // 写入数据到文件
        fs.writeFileSync(filePath, JSON.stringify(result, null, 2));
        return { success: true };
    } catch (error) {
        console.error('Error reading bangumi data:', error)
        throw { success: false, error: error.message };
    }
}

function saveBangumiData(data) {
    try {
        const jsonPath = path.join(__dirname, '../assets/bangumi-other.json')
        fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2))
        return { success: true }
    } catch (error) {
        console.error('Error saving bangumi data:', error)
        throw { success: false, error: error.message }
    }
}

module.exports = {
    readBangumiData,
    downloadBangumiData,
    saveBangumiData
} 