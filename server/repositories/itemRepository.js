const db = require("../db/database");

function getItemById(itemId, userId) {
    return db
        .prepare(`
            SELECT items.* 
            FROM items 
            JOIN folders
                ON items.folder_id = folders.id
            WHERE items.id = ?
            AND folders.user_id = ?
        `).get(itemId, userId);
}

function getItemByFolderId(folderId, userId) {
    return db
        .prepare(`
            SELECT items.* 
            FROM items 
            JOIN folders
                ON items.folder_id = folders.id
            WHERE items.folder_id = ?
            AND folders.user_id = ?
        `).all(folderId, userId);
}

function createItem(itemData, userId) {
    const {
        folderId,
        type,
        source,
        isbn,
        title,
        date,
        memo
    } = itemData;
    const folder = db.prepare(`
        SELECT id
        FROM folders
        WHERE id = ?
        AND user_id = ?
    `).get(folderId, userId);
    if (!folder) {
        throw new Error("Invalid folder");
    }
    const dbResult = db.prepare(`
        INSERT INTO items (
            folder_id,
            type,
            source,
            isbn,
            title,
            date,
            memo
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
        folderId,
        type,
        source ?? null,
        isbn ?? null,
        title,
        date,
        memo ?? null
    );
    return Number(dbResult.lastInsertRowid);
}

function updateItem(itemId, itemData, userId) {
    const updates = [];
    const values = [];
    const {
        type,
        source,
        isbn,
        title,
        date,
        memo
    } = itemData;
    const parentFolder = db.prepare(`
        SELECT items.id
        FROM items 
        JOIN folders
            ON items.folder_id = folders.id
        WHERE items.id = ?
        AND folders.user_id = ?
    `).get(itemId, userId);
    if (!parentFolder) {
        throw new Error("Invalid parent folder");
    }
    if (type !== undefined) {
        updates.push("type = ?");
        values.push(type);
    }
    if (source !== undefined) {
        updates.push("source = ?");
        values.push(source);
    }
    if (isbn !== undefined) {
        updates.push("isbn = ?");
        values.push(isbn);
    }
    if (title !== undefined) {
        updates.push("title = ?");
        values.push(title);
    }
    if (date !== undefined) {
        updates.push("date = ?");
        values.push(date);
    }
    if (memo !== undefined) {
        updates.push("memo = ?");
        values.push(memo);
    }

    if (updates.length === 0) {
        return null;
    }

    return db.prepare(`
        UPDATE items
        SET ${updates.join(", ")}
        WHERE id = ?
        AND EXISTS (
            SELECT 1
            FROM folders
            WHERE folders.id = items.folder_id
            AND folders.user_id = ?
        )
    `).run(...values, itemId, userId);
}

function deleteItem(itemId, userId) {
    return db.prepare(`
        DELETE FROM items
        WHERE id = ?
        AND EXISTS (
            SELECT 1
            FROM folders
            WHERE folders.id = items.folder_id
            AND folders.user_id = ?
        )
    `).run(itemId, userId);
}

module.exports = {
    getItemById,
    getItemByFolderId,
    createItem,
    updateItem,
    deleteItem
}