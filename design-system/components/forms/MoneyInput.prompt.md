Every rupee amount the user types. Use nowhere else — plain `Input` has no ₹ prefix and no words echo.

```jsx
<MoneyInput label="Gross salary" value={v} onChange={setV} source="Form 16" required />
```

The words echo below the field appears at or above ₹1,00,000 and catches the extra-zero error, the most common self-filing fault. Grouping applies on blur. `inputMode="decimal"`, no spinner arrows, no paise anywhere in the product.
