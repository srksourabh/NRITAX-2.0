Decisions that must be resolved before the user continues — regime switch, discard draft, PDF password.

```jsx
<Dialog open={open} onClose={close} title="Switch to the old regime?"
  description="This brings back 4 deductions worth ₹1,62,000 and raises your tax by ₹28,400."
  footer={<><Button variant="secondary" onClick={close}>Keep the new regime</Button><Button onClick={apply}>Switch</Button></>} />
```

`variant="sheet"` on mobile. `aria-labelledby` and `aria-describedby` with per-instance IDs, focus trapped and restored, Escape closes. Overlay shadow and backdrop are the only place a shadow this heavy is allowed.
