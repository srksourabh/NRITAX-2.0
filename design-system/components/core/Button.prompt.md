The action control for NRITAX 2.0 — use for anything the user clicks that is not a link inside a sentence.

```jsx
<Button variant="primary" size="mobilePrimary" fullWidth>File my return</Button>
<Button variant="secondary">Save draft</Button>
<Button variant="quiet" size="compact">Edit</Button>
<Button variant="destructive">Discard this draft</Button>
```

Rules: one `primary` per view section; **primary is seal green** (`--seal` / hover `--seal-2`), not registrar blue; radius `--radius-control` (5px); `destructive` is outlined, never filled red; `compact` (36px) only inside a row that itself gives 44px of hit area; `loading` keeps the label so width is stable. Quiet and link variants stay opt blue (`--primary`).
