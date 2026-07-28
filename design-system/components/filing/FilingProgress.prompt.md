Where the user is in the return. Horizontal on desktop, `compact` on mobile.

```jsx
<FilingProgress current={3} onStep={goTo} />
<FilingProgress current={3} compact />
```

Steps are the seven real ones: Your details, Income, Deductions, Taxes paid, Review, Pay, File and verify. Completed steps are tappable, future steps are not. Do not repeat the step name as a separate page heading — it *is* the h1.
