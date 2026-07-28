The four identifiers that block a filing: PAN, TAN, Aadhaar, IFSC.

```jsx
<CharacterBoxInput kind="pan" label="PAN" value={pan} onChange={setPan} hint="Ten characters, as printed on your card" />
<CharacterBoxInput kind="aadhaar" label="Aadhaar" value={aadhaar} onChange={setAadhaar} />
```

The boxes are a visual layer over one real input, so paste, autofill and screen readers work. Grouping matches the identifier's own structure (PAN is 5 + 4 + 1). Aadhaar is masked with `maskAadhaar` immediately and never appears in a table, PDF preview, URL, log line or analytics event.
