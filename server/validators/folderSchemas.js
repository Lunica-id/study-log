const {datePattern, isValidDate} = require("./common");
const {z} = require('zod');

const folderPostSchema = z.object({
    parentId: z.number().nullable(),
    name: z.string().trim().min(1),
    date: z.string().regex(datePattern).refine(isValidDate, {
        message: "Invalid date"
    }),
    overallMemo: z.string().nullable().optional()
});
const folderPatchSchema = z.object({
    name: z.string().trim().min(1).optional(),
    date: z.string().regex(datePattern).refine(isValidDate, {
        message: "Invalid date"
    }).optional(),
    overallMemo: z.string().nullable().optional()
});

module.exports = {
    folderPostSchema,
    folderPatchSchema
};