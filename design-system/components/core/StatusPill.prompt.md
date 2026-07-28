States where a return sits in its lifecycle. Pass a taxonomy key and the label comes with it.

```jsx
<StatusPill status="filed_unverified" />
<StatusPill status="refund_issued" dot />
```

Never ship a status that is not in `FILING_STATUSES`. `filed_unverified` is deliberately `due`, not `credit` — an unverified return is not a filed return. Colour is reinforcement; the text label always carries the meaning.

On the `ink` shell header pass `onInk` — the semantic tints are only valid on `surface` and `paper`, and `due-text` on ink measures 2.08:1. The on-ink pill uses `surface` text on a 10% white fill (17.15:1) and carries the state colour in the dot.
