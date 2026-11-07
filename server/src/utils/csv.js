// Builds a CSV string safely.
// 1. Wraps cells containing commas, quotes or newlines in quotes.
// 2. Prefixes cells starting with = + - @ so Excel won't run them as
//    formulas ("CSV injection"), since anyone can type into the contact form.
function escapeCell(value) {
  let text = value == null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  if (/[",\r\n]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function toCsv(columns, rows) {
  const header = columns.map((c) => escapeCell(c.label)).join(',');
  const lines = rows.map((row) => columns.map((c) => escapeCell(c.value(row))).join(','));
  return [header, ...lines].join('\r\n');
}
