const db = require("../db/database");

function getAllFolders(userId) {
    return db
        .prepare(`
            SELECT * 
            FROM folders
            WHERE user_id = ?`)
        .all(userId);
}

function getRootFolders(userId) {
    return db
        .prepare(`
            SELECT * 
            FROM folders 
            WHERE parent_id IS NULL 
            AND user_id = ?`)
        .all(userId);
}

function getFolderById(folderId, userId) {
    return db
        .prepare(`
            SELECT * 
            FROM folders 
            WHERE id = ?
            AND user_id = ?
        `)
        .get(folderId, userId);
}

function getChildFolders(folderId, userId) {
    return db
        .prepare(`
            SELECT * 
            FROM folders 
            WHERE parent_id = ?
            AND user_id = ?
        `)
        .all(folderId, userId);
}

function createFolder(folderData, userId) {
    const {parentId, name, date, overallMemo} = folderData;
    if (parentId !== null) {
        const parentFolder = db.prepare(`
            SELECT id
            FROM folders
            WHERE id = ?
            AND user_id = ?
        `).get(parentId, userId);
        if (!parentFolder) {
            throw new Error("Invalid parent folder");
        }
    }
    const dbResult = db.prepare (`
        INSERT INTO folders (user_id, parent_id, name, date, overall_memo)
        VALUES(?,?,?,?,?)
    `).run(userId,parentId,name,date,overallMemo??null);
    return Number(dbResult.lastInsertRowid);
}

function updateFolder(folderId, folderData, userId) {
    const updates = [];
    const values = [];
    const {name,date,overallMemo} = folderData;

    const folder = db.prepare(`
        SELECT id
        FROM folders
        WHERE id = ?
        AND user_id = ?
    `).get(folderId, userId);
    if (!folder) {
        throw new Error("Invalid folder");
    }

    if (name !== undefined) {
        updates.push("name = ?");
        values.push(name);
    }

    if (date !== undefined) {
        updates.push("date = ?");
        values.push(date);
    }

    if (overallMemo !== undefined) {
        updates.push("overall_memo = ?");
        values.push(overallMemo);
    }

    if (updates.length === 0) {
        return null;
    }

    return db.prepare(`
            UPDATE folders
            SET ${updates.join(", ")}
            WHERE id = ?
            AND user_id = ?
        `).run(...values, folderId, userId);
}

function deleteFolder(folderId, userId) {
    return db.prepare(`
        DELETE FROM folders
        WHERE id = ?
        AND user_id = ?
    `).run(folderId, userId);
}

module.exports = {
    getAllFolders,
    getRootFolders,
    getFolderById,
    getChildFolders,
    createFolder,
    updateFolder,
    deleteFolder
};