Document intake. Drives the whole first step of the filing app.

```jsx
<DocumentUpload state="idle" onTakePhoto={openCamera} onChooseFile={openPicker} />
<DocumentUpload state="parsed" fileName="Form 16 — FY 2025-26.pdf" fields={[
  { label: 'Gross salary', value: '14,80,000' },
  { label: 'Professional tax', value: '2,400', uncertain: true },
]} />
```

"Take a photo" is the primary affordance on mobile — most users photograph Form 16 rather than finding a PDF. Password-protected PDFs are a normal state, and the prompt states the usual format. Failure messages name the cause and the fix. The indeterminate bar is the only continuous animation allowed in the product.
