const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// 用户数据目录中的配置文件路径
const configFilePath = path.join(__dirname, '../assets/config.json');

let loadedConfig = null;

/**
 * 加载应用程序配置。
 * 如果用户配置文件不存在，则从默认模板复制。
 * 同步执行，应在应用启动早期调用。
 * @returns {Object} 加载的配置对象
 * @throws {Error} 如果读取或解析配置失败
 */
function loadConfig() {
    if (loadedConfig) {
        return loadedConfig;
    }

    console.log(`检查配置文件: ${configFilePath}`);

    try {
        // 检查用户配置文件是否存在
        if (!fs.existsSync(configFilePath)) {
            console.log('用户配置文件不存在，尝试从默认模板复制...');
        }

        // 读取并解析配置文件
        console.log(`读取配置文件: ${configFilePath}`);
        const configFileContent = fs.readFileSync(configFilePath, 'utf8');
        loadedConfig = JSON.parse(configFileContent);
        console.log('配置文件加载并解析成功。');
        return loadedConfig;

    } catch (error) {
        console.error(`加载或解析配置文件 (${configFilePath}) 失败:`, error);
        // 清除可能已部分加载的配置
        loadedConfig = null;
        // 抛出错误，让应用启动过程知道配置加载失败
        throw new Error(`加载配置文件失败`, { cause: error });
    }
}

/**
 * 获取已加载的配置对象或特定键的值。
 * @param {string} [key] - 可选，要获取的配置键名
 * @returns {Object | any} 如果提供了 key，则返回对应的值；否则返回整个配置对象。
 * @throws {Error} 如果配置尚未加载
 */
function getConfig(key) {
    if (!loadedConfig) {
        // 理论上 loadConfig 应该先被调用，如果这里为 null，说明启动时加载失败了
        // 可以尝试再次加载，或者直接抛出错误
        console.warn('尝试获取配置，但配置尚未加载。尝试重新加载...');
        loadConfig(); // 再次尝试加载
        if (!loadedConfig) {
            throw new Error('配置尚未成功加载，无法获取。');
        }
    }
    if (key) {
        return loadedConfig[key];
    }
    return loadedConfig;
}

module.exports = {
    loadConfig,
    getConfig,
    getConfigFilePath: () => configFilePath // 导出获取路径的函数，方便提示用户
}; 