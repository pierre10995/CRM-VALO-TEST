export function exportCsv(data, columns, filename) {
  // BOM for Excel UTF-8
  const BOM = "\uFEFF";
  const header = columns.map(c => c.label).join(";");
  const rows = data.map(row =>
    columns.map(c => {
      const val = typeof c.format === "function" ? c.format(row) : (row[c.key] ?? "");
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }).join(";")
  );
  const csv = BOM + header + "\n" + rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
