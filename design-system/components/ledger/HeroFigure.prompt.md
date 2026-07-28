The one large figure at the head of a review screen, summary card or acknowledgement.

```jsx
<HeroFigure label="Refund due" amount={8557} tone="credit" note="Credited to HDFC ****4412 after processing" />
<HeroFigure label="Tax payable" amount={24310} note="Pay by 31 July 2026 to avoid interest under s.234A" />
```

Never show a minus sign — the label carries the meaning. Green is only for a confirmed refund. Wrap the value in `aria-live="polite"` when it recalculates live, throttled to one announcement per 800ms of quiet.
