# Contracts (Locked for v1)

## Validation
Input: `{ rows: Array<Record<string,string>>, mapping: { name: string, phone: string, message: string } }`  
Output: `{ rows: ValidatedRow[], counts: { total:number, valid:number, invalid:number } }`

`ValidatedRow` shape:
```ts
{
  id: string;            // stable id
  name: string;
  phoneRaw?: string;     // original from file
  phoneNormalized?: string; // E.164 if valid
  message: string;
  valid: boolean;
  reason?: string;       // if invalid
  encoding?: "GSM-7" | "UCS-2";
  parts?: number;        // SMS segments estimate
}
