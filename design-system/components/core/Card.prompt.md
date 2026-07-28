The flat panel that holds everything in the filing app — schedules, summaries, upload zones.

```jsx
<Card>
  <CardHeader title="Income from salary" meta="From Form 16 Part B" action={<Button variant="quiet" size="compact">Edit</Button>} />
  …
</Card>
```

Rules: no shadow at rest — borders carry separation. `interactive` cards change border to `primary-200` and fill to `neutral-50` on hover, they never lift. A LedgerBlock placed inside a Card keeps square corners on purpose.
