One exclusive choice from a short set, where the options need explaining.

```jsx
<RadioGroup label="How do you want to verify?" value={v} onChange={setV} options={[
  { value: 'aadhaar', label: 'Aadhaar OTP', hint: 'Fastest. Needs the mobile linked to your Aadhaar.' },
  { value: 'netbanking', label: 'Net banking' },
]} />
```

Use a `Select` past about five options. Each row is 44px and the hint sits under the label, never in a tooltip.
