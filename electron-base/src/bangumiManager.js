const fs = require('fs')
const path = require('path')
const axios = require('axios')

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

        // 生成带有时间戳的文件名
        // const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        // const fileName = `bangumi-data-${timestamp}.json`;
        const fileName = 'bangumi-other.json';
        const filePath = path.join(__dirname, '../assets', fileName);

        // 确保 assets 目录存在
        const assetsDir = path.join(__dirname, '../assets');
        if (!fs.existsSync(assetsDir)) {
            fs.mkdirSync(assetsDir, { recursive: true });
        }

        while (pageNumber <= totalPages) {

            console.log(`开始下载第 ${pageNumber} 页数据...`);

            const response = await axios.get(``, {
                params: {
                    uid: 872987,
                    collectionType: 0,
                    pageSize: 15,
                    pageNumber: pageNumber,
                    subjectType: 1
                },
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            pageNumber += 1;

            if (response.data.code === 200) {

                totalPages = response.data.data.totalPages;

                const list = response.data.data.list;

                result.push(...list);

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

module.exports = {
    readBangumiData,
    downloadBangumiData
} 