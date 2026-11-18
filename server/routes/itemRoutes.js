const express = require("express");
const router = express.Router();

const itemRepository = require("../repositories/itemRepository");
const userId = 1;

const {
    itemPostSchema,
    itemPatchSchema
} = require("../validators/itemSchemas");

router.get("/:id", (req, res) => {
    const itemId = Number(req.params.id);
    const items = itemRepository.getItemById(itemId, userId);
    res.json(items);
})

router.get("/:id/children", (req, res) => {
    const folderId = Number(req.params.id);
    const items = itemRepository.getItemByFolderId(folderId, userId);
    res.json(items);
})

router.post("/", (req,res) => {
    const result = itemPostSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            message: "Invalid input data",
            errors: result.error.issues
        });
    }

    try {
        const newItemId = itemRepository.createItem(result.data, userId);
        res.status(201).json({
            message: "Item created",
            id: newItemId
        });
    } catch(err) {
        console.error(err);
        res.status(500).json({
            error: "Failed to create item"
        })
    }
})

router.patch("/:id", (req,res) => {
    const itemId = Number(req.params.id);
    const result = itemPatchSchema.safeParse(req.body);

    if(!result.success) {
        return res.status(400).json({
            message: "Invalid input data",
            errors: result.error.issues
        });
    }

    try {
        const dbResult = itemRepository.updateItem(itemId,result.data,userId);
        
        if (dbResult == null) {
            return res.status(400).json({
                error: "No fields to update"
            });
        }
        if(dbResult.changes === 0) {
            return res.status(404).json({
                error: "Item not found"
            });
        }
        res.json({
            message:"Item updated"
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Failed to update item"
        });
    }
})

router.delete("/:id", (req,res) => {
    const itemId = Number(req.params.id);

    try {
        const result = itemRepository.deleteItem(itemId, userId);
        if(result.changes == 0) {
            return res.status(404).json({
                error: "Item not found"
            });
        }
        res.json({
            message: "Item deleted"
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Failed to delete item"
        });
    }
})

module.exports = router;