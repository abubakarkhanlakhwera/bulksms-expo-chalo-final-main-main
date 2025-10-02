import { validateRows } from "../../modules/validation/validateRows";

describe("validateRows", () => {
  const mapping = { name: "name", phone: "phone", message: "msg" };
  const rows = [
    { name: "Ali", phone: "+923001112222", msg: "Hello" },
    { name: "Sara", phone: "3001113333", msg: "مرحبا" }, // likely UCS-2
    { name: "", phone: "", msg: "" }, // invalid
  ];

  it("produces counts and validated flags", () => {
    const { rows: out, counts } = validateRows({ rows, mapping });
    expect(counts.total).toBe(3);
    expect(counts.valid + counts.invalid).toBe(3);
    expect(out.length).toBe(3);
    expect(out[0]).toHaveProperty("valid");
    expect(out[0]).toHaveProperty("encoding");
    expect(out[0]).toHaveProperty("parts");
  });

  it("normalizes and marks invalids with reason", () => {
    const { rows: out } = validateRows({ rows, mapping });
    const invalid = out.find(r => !r.valid);
    expect(invalid).toBeTruthy();
    expect(invalid.reason).toBeTruthy();
  });
});
