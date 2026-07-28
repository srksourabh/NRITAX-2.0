Schedule rows scanned across many columns — capital gains, TDS deductors, challans.

```jsx
<DataTable columns={[{key:'deductor',header:'Deductor'},{key:'tan',header:'TAN'},{key:'tds',header:'Tax deducted',amount:true}]}
  rows={rows} caption="From 26AS, as on 12 June 2026." />
<DataTable stacked columns={...} rows={rows} />  {/* below 768px */}
```

Zebra striping on odd rows because these tables are scanned sideways. Sticky header in `neutral-50`. On mobile pass `stacked` — a horizontally scrolling tax table is a failure, not a fallback.
