The old-versus-new regime decision. Two ledger columns, one sentence underneath.

```jsx
<RegimeComparison selected="new" onSelect={setRegime}
  newRegime={{ tax: 99464, rows: [...] }}
  oldRegime={{ tax: 127864, rows: [...] }}
  switchNote="Switching to the old regime brings back 4 deductions worth ₹1,62,000." />
```

The lower-tax column gets a 2px `credit` ring and a "Lower tax" pill; the other column stays neutral — users switch regimes for reasons beyond tax. The delta is stated in plain rupees, never a percentage, and under ₹500 the copy becomes "Both regimes cost about the same" with no winner ring.
