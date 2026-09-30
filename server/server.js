const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const {z} = require('zod');

const app = express();
const PORT = 3003;

const db = new Database("study-log.db");

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const folderPostSchema = z.object({
    parentId: z.number().nullable(),
    name: z.string().trim().min(1),
    date: z.string().regex(datePattern).refine(isValidDate, {
        message: "Invalid date"
    }),
    overallMemo: z.string().nullable().optional()
});

db.pragma("foreign_keys = ON"); //sqlite3パッケージの場合コードが異なる

db.exec(`
    CREATE TABLE IF NOT EXISTS folders (
        id INTEGER PRIMARY KEY,
        parent_id INTEGER,
        name TEXT NOT NULL,
        date TEXT NOT NULL,
        overall_memo TEXT,

        FOREIGN KEY(parent_id)
            REFERENCES folders(id)
            ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY,
        folder_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        source TEXT,
        isbn TEXT,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        memo TEXT,

        FOREIGN KEY (folder_id)
            REFERENCES folders(id)
            ON DELETE CASCADE
    );
`)

app.use(cors());
app.use(express.json());

app.get("/api/folders", (req, res) => {
    const folders = db
        .prepare(`SELECT * FROM folders`)
        .all();

    res.json(folders);
});

app.get("/api/folders/root", (req, res) => {
    const folders = db
        .prepare(`SELECT * FROM folders WHERE parent_id IS NULL`)
        .all();

    res.json(folders);
})

app.get("/api/folders/:id", (req, res) => {
    const folderId = Number(req.params.id);

    const folder = db
        .prepare(`
            SELECT * FROM folders
            WHERE id = ?
        `).get(folderId);
    
    if (!folder) {
        return res.status(404).json({
            error: "Folder not found"
        });
    }

    res.json(folder);
})

app.get("/api/folders/:id/children", (req, res) => {
    const folderId = Number(req.params.id);

    const folders = db
        .prepare(`
            SELECT * FROM folders
            WHERE parent_id = ?
        `).all(folderId);

    res.json(folders);
})

app.get("/api/items/:id", (req, res) => {
    const itemId = Number(req.params.id);

    const item = db
        .prepare(`
            SELECT * FROM items
            WHERE id = ?
        `).get(itemId);

    res.json(item);
})

app.get("/api/items/:id/children", (req, res) => {
    const folderId = Number(req.params.id);

    const items = db
        .prepare(`
            SELECT * FROM items
            WHERE folder_id = ?
        `).all(folderId);

    res.json(items);
})

app.post("/api/folders", (req, res) => {
    const result = folderPostSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            message: "Invalid input data",
            errors: result.error.issues
        });
    }

    const {parentId, name, date, overallMemo} = result.data;
    console.log("result");
    console.log(result);

    try {
        const dbResult = db.prepare (`
            INSERT INTO folders (parent_id, name, date, overall_memo)
            VALUES(?,?,?,?)
        `).run(parentId,name,date,overallMemo);

        res.status(201).json({
            message: "Folder created",
            id: Number(dbResult.lastInsertRowid)
        });
    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: "failed to create folder"
        });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

function isValidDate(dateString) {
    if (!datePattern.test(dateString)) {
        return false;
    }

    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month-1, day);

    return (date.getFullYear() === year && date.getMonth() === month-1 && date.getDate() === day);
}