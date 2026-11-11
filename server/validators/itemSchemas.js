const {datePattern, isValidDate, isValidHttpUrl, isValidYouTubeId, normaliseIsbn, isValidIsbn} = require("./common");
const {z} = require('zod');

const itemPostSchema = z.object({
    folderId: z.number(),
    type: z.enum(["link","youtube","book","document"]),
    source: z.preprocess(value=>value === "" ? null : value, z.string().nullable().optional()),
    isbn: z.preprocess(normaliseIsbn, z.string().nullable().optional()),
    title: z.string().trim().min(1),
    date: z.string().regex(datePattern).refine(isValidDate, {
        message:"Invalid date"
    }),
    memo: z.string().nullable().optional()
}).superRefine(validateItemData);
const itemPatchSchema = z.object({
    type: z.enum(["link", "youtube", "book", "document"]),
    source: z.preprocess(value=>value === "" ? null : value, z.string().nullable().optional()),
    isbn: z.preprocess(normaliseIsbn, z.string().nullable().optional()),
    title: z.string().trim().min(1).optional(),
    date: z.string().regex(datePattern).refine(isValidDate, {
        message: "Invalid date"
    }).optional(),
    memo: z.string().nullable().optional()
}).superRefine(validateItemData);

function validateItemData(data, ctx) {
    if (data.type === "youtube") {
        if (data.isbn !== null && data.isbn !== undefined) {
            ctx.addIssue({
                code: "custom",
                path: ["isbn"],
                message: "Unnecessary info"
            })
        }
        if (!data.source || !isValidYouTubeId(data.source)) {
            ctx.addIssue({
                code: "custom",
                path: ["source"],
                message: "Invalid YouTube ID"
            })
        }
    } else if (data.type === "link") {
        if (data.isbn !== null && data.isbn !== undefined) {
            ctx.addIssue({
                code: "custom",
                path: ["isbn"],
                message: "Unnecessary info"
            })
        }
        if (!data.source || !isValidHttpUrl(data.source)) {
            ctx.addIssue({
                code: "custom",
                path: ["source"],
                message: "Invalid URL"
            })
        }
    } else if (data.type === "book") {
        if (data.source === null && data.source === undefined) {
            if (!data.isbn || !isValidIsbn(data.isbn)) {
                ctx.addIssue({
                    code: "custom",
                    path: ["isbn"],
                    message: "Invalid ISBN"
                })
            }
        } else {
            ctx.addIssue({
                code: "custom",
                path: ["source"],
                message: "Unnecessary info"
            })
        }
    }
}

module.exports = {
    itemPostSchema,
    itemPatchSchema
}