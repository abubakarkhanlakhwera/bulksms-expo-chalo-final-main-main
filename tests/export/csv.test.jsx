// We import the module and rely on mocks for expo libs.
import { buildFailedCsv } from "../../modules/export/csv";

describe("CSV export (failed-only)", () => {
  it("outputs header and invalid rows only", () => {
    const validated = [
      { valid: true, name: "Ali", phoneRaw: "300...", phoneNormalized: "+92300...", message: "Hi" },
      { valid: false, name: "Sara", phoneRaw: "301...", phoneNormalized: "", message: "Yo", reason: "Bad phone" },
      { valid: false, name: "Hamza, Jr.", phoneRaw: "302...", phoneNormalized: "", message: "He said \"ok\"", reason: "Missing cc" },
    ];
    const csv = buildFailedCsv({ validated });
    const lines = csv.trim().split("\n");
    expect(lines[0]).toBe("name,phoneRaw,phoneNormalized,message,reason");
    expect(lines.length).toBe(1 + 2); // header + 2 invalid
    // check quotes/escaping happened
    expect(csv).toMatch(/"Hamza, Jr."/);
    expect(csv).toMatch(/"He said ""ok"""/);
  });
});
