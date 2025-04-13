const fs = require('fs')
const path = require('path')

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

function downloadBangumiData() {

    console.log("download");

}

module.exports = {
    readBangumiData,
    downloadBangumiData
} 