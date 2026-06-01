function isRootValue(cell: string): boolean {
  const clean = cell.replace(/[\s$]/g, "");
  // Standard values for roots or points of interest in Vietnamese sign tables:
  // "0" -> root value
  // "||" -> undefined/double vertical line
  return clean === "0" || clean === "||" || clean === "dnd" || clean === "khd";
}

function equalizeTableColumns(lines: string[]): string {
  const parseRow = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return null;
    return trimmed
      .slice(1, -1)
      .split("|")
      .map(c => c.trim());
  };

  const rows: string[][] = [];
  for (const line of lines) {
    const r = parseRow(line);
    if (r) rows.push(r);
  }

  if (rows.length < 2) return lines.join("\n");

  // Find max columns
  let maxCols = 0;
  for (const r of rows) {
    if (r.length > maxCols) maxCols = r.length;
  }

  const newLines: string[] = [];
  // Reconstruct rows
  rows.forEach((row, idx) => {
    // If it's the divider row
    if (idx === 1 && lines[idx].includes("-")) {
      const newDiv = "| " + Array(maxCols).fill("---").join(" | ") + " |";
      newLines.push(newDiv);
      return;
    }

    while (row.length < maxCols) {
      row.push("");
    }
    newLines.push("| " + row.join(" | ") + " |");
  });

  return newLines.join("\n");
}

export function alignSignTable(tableMarkdown: string): string {
  // Split the table into lines
  const lines = tableMarkdown.trim().split("\n");
  if (lines.length < 3) return tableMarkdown;

  // Parse rows
  const parseRow = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return null;
    return trimmed
      .slice(1, -1)
      .split("|")
      .map(c => c.trim());
  };

  const headerCells = parseRow(lines[0]);
  const dividerCells = parseRow(lines[1]);
  if (!headerCells || !dividerCells) return tableMarkdown;

  // Check if it is a sign table (header cell 0 is 'x')
  const cleanHeader0 = headerCells[0]?.replace(/[\s$*]/g, "").toLowerCase();
  if (cleanHeader0 !== "x") {
    // Not a sign table, but we should still equalize columns to avoid remark-gfm truncation
    return equalizeTableColumns(lines);
  }

  // Find data rows
  const dataRows: string[][] = [];
  for (let i = 2; i < lines.length; i++) {
    const r = parseRow(lines[i]);
    if (r) dataRows.push(r);
  }
  if (dataRows.length === 0) return tableMarkdown;

  // Let's find the reference data row (one with the most columns, or containing '0' / '||')
  let refRow = dataRows[0];
  let maxRootVals = 0;
  for (const row of dataRows) {
    const count = row.slice(1).filter(isRootValue).length;
    if (count > maxRootVals) {
      maxRootVals = count;
      refRow = row;
    }
  }

  const headerValues = headerCells.slice(1);
  const refValues = refRow.slice(1);

  const numRoots = headerValues.length - 2; // Middle elements are roots (excluding boundaries like -inf, +inf)
  if (numRoots <= 0) {
    return equalizeTableColumns(lines);
  }

  // Find indices of root values in refValues
  const rootValIndices: number[] = [];
  refValues.forEach((val, idx) => {
    if (isRootValue(val)) {
      rootValIndices.push(idx);
    }
  });

  // If the number of roots matches the number of root values
  if (rootValIndices.length === numRoots) {
    // We can perform the perfect alignment!
    const alignedHeaderValues: string[] = [];
    
    // Put boundary 0 at index 0
    alignedHeaderValues[0] = headerValues[0];
    
    // Put roots at their respective indices
    for (let i = 0; i < numRoots; i++) {
      const targetIdx = rootValIndices[i];
      alignedHeaderValues[targetIdx] = headerValues[i + 1];
    }
    
    // Put end boundary after the last root value (usually index + 2)
    const endBoundaryIdx = rootValIndices[numRoots - 1] + 2;
    alignedHeaderValues[endBoundaryIdx] = headerValues[headerValues.length - 1];

    // Fill in empty cells for undefined indices in alignedHeaderValues
    const maxCols = alignedHeaderValues.length;
    for (let i = 0; i < maxCols; i++) {
      if (alignedHeaderValues[i] === undefined) {
        alignedHeaderValues[i] = "";
      }
    }

    // Reconstruct the table rows
    const newHeader = "| " + headerCells[0] + " | " + alignedHeaderValues.join(" | ") + " |";
    
    // Create new divider with same number of columns
    const newDivider = "| " + Array(maxCols + 1).fill("---").join(" | ") + " |";

    // Pad all data rows to have maxCols elements
    const newLines = [newHeader, newDivider];
    for (const row of dataRows) {
      const label = row[0];
      const vals = row.slice(1);
      while (vals.length < maxCols) {
        vals.push("");
      }
      const newRowStr = "| " + label + " | " + vals.slice(0, maxCols).join(" | ") + " |";
      newLines.push(newRowStr);
    }

    return newLines.join("\n");
  }

  // Fallback: simple equalization
  return equalizeTableColumns(lines);
}

export function preprocessMarkdownTables(text: string): string {
  if (!text) return text;
  
  const lines = text.split("\n");
  const processedLines: string[] = [];
  let i = 0;
  
  while (i < lines.length) {
    const trimmedLine = lines[i].trim();
    if (trimmedLine.startsWith("|") && trimmedLine.endsWith("|")) {
      // Found a table start, collect all contiguous table lines
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      
      // Process the collected table
      const processedTable = alignSignTable(tableLines.join("\n"));
      processedLines.push(processedTable);
    } else {
      processedLines.push(lines[i]);
      i++;
    }
  }
  
  return processedLines.join("\n");
}
