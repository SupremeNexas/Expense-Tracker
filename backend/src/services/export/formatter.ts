/**
 * Converts tabular arrays to a standard, properly escaped CSV string
 */
export function toCSV(headers: string[], rows: any[][]): string {
  const headerRow = headers.join(',');
  const dataRows = rows.map(row => 
    row.map(val => {
      const cell = val === null || val === undefined ? '' : String(val);
      return `"${cell.replace(/"/g, '""')}"`;
    }).join(',')
  );
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Converts data payloads to standard formatted JSON
 */
export function toJSON(data: any): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Formats a clean HTML dashboard table that is fully parsed as a spreadsheet by Excel
 * and renderable in PDF prints.
 */
export function toHTMLTable(title: string, headers: string[], rows: any[][]): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; color: #111; margin: 40px; }
    h1 { font-size: 20px; margin-bottom: 20px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; font-size: 12px; }
    th { background-color: #f9fafb; font-weight: 600; color: #4b5563; }
    tr:nth-child(even) { background-color: #f9fafb; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <table>
    <thead>
      <tr>
        ${headers.map(h => `<th>${h}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${rows.map(row => `
        <tr>
          ${row.map(cell => `<td>${cell !== null && cell !== undefined ? cell : ''}</td>`).join('')}
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>
  `;
}
