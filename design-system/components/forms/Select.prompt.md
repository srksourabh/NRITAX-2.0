Closed lists with a known set of options — assessment year, residential status, ITR form, bank.

```jsx
<Select label="Residential status" options={[{value:'ror',label:'Resident'},{value:'nr',label:'Non-resident'}]} value={v} onChange={setV} />
```

Native element underneath so mobile gets the platform picker. For more than about a dozen options use a searchable field instead.
