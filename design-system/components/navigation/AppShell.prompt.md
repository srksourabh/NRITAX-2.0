The frame every filing-app screen sits in.

```jsx
<AppShell nav={[{label:'My returns',active:true},{label:'Documents'},{label:'Help'}]}
  right={<StatusPill status="review_user" />}>
  …screen…
</AppShell>
```

The `ink` header is the only dark region in the product — do not introduce dark bands anywhere else in the app. It carries a **3px `seal` bottom border** and the **BrandLockup** (circular seal + `NRITAX 2.0` wordmark). `StickyActionBar` keeps the primary action in the thumb zone on mobile; it carries a top hairline, never a shadow or a blur.

Logo artwork: `assets/logo/nritax-seal.svg` (also inlined as `SealMark`).
