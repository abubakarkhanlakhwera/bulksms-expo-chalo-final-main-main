// Minimal mock for 'xlsx' to support parseXlsx tests
module.exports = {
  read: (_buf, _opts) => ({
    SheetNames: ["Sheet1"],
    Sheets: {
      Sheet1: { __mock: true }
    },
  }),
  utils: {
    sheet_to_json: (_sheet, opts = {}) => {
      const header = opts.header || ["name","phone","message"];
      const rows = [
        { name: "Ali", phone: "+923001112222", message: "Hello" },
        { name: "Sara", phone: "3001113333", message: "Yo" },
      ];
      // optionally return arrays if requested, but our parser should use objects
      return rows;
    },
  },
};
