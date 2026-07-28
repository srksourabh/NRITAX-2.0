The expert channel — a 400px right drawer on desktop, a bottom sheet on mobile.

```jsx
<ExpertPanel expert={{ name: 'Meera Raghavan', initials: 'MR', credential: 'CA · M. No. 2XXXXX', lastActive: 'active 2 min ago' }}
  messages={thread} onSend={send} />
```

Outgoing bubbles use `primary-50` with `ink` text, not a filled primary — a wall of saturated blue in a long thread is hard to read. The credential and last-active line is fixed at the top because knowing a real person is present is the reason the panel exists.
