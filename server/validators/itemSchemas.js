const {datePattern, isValidDate} = require("./common");
const {z} = require('zod');

const itemPostSchema = z.object({
    folderId: z.number(),
    type: z.enum(["link","youtube","book","document"]),
    source: z.string().nullable().optional(),
    isbn: z.string().nullable().optional(),
    title: z.string().trim().min(1),
    date: z.string().regex(datePattern).refine(isValidDate, {
        message:"Invalid date"
    }),
    memo: z.string().nullable().optional()
});
const itemPatchSchema = z.object({
    type: z.enum(["link", "youtube", "book", "document"]),
    source: z.string().nullable().optional(),
    isbn: z.string().nullable().optional(),
    title: z.string().trim().min(1),
    date: z.string().regex(datePattern).refine(isValidDate, {
        message: "Invalid date"
    }),
    memo: z.string().nullable().optional()
});

module.exports = {
    itemPostSchema,
    itemPatchSchema
}