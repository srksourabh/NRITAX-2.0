The due-date signal. One component covers all five tiers so the escalation is consistent.

```jsx
<DeadlineBanner days={9} dueDate="31 July 2026" action={<Button>Continue my return</Button>} />
<DeadlineBanner days={-12} dueDate="31 July 2026" lateFee="1,000" revisedDeadline="31 December 2026" />
```

Above 45 days it collapses to one quiet line in the dashboard header. Under 4 days it goes `notice`. Past the date it changes meaning — belated filing under s.139(4), the s.234F fee, the revised deadline. Never a live ticking countdown; that is manipulation, not information.
