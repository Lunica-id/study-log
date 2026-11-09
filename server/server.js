const express = require("express");
const cors = require("cors");
const path = require("path");

const db = require("./db/database");
const initDatabase = require("./db/init");
const folderRoutes = require("./routes/folderRoutes");
const itemRoutes = require("./routes/itemRoutes");
const backupRoutes = require("./routes/backupRoutes");

const app = express();
const PORT = 3003;

const frontendPath = path.join(__dirname, "..", "app");

initDatabase(db);

app.use(express.static(frontendPath));
app.use(cors());
app.use(express.json());

app.use("/api/folders", folderRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/backup", backupRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
