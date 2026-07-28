The computation sheet — the signature of NRITAX 2.0. Wherever a rupee figure appears, it appears here.

```jsx
<LedgerBlock caption="Figures rounded under s.288A and s.288B." rows={[
  { label: 'Gross salary', statute: 'u/s 17(1)', amount: 1480000, head: 'salary' },
  { label: 'Less: standard deduction', statute: 'u/s 16(ia)', amount: 75000 },
  { label: 'Income from salary', amount: 1405000, kind: 'subtotal' },
  { label: 'Less: TDS', statute: '26AS', amount: 112000 },
  { label: 'Refund due', amount: 8557, kind: 'final' },
]} />
```

Rules: square corners inside a rounded Card, on purpose. Hairline rule closes a subtotal group. The double rule appears **exactly once** per sheet, under the final payable or refundable figure, and nowhere else in the product. Every row carries a statute or source reference in the margin. Never abbreviate to lakh or crore here.
