// Validates req.body against a zod schema. On failure, returns 400 with
// one message per field so the form can show errors next to each input.
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    const fields = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] ?? 'form';
      if (!fields[key]) fields[key] = issue.message;
    }
    return res.status(400).json({ error: 'Please fix the highlighted fields.', fields });
  }
  req.body = result.data;
  next();
};
