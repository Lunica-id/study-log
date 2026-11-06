const db = require("../db/database");

function getItemById(itemId) {
    return db
        .prepare(`SELECT * FROM items WHERE id = ?`)
        .get(itemId);
}

function getItemByFolderId(folderId) {
    return db
        .prepare(`SELECT * FROM items WHERE folder_id = ?`)
        .all(folderId);
}

function createItem(itemData) {
    const {
        folderId,
        type,
        source,
        isbn,
        title,
        date,
        memo
    } = itemData;
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

function updateItem(itemId, itemData) {
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
    `).run(...values, itemId);
}

function deleteItem(itemId) {
    return db.prepare(`
        DELETE FROM items
        WHERE id = ?
    `).run(itemId);
}

module.exports = {
    getItemById,
    getItemByFolderId,
    createItem,
    updateItem,
    deleteItem
}