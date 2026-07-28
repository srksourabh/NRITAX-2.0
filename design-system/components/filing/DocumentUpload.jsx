import React from 'react';
import { Button } from '../core/Button.jsx';
import { StatusPill } from '../core/StatusPill.jsx';

export function DocumentUpload({
  state = 'idle', accepts = 'Form 16, 26AS, AIS, bank statements. PDF or image, up to 10 MB.',
  fileName, fields = [], error, onTakePhoto, onChooseFile, onPassword, onEditField, progressLabel = 'Reading your documents',
}) {
  if (state === 'idle') {
    return (
      <div style={{
        border: '1px dashed var(--neutral-300)', borderRadius: 'var(--radius-lg)', background: 'var(--neutral-50)',
        minHeight: '140px', padding: '20px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '12px', textAlign: 'center',
      }}>
        <p style={{ fontSize: 'var(--body)', color: 'var(--ink)' }}>Add a document</p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button variant="primary" onClick={onTakePhoto}>Take a photo</Button>
          <Button variant="secondary" onClick={onChooseFile}>Choose file</Button>
        </div>
        <p style={{ fontSize: 'var(--body-sm)', lineHeight: 'var(--body-sm-lh)', color: 'var(--neutral-500)', maxWidth: '38ch' }}>{accepts}</p>
      </div>
    );
  }
  if (state === 'parsing') {
    return (
      <div role="status" aria-busy="true" style={{ border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-lg)', background: 'var(--surface)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
          <span style={{ fontSize: 'var(--body)', color: 'var(--ink)' }}>{fileName}</span>
          <StatusPill tone="info" label={progressLabel} />
        </div>
        <div style={{ height: '4px', background: 'var(--neutral-200)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
          <div style={{ width: '33%', height: '100%', background: 'var(--primary)', animation: 'nritax-indeterminate 1.2s ease-in-out infinite' }} />
        </div>
      </div>
    );
  }
  if (state === 'password') {
    return (
      <div style={{ border: '1px solid var(--due-border)', background: 'var(--due-tint)', borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <span style={{ fontSize: 'var(--body)', fontWeight: 'var(--weight-medium)', color: 'var(--due-text)' }}>{fileName} needs a password</span>
        <p style={{ fontSize: 'var(--body-sm)', lineHeight: 'var(--body-sm-lh)', color: 'var(--due-text)' }}>Often your PAN in lowercase followed by your date of birth.</p>
        <Button variant="secondary" onClick={onPassword}>Enter password</Button>
      </div>
    );
  }
  if (state === 'failed') {
    return (
      <div style={{ border: '1px solid var(--notice-border)', background: 'var(--notice-tint)', borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <span style={{ fontSize: 'var(--body)', fontWeight: 'var(--weight-medium)', color: 'var(--notice-text)' }}>{fileName}</span>
        <p style={{ fontSize: 'var(--body-sm)', lineHeight: 'var(--body-sm-lh)', color: 'var(--notice-text)' }}>{error}</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="secondary" onClick={onChooseFile}>Try another file</Button>
          <Button variant="quiet" onClick={onEditField}>Enter the figures myself</Button>
        </div>
      </div>
    );
  }
  return (
    <div style={{ border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-lg)', background: 'var(--surface)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
        <span style={{ fontSize: 'var(--body)', color: 'var(--ink)' }}>{fileName}</span>
        <StatusPill tone="credit" label="Read" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {fields.map((f) => (
          <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderTop: '1px solid var(--neutral-200)' }}>
            <span style={{ flex: 1, fontSize: 'var(--body-sm)', color: 'var(--neutral-700)' }}>{f.label}</span>
            {f.uncertain ? <StatusPill tone="due" label="Check this" /> : null}
            <span style={{ fontFamily: 'var(--font-figure)', fontSize: 'var(--figure)', fontVariantNumeric: 'tabular-nums lining-nums', color: 'var(--ink)' }}>{f.value}</span>
            <Button variant="quiet" size="compact" onClick={() => onEditField && onEditField(f)}>Edit</Button>
          </div>
        ))}
      </div>
    </div>
  );
}
