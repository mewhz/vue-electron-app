const path = require('path');
// 尝试导入 node:sqlite 并获取 DatabaseSync
let DatabaseSync;
try {
    const sqlite = require('node:sqlite');
    DatabaseSync = sqlite.DatabaseSync; // 获取同步类
    if (!DatabaseSync) {
        throw new Error('在 node:sqlite 模块中找不到 DatabaseSync 类。请检查 Node.js 版本。');
    }
} catch (e) {
    console.error("加载 'node:sqlite' 或查找 DatabaseSync 失败。此模块至少需要 Node.js v22.5.0。", e);
    throw new Error("加载 'node:sqlite' 失败。请检查 Node.js 版本兼容性。", { cause: e });
}

const dbPath = path.join(__dirname, '../assets/bangumi.db');
let dbInstance = null;

/**
 * 获取数据库实例（单例模式）。
 * 如果实例不存在，则同步打开/创建数据库并确保表结构。
 * @returns {DatabaseSync} 数据库实例
 * @throws {Error} 如果数据库打开或初始化失败
 */
function getDb() {
    if (!dbInstance) {
        try {
            console.log(`尝试同步打开/创建数据库: ${dbPath}`);
            dbInstance = new DatabaseSync(dbPath);
            console.log('数据库连接成功 (同步)。');

            // 同步确保表结构（修改 schema）
            console.log('开始同步确保番剧表结构 (使用 id 作为主键)...');
            dbInstance.exec(`
                CREATE TABLE IF NOT EXISTS bangumi (
                    id INTEGER PRIMARY KEY,  -- 使用 API 返回的 ID 作为主键
                    name TEXT,               -- 名称不再要求唯一
                    nameCN TEXT,
                    summary TEXT,
                    cover TEXT,
                    url TEXT,
                    labels TEXT
                );
            `);
            console.log('番剧表结构同步确保完成。');

        } catch (error) {
            console.error('同步打开或初始化数据库失败:', error);
            dbInstance = null;
            throw error;
        }
    }
    return dbInstance;
}

/**
 * 关闭数据库连接（如果已打开）。
 */
function closeDb() {
    if (dbInstance) {
        try {
            console.log('尝试关闭数据库连接...');
            dbInstance.close();
            dbInstance = null;
            console.log('数据库连接已关闭。');
        } catch (error) {
            console.error('关闭数据库时出错:', error);
        }
    }
}

// --- CRUD 函数 --- //

/**
 * 从数据库获取所有番剧数据。
 * !! 同步操作，可能阻塞主进程 !!
 * @returns {Array<Object>} 番剧数据列表，包含解析后的 labels
 * @throws {Error} 如果查询失败
 */
function getAllBangumi() {
    console.log('尝试同步获取所有番剧数据...');
    try {
        const db = getDb();
        const stmt = db.prepare('SELECT * FROM bangumi');
        const rows = stmt.all();
        console.log(`同步查询到 ${rows.length} 条番剧数据。`);
        const data = rows.map(row => ({
            ...row,
            labels: JSON.parse(row.labels || '[]')
        }));
        return data;
    } catch (error) {
        console.error('同步获取所有番剧数据失败:', error);
        throw error;
    }
}

/**
 * 清空 bangumi 表中的所有数据。
 * !! 同步操作，可能阻塞主进程 !!
 * @throws {Error} 如果删除操作失败
 */
function deleteAllBangumi() {
    console.log('尝试同步删除所有番剧数据...');
    try {
        const db = getDb();
        db.exec('DELETE FROM bangumi');
        // 可以选择执行 VACUUM 来收缩数据库文件，但可能耗时
        // db.exec('VACUUM');
        console.log('已同步删除所有番剧数据。');
    } catch (error) {
        console.error('同步删除所有番剧数据失败:', error);
        throw error;
    }
}

/**
 * 批量插入番剧数据。
 * 使用事务处理。
 * !! 同步操作，可能阻塞主进程 !!
 * @param {Array<Object>} items - 要插入的番剧对象数组 (应包含 id)
 * @returns {{success: boolean, errors: number}} 操作结果
 * @throws {Error} 如果事务执行失败
 */
function insertBangumiBatch(items) {
    if (!items || items.length === 0) {
        console.log('没有番剧数据需要插入。');
        return { success: true, errors: 0 };
    }
    console.log(`尝试同步批量插入 ${items.length} 条番剧数据...`);
    const db = getDb();
    let errors = 0;
    db.exec('BEGIN TRANSACTION');
    try {
        const stmt = db.prepare(
            // 插入时需要指定 id
            `INSERT INTO bangumi (name, nameCN, summary, cover, url, labels)
             VALUES (?, ?, ?, ?, ?, ?)`
        );
        for (const item of items) {
            // 确保 item 包含 id
            // if (item.id === null || item.id === undefined) {
            //     console.warn(`跳过插入：番剧 '${item.name}' 缺少 id。`);
            //     errors++;
            //     continue;
            // }
            try {
                stmt.run(
                    // item.id, // 插入 id
                    item.name == null ? '' : item.name,
                    item.nameCN == null ? '' : item.nameCN,
                    item.summary == null ? '' : item.summary,
                    item.cover == null ? '' : item.cover,
                    item.url == null ? '' : item.url,
                    JSON.stringify(item.labels || [])
                );
            } catch (runError) {
                console.error(item);
                console.error(`同步插入番剧 (id: ${item.id}, name: '${item.name}') 失败:`, runError);
                errors++;
            }
        }

        if (errors === 0) {
            db.exec('COMMIT');
            console.log(`成功同步插入 ${items.length} 条番剧数据。`);
            return { success: true, errors: 0 };
        } else {
            db.exec('ROLLBACK');
            console.warn(`因 ${errors} 个错误，同步批量插入操作已回滚。`);
            return { success: false, errors: errors };
        }
    } catch (txError) {
        console.error('同步事务执行失败 (批量插入番剧):', txError);
        try { db.exec('ROLLBACK'); } catch (rbError) { console.error('事务失败后回滚也失败:', rbError); }
        throw txError;
    }
}

/**
 * 更新单个番剧数据 (根据 ID)。
 * !! 同步操作，可能阻塞主进程 !!
 * @param {Object} item - 包含更新信息的番剧对象，必须有 id 属性
 * @returns {{success: boolean, changes: number}} 操作结果
 * @throws {Error} 如果更新操作失败
 */
function updateBangumi(item) {
    if (!item || item.id === null || item.id === undefined) {
        throw new Error('更新番剧失败：必须提供 id 属性。');
    }
    console.log(`尝试同步更新番剧 (ID: ${item.id})...`);
    try {
        const db = getDb();
        const stmt = db.prepare(
            `UPDATE bangumi
             SET name = ?, nameCN = ?, summary = ?, cover = ?, url = ?, labels = ?
             WHERE id = ?` // 使用 id 作为条件
        );
        const info = stmt.run(
            item.name, // 更新 name
            item.nameCN,
            item.summary,
            item.cover,
            item.url,
            JSON.stringify(item.labels || []),
            item.id // 条件 id
        );
        console.log(`同步更新番剧 (ID: ${item.id}) 操作完成，影响行数: ${info.changes}`);
        return { success: true, changes: info.changes };
    } catch (error) {
        console.error(`同步更新番剧 (ID: ${item.id}) 失败:`, error);
        throw error;
    }
}

/**
 * 插入单个新番剧数据 (根据 ID)。
 * !! 同步操作，可能阻塞主进程 !!
 * @param {Object} item - 要插入的新番剧对象 (必须包含 id)
 * @returns {{success: boolean}} 操作结果
 * @throws {Error} 如果插入操作失败 (例如 id 已存在)
 */
function insertBangumi(item) {
    // if (!item || item.id === null || item.id === undefined) {
    //     throw new Error('插入新番剧失败：必须提供 id 属性。');
    // }
    console.log(`尝试同步插入新番剧 (ID: ${item.id})...`);
    try {
        const db = getDb();
        const stmt = db.prepare(
            `INSERT INTO bangumi (name, nameCN, summary, cover, url, labels)
             VALUES (?, ?, ?, ?, ?, ?)`
        );
        const info = stmt.run(
            // item.id,
            item.name == null ? '' : item.name,
            item.nameCN == null ? '' : item.nameCN,
            item.summary == null ? '' : item.summary,
            item.cover == null ? '' : item.cover,
            item.url == null ? '' : item.url,
            JSON.stringify(item.labels || [])
        );
        // info.changes 应该为 1，info.lastInsertRowid 在这种情况下通常等于插入的 id
        console.log(`同步插入新番剧 (ID: ${item.id}) 成功。`);
        // 返回 success 即可，因为 ID 是传入的
        return { success: true };
    } catch (error) {
        console.error(`同步插入新番剧 (ID: ${item.id}) 失败:`, error);
        if (error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY' || error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
             throw new Error(`插入失败：番剧 ID '${item.id}' 已存在。`);
        }
        throw error;
    }
}

module.exports = {
    getDb,
    closeDb,
    getAllBangumi,
    deleteAllBangumi,
    insertBangumiBatch,
    updateBangumi,
    insertBangumi,
}; 