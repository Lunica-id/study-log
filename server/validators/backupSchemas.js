const {datePattern, isValidDate} = require("./common");
const {z} = require('zod');

const backupSchema = z.object({
    version: z.literal(1),
    exportedAt: z.string(),
    folders: z.array(
        z.object({
            id: z.number().int().positive(),
            parent_id: z.number().int().positive().nullable(),
            name: z.string().min(1),
            date: z.string().regex(datePattern),
            overall_memo: z.string().nullable()
        })
    ),
    items: z.array(
        z.object({
            id: z.number().int().positive(),
            folder_id: z.number().int().positive(),
            type: z.enum(["link", "youtube", "book", "document"]),
            source: z.string().nullable(),
            isbn: z.string().nullable(),
            title: z.string().min(1),
            date: z.string().regex(datePattern),
            memo: z.string().nullable()
        })
    )
});

module.exports = {
    backupSchema
};