The standard text field. Every field carries a visible label.

```jsx
<Input label="Name as on PAN" required hint="Exactly as printed, including initials" />
<Input label="Assessment year" mono align="right" defaultValue="2025-26" />
```

Errors are tied with `aria-describedby`, announced with `role="alert"`, and always name the field and the fix. Placeholders are never labels; placeholder text uses `neutral-500`.
