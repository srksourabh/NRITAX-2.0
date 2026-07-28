import React from 'react';

const base = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  fontFamily: 'var(--font-ui)', fontSize: 'var(--label)', fontWeight: 'var(--weight-medium)',
  lineHeight: 1, borderRadius: 'var(--radius-md)', cursor: 'pointer',
  transition: 'background-color var(--motion-instant), border-color var(--motion-instant), color var(--motion-instant)',
  whiteSpace: 'nowrap', textDecoration: 'none',
};

const variants = {
  primary: { background: 'var(--primary)', color: 'var(--surface)', border: '1px solid var(--primary)' },
  secondary: { background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--neutral-300)' },
  quiet: { background: 'transparent', color: 'var(--primary)', border: '1px solid transparent' },
  destructive: { background: 'var(--surface)', color: 'var(--notice)', border: '1px solid rgba(179,38,30,0.4)' },
  link: { background: 'transparent', color: 'var(--primary)', border: 'none', padding: 0, height: 'auto', textDecoration: 'underline', textDecorationThickness: '1px', textUnderlineOffset: '2px' },
};

const hovers = {
  primary: { background: 'var(--primary-600)', border: '1px solid var(--primary-600)' },
  secondary: { background: 'var(--neutral-50)', border: '1px solid var(--neutral-400)' },
  quiet: { background: 'var(--primary-50)' },
  destructive: { background: 'var(--notice-tint)' },
  link: { color: 'var(--primary-600)' },
};

export function Button({
  variant = 'primary', size = 'default', loading = false, disabled = false,
  fullWidth = false, iconLeft, iconRight, children, onClick, type = 'button', ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const heights = { default: 'var(--control-height)', mobilePrimary: 'var(--control-height-mobile-primary)', compact: 'var(--control-height-compact)' };
  const pads = {
    default: '0 var(--btn-pad-x)', mobilePrimary: '0 var(--btn-pad-x)', compact: '0 var(--btn-pad-x-compact)',
  };
  const style = {
    ...base, ...variants[variant],
    height: variant === 'link' ? 'auto' : heights[size],
    padding: variant === 'link' ? 0 : pads[size],
    width: fullWidth ? '100%' : undefined,
    ...(hover && !disabled ? hovers[variant] : null),
    ...(disabled ? { background: variant === 'link' || variant === 'quiet' ? 'transparent' : 'var(--neutral-100)', color: 'var(--neutral-400)', border: variant === 'link' ? 'none' : '1px solid var(--neutral-200)', cursor: 'not-allowed' } : null),
  };
  return (
    <button type={type} style={style} disabled={disabled || loading} onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} {...rest}>
      {loading ? <Spinner /> : iconLeft}
      {children}
      {iconRight}
    </button>
  );
}

function Spinner() {
  return (
    <span aria-hidden="true" style={{
      width: '14px', height: '14px', borderRadius: 'var(--radius-full)',
      border: '2px solid currentColor', borderTopColor: 'transparent', display: 'inline-block',
      animation: 'nritax-spin 700ms linear infinite',
    }}>
      <style>{'@keyframes nritax-spin{to{transform:rotate(360deg)}}'}</style>
    </span>
  );
}
