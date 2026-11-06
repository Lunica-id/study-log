const db = require("../db/database");

function getAllFolders() {
    return db
        .prepare(`SELECT * FROM folders`)
        .all();
}

function getRootFolders() {
    return db
        .prepare(`SELECT * FROM folders WHERE parent_id IS NULL`)
        .all();
}

function getFolderById(folderId) {
    return db
        .prepare(`SELECT * FROM folders WHERE id = ?`)
        .get(folderId);
}

function getChildFolders(folderId) {
    return db
        .prepare(`SELECT * FROM folders WHERE parent_id = ?`)
        .all(folderId);
}

function createFolder(folderData) {
    const {parentId, name, date, overallMemo} = folderData;
    const dbResult = db.prepare (`
        INSERT INTO folders (parent_id, name, date, overall_memo)
        VALUES(?,?,?,?)
    `).run(parentId,name,date,overallMemo??null);
    return Number(dbResult.lastInsertRowid);
}

function updateFolder(folderId, folderData) {
    const updates = [];
    const values = [];
    const {name,date,overallMemo} = folderData;

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
        `).run(...values, folderId);
}

function deleteFolder(folderId) {
    return db.prepare(`
        DELETE FROM folders
        WHERE id = ?
    `).run(folderId);
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