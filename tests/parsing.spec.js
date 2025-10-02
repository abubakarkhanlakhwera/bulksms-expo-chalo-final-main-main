// Parsing edge cases for CSV & XLSX
// Assumes:
//   modules/parsing/csv.js   exports: parseCsv(text, opts?)
//   modules/parsing/xlsx.js  exports: parseXlsx(arrayBuffer)
// Both should return: { headers: string[], rows: Array<Record<string,string>> }

import { parseCsv } from "../modules/parsing/csv";
let parseXlsx;
try {
  // allow repo without xlsx implementation to still run CSV tests
  ({ parseXlsx } = require("../modules/parsing/xlsx"));
} catch (e) {
  // noop: we'll skip XLSX block if not present
}

describe("CSV parsing", () => {
  it("handles BOM, header row, quoted commas and escaped quotes", () => {
    const csv = "\uFEFFname,phone,message\n" +
                "Ali,+923001112222,\"Hello, world\"\n" +
                "\"Hamza, Jr.\",3001113333,\"He said \"\"ok\"\"\"";
    const { headers, rows } = parseCsv(csv);
    expect(headers).toEqual(["name","phone","message"]);
    expect(rows.length).toBe(2);
    expect(rows[0].name).toBe("Ali");
    expect(rows[1].name).toBe("Hamza, Jr.");
    expect(rows[1].message).toBe('He said "ok"');
  });

  it("accepts CRLF and skips blank lines", () => {
    const csv = "name,phone,message\r\nAli,3001112222,Hi\r\n\r\nSara,3001113333,Yo\r\n";
    const { rows } = parseCsv(csv);
    expect(rows.length).toBe(2);
  });

  it("supports custom delimiter ; and trims headers", () => {
    const csv = "  name ; phone ; message \nA ; 3001112222 ; Hi";
    const { headers, rows } = parseCsv(csv, { delimiter: ";" });
    expect(headers.map(h => h.trim())).toEqual(["name","phone","message"]);
    expect(rows[0].message).toBe("Hi");
  });
});

(parseXlsx ? describe : describe.skip)("XLSX parsing (mocked)", () => {
  it("reads first sheet to uniform rows", () => {
    // any buffer-like value; our __mocks__/xlsx.js ignores real binary
    const buf = new ArrayBuffer(8);
    const { headers, rows } = parseXlsx(buf);
    expect(Array.isArray(headers)).toBe(true);
    expect(headers).toEqual(["name","phone","message"]);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]).toHaveProperty("name");
    expect(rows[0]).toHaveProperty("phone");
    expect(rows[0]).toHaveProperty("message");
  });
});
