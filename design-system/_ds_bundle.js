/* @ds-bundle: {"format":4,"namespace":"NRITAX20DesignSystem_c86cd4","components":[{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"CardHeader","sourcePath":"components/core/Card.jsx"},{"name":"EmptyState","sourcePath":"components/core/EmptyState.jsx"},{"name":"FILING_STATUSES","sourcePath":"components/core/StatusPill.jsx"},{"name":"StatusPill","sourcePath":"components/core/StatusPill.jsx"},{"name":"StatuteChip","sourcePath":"components/core/StatuteChip.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"ExpertPanel","sourcePath":"components/feedback/ExpertPanel.jsx"},{"name":"Explainer","sourcePath":"components/feedback/Explainer.jsx"},{"name":"Acknowledgement","sourcePath":"components/filing/Acknowledgement.jsx"},{"name":"DeadlineBanner","sourcePath":"components/filing/DeadlineBanner.jsx"},{"name":"DocumentUpload","sourcePath":"components/filing/DocumentUpload.jsx"},{"name":"FILING_STEPS","sourcePath":"components/filing/FilingProgress.jsx"},{"name":"FilingProgress","sourcePath":"components/filing/FilingProgress.jsx"},{"name":"TrustBar","sourcePath":"components/filing/TrustBar.jsx"},{"name":"CharacterBoxInput","sourcePath":"components/forms/CharacterBoxInput.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"MoneyInput","sourcePath":"components/forms/MoneyInput.jsx"},{"name":"RadioGroup","sourcePath":"components/forms/RadioGroup.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"DataTable","sourcePath":"components/ledger/DataTable.jsx"},{"name":"HeroFigure","sourcePath":"components/ledger/HeroFigure.jsx"},{"name":"LedgerBlock","sourcePath":"components/ledger/LedgerBlock.jsx"},{"name":"LedgerRow","sourcePath":"components/ledger/LedgerBlock.jsx"},{"name":"RegimeComparison","sourcePath":"components/ledger/RegimeComparison.jsx"},{"name":"Wordmark","sourcePath":"components/navigation/AppShell.jsx"},{"name":"AppShell","sourcePath":"components/navigation/AppShell.jsx"},{"name":"StickyActionBar","sourcePath":"components/navigation/AppShell.jsx"}],"sourceHashes":{"components/core/Button.jsx":"4126174978c7","components/core/Card.jsx":"4cd5f9b14a62","components/core/EmptyState.jsx":"5cf5231559de","components/core/StatusPill.jsx":"3946e2111f87","components/core/StatuteChip.jsx":"24cef0c13973","components/feedback/Dialog.jsx":"44ff2d9dc54f","components/feedback/ExpertPanel.jsx":"bb09057ddec7","components/feedback/Explainer.jsx":"ef08a37016cd","components/filing/Acknowledgement.jsx":"6c5507bc1fe6","components/filing/DeadlineBanner.jsx":"0700497fdb28","components/filing/DocumentUpload.jsx":"730139251535","components/filing/FilingProgress.jsx":"c73cfc13a4a3","components/filing/TrustBar.jsx":"f461edc916af","components/forms/CharacterBoxInput.jsx":"65f70c7263f6","components/forms/Checkbox.jsx":"d8d5de25aed9","components/forms/Input.jsx":"cda1c671004b","components/forms/MoneyInput.jsx":"87091b5bfd42","components/forms/RadioGroup.jsx":"688186ed18b5","components/forms/Select.jsx":"5f20e54beb2b","components/forms/Switch.jsx":"1f7c63012e86","components/ledger/DataTable.jsx":"db33e8e51cc1","components/ledger/HeroFigure.jsx":"c46149fa7582","components/ledger/LedgerBlock.jsx":"734987c3a749","components/ledger/RegimeComparison.jsx":"17d115235d9a","components/navigation/AppShell.jsx":"059f070472e0","ui_kits/filing_app/Dashboard.jsx":"bc8150c8b9b8","ui_kits/filing_app/DocumentsStep.jsx":"e1c6f6336319","ui_kits/filing_app/FiledScreen.jsx":"75d204161b58","ui_kits/filing_app/IncomeStep.jsx":"b7aaec2c91e3","ui_kits/filing_app/ReviewStep.jsx":"a7c0f9b48318","ui_kits/filing_app/Shared.jsx":"5cf2a3c0f6bf","ui_kits/marketing_site/GuideScreen.jsx":"191e70a3a715","ui_kits/marketing_site/HomeScreen.jsx":"49b10595aad5","ui_kits/marketing_site/PricingScreen.jsx":"075b5f99fc3f","ui_kits/marketing_site/SiteChrome.jsx":"0f6f3a5fd3da"},"inlinedExternals":[],"unexposedExports":[{"name":"amountInWords","sourcePath":"components/forms/MoneyInput.jsx"},{"name":"deadlineTier","sourcePath":"components/filing/DeadlineBanner.jsx"},{"name":"formatFigure","sourcePath":"components/ledger/LedgerBlock.jsx"},{"name":"formatINR","sourcePath":"components/forms/MoneyInput.jsx"},{"name":"maskAadhaar","sourcePath":"components/forms/CharacterBoxInput.jsx"}]} */

(() => {

const __ds_ns = (window.NRITAX20DesignSystem_c86cd4 = window.NRITAX20DesignSystem_c86cd4 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const base = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  fontFamily: 'var(--font-ui)',
  fontSize: 'var(--label)',
  fontWeight: 'var(--weight-medium)',
  lineHeight: 1,
  borderRadius: 'var(--radius-control)',
  cursor: 'pointer',
  transition: 'background-color var(--motion-instant), border-color var(--motion-instant), color var(--motion-instant)',
  whiteSpace: 'nowrap',
  textDecoration: 'none'
};
const variants = {
  primary: {
    background: 'var(--seal)',
    color: 'var(--surface)',
    border: '1px solid var(--seal)'
  },
  secondary: {
    background: 'var(--surface)',
    color: 'var(--ink)',
    border: '1px solid var(--neutral-300)'
  },
  quiet: {
    background: 'transparent',
    color: 'var(--primary)',
    border: '1px solid transparent'
  },
  destructive: {
    background: 'var(--surface)',
    color: 'var(--notice)',
    border: '1px solid rgba(179,38,30,0.4)'
  },
  link: {
    background: 'transparent',
    color: 'var(--primary)',
    border: 'none',
    padding: 0,
    height: 'auto',
    textDecoration: 'underline',
    textDecorationThickness: '1px',
    textUnderlineOffset: '2px'
  }
};
const hovers = {
  primary: {
    background: 'var(--seal-2)',
    border: '1px solid var(--seal-2)'
  },
  secondary: {
    background: 'var(--neutral-50)',
    border: '1px solid var(--neutral-400)'
  },
  quiet: {
    background: 'var(--primary-50)'
  },
  destructive: {
    background: 'var(--notice-tint)'
  },
  link: {
    color: 'var(--primary-600)'
  }
};
function Button({
  variant = 'primary',
  size = 'default',
  loading = false,
  disabled = false,
  fullWidth = false,
  iconLeft,
  iconRight,
  children,
  onClick,
  type = 'button',
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const heights = {
    default: 'var(--control-height)',
    mobilePrimary: 'var(--control-height-mobile-primary)',
    compact: 'var(--control-height-compact)'
  };
  const pads = {
    default: '0 var(--btn-pad-x)',
    mobilePrimary: '0 var(--btn-pad-x)',
    compact: '0 var(--btn-pad-x-compact)'
  };
  const style = {
    ...base,
    ...variants[variant],
    height: variant === 'link' ? 'auto' : heights[size],
    padding: variant === 'link' ? 0 : pads[size],
    width: fullWidth ? '100%' : undefined,
    ...(hover && !disabled ? hovers[variant] : null),
    ...(disabled ? {
      background: variant === 'link' || variant === 'quiet' ? 'transparent' : 'var(--neutral-100)',
      color: 'var(--neutral-400)',
      border: variant === 'link' ? 'none' : '1px solid var(--neutral-200)',
      cursor: 'not-allowed'
    } : null)
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    style: style,
    disabled: disabled || loading,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false)
  }, rest), loading ? /*#__PURE__*/React.createElement(Spinner, null) : iconLeft, children, iconRight);
}
function Spinner() {
  return /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: '14px',
      height: '14px',
      borderRadius: 'var(--radius-full)',
      border: '2px solid currentColor',
      borderTopColor: 'transparent',
      display: 'inline-block',
      animation: 'nritax-spin 700ms linear infinite'
    }
  }, /*#__PURE__*/React.createElement("style", null, '@keyframes nritax-spin{to{transform:rotate(360deg)}}'));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Card({
  padding,
  interactive = false,
  children,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", _extends({
    onMouseEnter: interactive ? () => setHover(true) : undefined,
    onMouseLeave: interactive ? () => setHover(false) : undefined,
    style: {
      background: hover ? 'var(--neutral-50)' : 'var(--surface)',
      border: '1px solid ' + (hover ? 'var(--primary-200)' : 'var(--neutral-200)'),
      borderRadius: 'var(--radius-lg)',
      padding: padding ?? 'var(--card-pad)',
      boxShadow: 'none',
      transition: 'background-color var(--motion-instant), border-color var(--motion-instant)',
      ...style
    }
  }, rest), children);
}
function CardHeader({
  title,
  meta,
  action
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: '16px',
      marginBottom: '16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--h2)',
      lineHeight: 'var(--h2-lh)',
      fontWeight: 'var(--weight-semibold)',
      color: 'var(--ink)'
    }
  }, title), meta ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--caption)',
      lineHeight: 'var(--caption-lh)',
      color: 'var(--neutral-500)'
    }
  }, meta) : null), action);
}
Object.assign(__ds_scope, { Card, CardHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/EmptyState.jsx
try { (() => {
function EmptyState({
  line,
  action
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '24px',
      background: 'var(--neutral-50)',
      border: '1px solid var(--neutral-200)',
      borderRadius: 'var(--radius-lg)'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--body)',
      lineHeight: 'var(--body-lh)',
      color: 'var(--neutral-700)'
    }
  }, line), action);
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/core/StatusPill.jsx
try { (() => {
const FILING_STATUSES = {
  draft: {
    label: 'Draft',
    tone: 'draft'
  },
  docs_pending: {
    label: 'Documents needed',
    tone: 'due'
  },
  parsing: {
    label: 'Reading your documents',
    tone: 'info'
  },
  review_user: {
    label: 'Ready for your review',
    tone: 'due'
  },
  review_expert: {
    label: 'With your tax expert',
    tone: 'info'
  },
  ready_to_file: {
    label: 'Ready to file',
    tone: 'primary'
  },
  payment_due: {
    label: 'Tax payment pending',
    tone: 'due'
  },
  filed_unverified: {
    label: 'Filed, verify within 30 days',
    tone: 'due'
  },
  everified: {
    label: 'e-Verified',
    tone: 'credit'
  },
  processed: {
    label: 'Processed by the department',
    tone: 'credit'
  },
  refund_issued: {
    label: 'Refund credited',
    tone: 'credit'
  },
  defective: {
    label: 'Defective return, s.139(9)',
    tone: 'notice'
  },
  notice_received: {
    label: 'Notice received',
    tone: 'notice'
  },
  demand_raised: {
    label: 'Demand raised',
    tone: 'notice'
  }
};
const tones = {
  credit: {
    background: 'var(--credit-tint)',
    color: 'var(--credit-text)',
    border: '1px solid var(--credit-border)'
  },
  due: {
    background: 'var(--due-tint)',
    color: 'var(--due-text)',
    border: '1px solid var(--due-border)'
  },
  notice: {
    background: 'var(--notice-tint)',
    color: 'var(--notice-text)',
    border: '1px solid var(--notice-border)'
  },
  info: {
    background: 'var(--info-tint)',
    color: 'var(--info-text)',
    border: '1px solid var(--info-border)'
  },
  primary: {
    background: 'var(--info-tint)',
    color: 'var(--primary)',
    border: '1px solid var(--info-border)'
  },
  draft: {
    background: 'var(--draft-tint)',
    color: 'var(--draft-text)',
    border: '1px solid var(--draft-border)'
  }
};
const DOTS = {
  credit: 'var(--credit)',
  due: 'var(--due)',
  notice: 'var(--notice)',
  info: 'var(--primary-200)',
  primary: 'var(--primary-200)',
  draft: 'var(--neutral-300)'
};
const ON_INK_DOTS = {
  credit: '#8FE3D0',
  due: '#D89A3C',
  notice: '#F08279',
  info: 'var(--primary-200)',
  primary: 'var(--primary-200)',
  draft: 'var(--neutral-300)'
};
function StatusPill({
  status,
  tone,
  label,
  dot = false,
  onInk = false
}) {
  const resolved = status ? FILING_STATUSES[status] : null;
  const key = tone || (resolved ? resolved.tone : 'draft');
  const t = onInk ? {
    background: 'rgba(252,253,252,0.10)',
    color: 'var(--surface)',
    border: '1px solid rgba(252,253,252,0.28)'
  } : tones[key];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      height: '24px',
      padding: '0 10px',
      borderRadius: 'var(--radius-full)',
      fontFamily: 'var(--font-ui)',
      fontSize: '12px',
      fontWeight: 'var(--weight-medium)',
      lineHeight: 1,
      whiteSpace: 'nowrap',
      ...t
    }
  }, dot || onInk ? /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: '6px',
      height: '6px',
      borderRadius: 'var(--radius-full)',
      flex: '0 0 auto',
      background: onInk ? ON_INK_DOTS[key] : 'currentColor'
    }
  }) : null, label || (resolved ? resolved.label : status));
}
Object.assign(__ds_scope, { FILING_STATUSES, StatusPill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/StatusPill.jsx", error: String((e && e.message) || e) }); }

// components/core/StatuteChip.jsx
try { (() => {
function StatuteChip({
  children,
  source = false,
  onClick,
  title
}) {
  const [hover, setHover] = React.useState(false);
  const Tag = onClick ? 'button' : 'span';
  return /*#__PURE__*/React.createElement(Tag, {
    type: onClick ? 'button' : undefined,
    onClick: onClick,
    title: title,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      height: '20px',
      padding: '0 6px',
      borderRadius: 'var(--radius-xs)',
      fontFamily: 'var(--font-figure)',
      fontSize: 'var(--statute)',
      lineHeight: 'var(--statute-lh)',
      fontWeight: 'var(--weight-medium)',
      background: source ? 'var(--info-tint)' : 'transparent',
      border: '1px solid ' + (source ? 'var(--info-border)' : 'transparent'),
      color: source ? 'var(--info-text)' : 'var(--neutral-500)',
      cursor: onClick ? 'pointer' : 'default',
      textDecoration: onClick && hover ? 'underline' : 'none',
      transition: 'color var(--motion-instant)'
    }
  }, children);
}
Object.assign(__ds_scope, { StatuteChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/StatuteChip.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
function Dialog({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  variant = 'modal'
}) {
  const id = React.useMemo(() => 'dlg-' + Math.random().toString(36).slice(2, 8), []);
  React.useEffect(() => {
    if (!open) return;
    const onKey = e => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  const sheet = variant === 'sheet';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      zIndex: 60,
      display: 'flex',
      alignItems: sheet ? 'flex-end' : 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'absolute',
      inset: 0,
      background: 'var(--overlay-backdrop)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    "aria-labelledby": id + '-t',
    "aria-describedby": description ? id + '-d' : undefined,
    style: {
      position: 'relative',
      background: 'var(--surface)',
      width: sheet ? '100%' : 'min(520px, calc(100% - 32px))',
      borderRadius: sheet ? 'var(--radius-xl) var(--radius-xl) 0 0' : 'var(--radius-xl)',
      boxShadow: 'var(--elev-overlay)',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      animation: 'nritax-fade var(--motion-panel) both'
    }
  }, /*#__PURE__*/React.createElement("style", null, '@keyframes nritax-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}'), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    id: id + '-t',
    style: {
      fontSize: 'var(--h2)',
      lineHeight: 'var(--h2-lh)',
      fontWeight: 'var(--weight-semibold)',
      color: 'var(--ink)'
    }
  }, title), description ? /*#__PURE__*/React.createElement("p", {
    id: id + '-d',
    style: {
      fontSize: 'var(--body)',
      lineHeight: 'var(--body-lh)',
      color: 'var(--neutral-700)'
    }
  }, description) : null), children, footer ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '8px',
      justifyContent: 'flex-end',
      flexWrap: 'wrap'
    }
  }, footer) : null));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/ExpertPanel.jsx
try { (() => {
function ExpertPanel({
  expert,
  messages = [],
  open = true,
  variant = 'drawer',
  onClose,
  onSend
}) {
  const [draft, setDraft] = React.useState('');
  if (!open) return null;
  const drawer = variant === 'drawer';
  return /*#__PURE__*/React.createElement("aside", {
    "aria-label": "Your tax expert",
    style: {
      display: 'flex',
      flexDirection: 'column',
      width: drawer ? '400px' : '100%',
      maxWidth: '100%',
      background: 'var(--surface)',
      borderLeft: drawer ? '1px solid var(--neutral-200)' : 'none',
      borderTop: drawer ? 'none' : '1px solid var(--neutral-200)',
      borderRadius: drawer ? 0 : 'var(--radius-xl) var(--radius-xl) 0 0',
      boxShadow: drawer ? 'none' : 'var(--elev-overlay)',
      height: '100%',
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '16px 20px',
      borderBottom: '1px solid var(--neutral-200)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: '36px',
      height: '36px',
      borderRadius: 'var(--radius-full)',
      background: 'var(--primary-50)',
      color: 'var(--primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-figure)',
      fontSize: 'var(--body-sm)',
      flex: '0 0 auto'
    }
  }, expert.initials), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--body)',
      fontWeight: 'var(--weight-medium)',
      color: 'var(--ink)'
    }
  }, expert.name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-figure)',
      fontSize: 'var(--statute)',
      color: 'var(--neutral-500)'
    }
  }, expert.credential, " \xB7 ", expert.lastActive)), onClose ? /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "quiet",
    size: "compact",
    onClick: onClose
  }, "Close") : null), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      overflowY: 'auto',
      padding: '16px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }
  }, messages.map((m, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      alignSelf: m.from === 'you' ? 'flex-end' : 'flex-start',
      maxWidth: '85%',
      background: m.from === 'you' ? 'var(--primary-50)' : 'var(--neutral-50)',
      border: '1px solid ' + (m.from === 'you' ? 'var(--info-border)' : 'var(--neutral-200)'),
      color: 'var(--ink)',
      borderRadius: 'var(--radius-md)',
      padding: '10px 12px',
      fontSize: 'var(--body-sm)',
      lineHeight: 'var(--body-sm-lh)'
    }
  }, m.text, m.at ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '4px',
      fontSize: 'var(--caption)',
      color: 'var(--neutral-500)'
    }
  }, m.at) : null))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid var(--neutral-200)',
      padding: '12px 20px',
      display: 'flex',
      gap: '8px'
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: draft,
    onChange: e => setDraft(e.target.value),
    placeholder: "Ask about your return",
    "aria-label": "Message your tax expert",
    style: {
      flex: 1,
      minWidth: 0,
      height: 'var(--control-height)',
      padding: '0 var(--input-pad-x)',
      border: '1px solid var(--neutral-300)',
      borderRadius: 'var(--radius-sm)',
      background: 'var(--surface)',
      fontSize: 'var(--body)'
    }
  }), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    onClick: () => {
      if (draft.trim() && onSend) {
        onSend(draft.trim());
        setDraft('');
      }
    }
  }, "Send")));
}
Object.assign(__ds_scope, { ExpertPanel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/ExpertPanel.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Explainer.jsx
try { (() => {
function Explainer({
  term,
  definition,
  children
}) {
  const [open, setOpen] = React.useState(false);
  const id = React.useMemo(() => 'exp-' + Math.random().toString(36).slice(2, 8), []);
  return /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'inline-block'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-expanded": open,
    "aria-controls": id,
    onClick: () => setOpen(v => !v),
    onBlur: () => setOpen(false),
    style: {
      background: 'none',
      border: 'none',
      padding: 0,
      cursor: 'help',
      color: 'inherit',
      font: 'inherit',
      textDecoration: 'underline dotted',
      textDecorationColor: 'var(--neutral-300)',
      textDecorationThickness: '1px',
      textUnderlineOffset: '3px'
    }
  }, term || children), open ? /*#__PURE__*/React.createElement("span", {
    id: id,
    role: "dialog",
    style: {
      position: 'absolute',
      zIndex: 20,
      top: 'calc(100% + 8px)',
      left: 0,
      width: 'min(300px, 76vw)',
      background: 'var(--surface)',
      border: '1px solid var(--neutral-200)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--elev-raised)',
      padding: '12px 14px',
      display: 'block',
      fontSize: 'var(--body-sm)',
      lineHeight: 'var(--body-sm-lh)',
      color: 'var(--neutral-700)',
      fontWeight: 'var(--weight-regular)',
      textAlign: 'left'
    }
  }, definition) : null);
}
Object.assign(__ds_scope, { Explainer });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Explainer.jsx", error: String((e && e.message) || e) }); }

// components/filing/Acknowledgement.jsx
try { (() => {
function Acknowledgement({
  ackNumber,
  filedOn,
  regime,
  itrForm,
  figure,
  animate = true
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface)',
      border: '1px solid var(--neutral-200)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      maxWidth: 'var(--ledger-max-width)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1px solid var(--credit-border)',
      background: 'var(--credit-tint)',
      borderRadius: 'var(--radius-none)',
      padding: '16px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      animation: animate ? 'nritax-stamp var(--motion-stamp) both' : undefined
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--label)',
      fontWeight: 'var(--weight-medium)',
      color: 'var(--credit-text)'
    }
  }, "Acknowledgement number"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-figure)',
      fontSize: 'var(--figure-lg)',
      letterSpacing: '0.04em',
      fontVariantNumeric: 'tabular-nums lining-nums',
      color: 'var(--credit-text)'
    }
  }, ackNumber)), /*#__PURE__*/React.createElement("dl", {
    style: {
      margin: 0,
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(140px, 100%), 1fr))',
      gap: '16px'
    }
  }, [['Filed on', filedOn], ['Form', itrForm], ['Regime', regime], ['Result', figure]].filter(([, v]) => v).map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2px'
    }
  }, /*#__PURE__*/React.createElement("dt", {
    style: {
      fontSize: 'var(--caption)',
      color: 'var(--neutral-500)'
    }
  }, k), /*#__PURE__*/React.createElement("dd", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-figure)',
      fontSize: 'var(--figure)',
      fontVariantNumeric: 'tabular-nums lining-nums',
      color: 'var(--ink)'
    }
  }, v)))));
}
Object.assign(__ds_scope, { Acknowledgement });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/filing/Acknowledgement.jsx", error: String((e && e.message) || e) }); }

// components/filing/DeadlineBanner.jsx
try { (() => {
/** d > 45 → 'quiet' | 15..45 → 'inline' | 4..14 → 'due' | 0..3 → 'notice' | d < 0 → 'belated' */
function deadlineTier(days) {
  if (days < 0) return 'belated';
  if (days <= 3) return 'notice';
  if (days <= 14) return 'due';
  if (days <= 45) return 'inline';
  return 'quiet';
}
const TONES = {
  inline: {
    background: 'var(--draft-tint)',
    color: 'var(--draft-text)',
    border: 'var(--draft-border)'
  },
  due: {
    background: 'var(--due-tint)',
    color: 'var(--due-text)',
    border: 'var(--due-border)'
  },
  notice: {
    background: 'var(--notice-tint)',
    color: 'var(--notice-text)',
    border: 'var(--notice-border)'
  },
  belated: {
    background: 'var(--notice-tint)',
    color: 'var(--notice-text)',
    border: 'var(--notice-border)'
  }
};
function DeadlineBanner({
  days,
  dueDate,
  hoursLeft,
  lateFee,
  revisedDeadline,
  action
}) {
  const tier = deadlineTier(days);
  if (tier === 'quiet') {
    return /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 'var(--body-sm)',
        color: 'var(--neutral-500)'
      }
    }, "Due date ", /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-figure)',
        fontVariantNumeric: 'tabular-nums lining-nums'
      }
    }, dueDate));
  }
  const t = TONES[tier];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      flexWrap: 'wrap',
      background: t.background,
      border: '1px solid ' + t.border,
      color: t.color,
      borderRadius: 'var(--radius-lg)',
      padding: '16px 20px'
    }
  }, tier === 'belated' ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      flex: 1,
      minWidth: '240px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--body)',
      fontWeight: 'var(--weight-medium)'
    }
  }, "The due date of ", dueDate, " has passed. You can still file a belated return under s.139(4)."), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--body-sm)',
      lineHeight: 'var(--body-sm-lh)'
    }
  }, "Late fee under s.234F: ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-figure)',
      fontVariantNumeric: 'tabular-nums lining-nums'
    }
  }, "\u20B9", lateFee), ". Belated returns close on ", revisedDeadline, ".")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-figure)',
      fontSize: 'var(--figure-lg)',
      lineHeight: 1,
      fontVariantNumeric: 'tabular-nums lining-nums'
    }
  }, days), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      flex: 1,
      minWidth: '200px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--body)',
      fontWeight: 'var(--weight-medium)'
    }
  }, days === 1 ? 'day' : 'days', " left to file for FY 2025-26"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--body-sm)',
      lineHeight: 'var(--body-sm-lh)'
    }
  }, "Due ", dueDate, tier === 'notice' && hoursLeft != null ? ', about ' + hoursLeft + ' hours left' : ''))), action);
}
Object.assign(__ds_scope, { deadlineTier, DeadlineBanner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/filing/DeadlineBanner.jsx", error: String((e && e.message) || e) }); }

// components/filing/DocumentUpload.jsx
try { (() => {
function DocumentUpload({
  state = 'idle',
  accepts = 'Form 16, 26AS, AIS, bank statements. PDF or image, up to 10 MB.',
  fileName,
  fields = [],
  error,
  onTakePhoto,
  onChooseFile,
  onPassword,
  onEditField,
  progressLabel = 'Reading your documents'
}) {
  if (state === 'idle') {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        border: '1px dashed var(--neutral-300)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--neutral-50)',
        minHeight: '140px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 'var(--body)',
        color: 'var(--ink)'
      }
    }, "Add a document"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Button, {
      variant: "primary",
      onClick: onTakePhoto
    }, "Take a photo"), /*#__PURE__*/React.createElement(__ds_scope.Button, {
      variant: "secondary",
      onClick: onChooseFile
    }, "Choose file")), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 'var(--body-sm)',
        lineHeight: 'var(--body-sm-lh)',
        color: 'var(--neutral-500)',
        maxWidth: '38ch'
      }
    }, accepts));
  }
  if (state === 'parsing') {
    return /*#__PURE__*/React.createElement("div", {
      role: "status",
      "aria-busy": "true",
      style: {
        border: '1px solid var(--neutral-200)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--surface)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: '12px'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--body)',
        color: 'var(--ink)'
      }
    }, fileName), /*#__PURE__*/React.createElement(__ds_scope.StatusPill, {
      tone: "info",
      label: progressLabel
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        height: '4px',
        background: 'var(--neutral-200)',
        borderRadius: 'var(--radius-full)',
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: '33%',
        height: '100%',
        background: 'var(--primary)',
        animation: 'nritax-indeterminate 1.2s ease-in-out infinite'
      }
    })));
  }
  if (state === 'password') {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        border: '1px solid var(--due-border)',
        background: 'var(--due-tint)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--body)',
        fontWeight: 'var(--weight-medium)',
        color: 'var(--due-text)'
      }
    }, fileName, " needs a password"), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 'var(--body-sm)',
        lineHeight: 'var(--body-sm-lh)',
        color: 'var(--due-text)'
      }
    }, "Often your PAN in lowercase followed by your date of birth."), /*#__PURE__*/React.createElement(__ds_scope.Button, {
      variant: "secondary",
      onClick: onPassword
    }, "Enter password"));
  }
  if (state === 'failed') {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        border: '1px solid var(--notice-border)',
        background: 'var(--notice-tint)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--body)',
        fontWeight: 'var(--weight-medium)',
        color: 'var(--notice-text)'
      }
    }, fileName), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 'var(--body-sm)',
        lineHeight: 'var(--body-sm-lh)',
        color: 'var(--notice-text)'
      }
    }, error), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: '8px'
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Button, {
      variant: "secondary",
      onClick: onChooseFile
    }, "Try another file"), /*#__PURE__*/React.createElement(__ds_scope.Button, {
      variant: "quiet",
      onClick: onEditField
    }, "Enter the figures myself")));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1px solid var(--neutral-200)',
      borderRadius: 'var(--radius-lg)',
      background: 'var(--surface)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: '12px',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--body)',
      color: 'var(--ink)'
    }
  }, fileName), /*#__PURE__*/React.createElement(__ds_scope.StatusPill, {
    tone: "credit",
    label: "Read"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column'
    }
  }, fields.map(f => /*#__PURE__*/React.createElement("div", {
    key: f.label,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '8px 0',
      borderTop: '1px solid var(--neutral-200)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 'var(--body-sm)',
      color: 'var(--neutral-700)'
    }
  }, f.label), f.uncertain ? /*#__PURE__*/React.createElement(__ds_scope.StatusPill, {
    tone: "due",
    label: "Check this"
  }) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-figure)',
      fontSize: 'var(--figure)',
      fontVariantNumeric: 'tabular-nums lining-nums',
      color: 'var(--ink)'
    }
  }, f.value), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "quiet",
    size: "compact",
    onClick: () => onEditField && onEditField(f)
  }, "Edit")))));
}
Object.assign(__ds_scope, { DocumentUpload });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/filing/DocumentUpload.jsx", error: String((e && e.message) || e) }); }

// components/filing/FilingProgress.jsx
try { (() => {
const FILING_STEPS = ['Your details', 'Income', 'Deductions', 'Taxes paid', 'Review', 'Pay', 'File and verify'];
function FilingProgress({
  steps = FILING_STEPS,
  current = 0,
  onStep,
  compact = false
}) {
  if (compact) {
    const pct = (current + 1) / steps.length * 100;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--label)',
        fontWeight: 'var(--weight-medium)',
        color: 'var(--neutral-700)'
      }
    }, steps[current]), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-figure)',
        fontSize: 'var(--statute)',
        color: 'var(--neutral-500)'
      }
    }, "Step ", current + 1, " of ", steps.length)), /*#__PURE__*/React.createElement("div", {
      role: "progressbar",
      "aria-valuenow": current + 1,
      "aria-valuemin": 1,
      "aria-valuemax": steps.length,
      style: {
        height: '4px',
        borderRadius: 'var(--radius-full)',
        background: 'var(--neutral-200)',
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: pct + '%',
        height: '100%',
        background: 'var(--primary)',
        transition: 'width var(--motion-panel)'
      }
    })));
  }
  return /*#__PURE__*/React.createElement("ol", {
    style: {
      listStyle: 'none',
      margin: 0,
      padding: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      flexWrap: 'wrap'
    }
  }, steps.map((s, i) => {
    const done = i < current,
      active = i === current;
    return /*#__PURE__*/React.createElement("li", {
      key: s,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      disabled: !done && !active,
      onClick: done && onStep ? () => onStep(i) : undefined,
      "aria-current": active ? 'step' : undefined,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        height: 'var(--control-height-compact)',
        padding: '0 10px',
        borderRadius: 'var(--radius-md)',
        border: 'none',
        background: active ? 'var(--info-tint)' : 'transparent',
        color: active ? 'var(--primary)' : done ? 'var(--neutral-700)' : 'var(--neutral-400)',
        fontSize: 'var(--label)',
        fontWeight: active ? 'var(--weight-semibold)' : 'var(--weight-medium)',
        cursor: done ? 'pointer' : 'default'
      }
    }, /*#__PURE__*/React.createElement("span", {
      "aria-hidden": "true",
      style: {
        width: '18px',
        height: '18px',
        borderRadius: 'var(--radius-full)',
        flex: '0 0 auto',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: done ? 'var(--credit)' : active ? 'var(--primary)' : 'var(--neutral-100)',
        color: done || active ? 'var(--surface)' : 'var(--neutral-500)',
        fontFamily: 'var(--font-figure)',
        fontSize: '10px'
      }
    }, done ? '✓' : i + 1), s), i < steps.length - 1 ? /*#__PURE__*/React.createElement("span", {
      "aria-hidden": "true",
      style: {
        width: '12px',
        height: '1px',
        background: 'var(--neutral-200)'
      }
    }) : null);
  }));
}
Object.assign(__ds_scope, { FILING_STEPS, FilingProgress });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/filing/FilingProgress.jsx", error: String((e && e.message) || e) }); }

// components/filing/TrustBar.jsx
try { (() => {
function TrustBar({
  marks = [],
  align = 'flex-start'
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: align,
      gap: '24px',
      background: 'var(--neutral-50)',
      border: '1px solid var(--neutral-200)',
      borderRadius: 'var(--radius-lg)',
      padding: '16px 20px'
    }
  }, marks.map(m => /*#__PURE__*/React.createElement("div", {
    key: m.name,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      height: '32px',
      justifyContent: 'center',
      filter: 'grayscale(1)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--label)',
      fontWeight: 'var(--weight-semibold)',
      color: 'var(--neutral-700)',
      letterSpacing: '0.02em'
    }
  }, m.name), m.reference ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-figure)',
      fontSize: 'var(--statute)',
      color: 'var(--neutral-500)'
    }
  }, m.reference) : null)));
}
Object.assign(__ds_scope, { TrustBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/filing/TrustBar.jsx", error: String((e && e.message) || e) }); }

// components/forms/CharacterBoxInput.jsx
try { (() => {
const PRESETS = {
  pan: {
    length: 10,
    groups: [5, 4, 1],
    inputMode: 'text',
    autoCapitalize: 'characters',
    pattern: /^[A-Z]{5}[0-9]{4}[A-Z]$/
  },
  tan: {
    length: 10,
    groups: [4, 5, 1],
    inputMode: 'text',
    autoCapitalize: 'characters',
    pattern: /^[A-Z]{4}[0-9]{5}[A-Z]$/
  },
  aadhaar: {
    length: 12,
    groups: [4, 4, 4],
    inputMode: 'numeric',
    autoCapitalize: 'off',
    pattern: /^[0-9]{12}$/
  },
  ifsc: {
    length: 11,
    groups: [4, 7],
    inputMode: 'text',
    autoCapitalize: 'characters',
    pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/
  }
};
function maskAadhaar(v) {
  const d = String(v || '').replace(/\D/g, '');
  return d.length < 12 ? d : 'XXXX XXXX ' + d.slice(-4);
}
function CharacterBoxInput({
  kind = 'pan',
  label,
  hint,
  error,
  value = '',
  onChange,
  id,
  name
}) {
  const cfg = PRESETS[kind];
  const rid = React.useMemo(() => id || 'cbox-' + Math.random().toString(36).slice(2, 8), [id]);
  const ref = React.useRef(null);
  const [caret, setCaret] = React.useState(-1);
  const clean = String(value).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, cfg.length);
  const chars = clean.split('');
  const boxes = [];
  let idx = 0;
  cfg.groups.forEach((size, g) => {
    for (let i = 0; i < size; i++, idx++) {
      const active = caret === idx || caret === -1 && false;
      const filled = chars[idx] !== undefined;
      boxes.push(/*#__PURE__*/React.createElement("div", {
        key: idx,
        "aria-hidden": "true",
        style: {
          width: 'var(--charbox-width)',
          height: 'var(--charbox-height)',
          borderRadius: 'var(--radius-xs)',
          border: '1px solid ' + (error ? 'var(--notice)' : active ? 'var(--primary)' : 'var(--neutral-300)'),
          borderBottom: filled ? '2px solid var(--primary-300)' : undefined,
          background: 'var(--surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-figure)',
          fontSize: 'var(--figure)',
          color: 'var(--ink)',
          boxShadow: active ? error ? 'var(--focus-ring-danger)' : 'var(--focus-ring)' : 'none',
          transition: 'border-color var(--motion-instant)'
        }
      }, chars[idx] || ''));
    }
    if (g < cfg.groups.length - 1) boxes.push(/*#__PURE__*/React.createElement("span", {
      key: 'g' + g,
      "aria-hidden": "true",
      style: {
        width: 'calc(var(--charbox-group-gap) - var(--charbox-gap))'
      }
    }));
  });
  const valid = clean.length === cfg.length ? cfg.pattern.test(clean) : null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    }
  }, label ? /*#__PURE__*/React.createElement("label", {
    htmlFor: rid,
    style: {
      fontSize: 'var(--label)',
      lineHeight: 'var(--label-lh)',
      fontWeight: 'var(--weight-medium)',
      color: 'var(--neutral-700)'
    }
  }, label) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    },
    onClick: () => ref.current && ref.current.focus()
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--charbox-gap)',
      alignItems: 'center'
    }
  }, boxes), /*#__PURE__*/React.createElement("input", {
    ref: ref,
    id: rid,
    name: name,
    value: clean,
    inputMode: cfg.inputMode,
    autoCapitalize: cfg.autoCapitalize,
    autoComplete: "off",
    maxLength: cfg.length,
    "aria-describedby": error ? rid + '-err' : rid + '-hint',
    "aria-invalid": error ? true : undefined,
    onChange: e => {
      const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, cfg.length);
      onChange && onChange(v);
      setCaret(Math.min(v.length, cfg.length - 1));
    },
    onFocus: () => setCaret(Math.min(clean.length, cfg.length - 1)),
    onBlur: () => setCaret(-1),
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      opacity: 0,
      border: 'none',
      background: 'transparent',
      font: 'inherit',
      letterSpacing: '1em',
      color: 'transparent',
      caretColor: 'transparent'
    }
  })), error ? /*#__PURE__*/React.createElement("span", {
    id: rid + '-err',
    role: "alert",
    style: {
      fontSize: 'var(--body-sm)',
      color: 'var(--notice-text)'
    }
  }, error) : /*#__PURE__*/React.createElement("span", {
    id: rid + '-hint',
    style: {
      fontSize: 'var(--body-sm)',
      lineHeight: 'var(--body-sm-lh)',
      color: valid === false ? 'var(--notice-text)' : 'var(--neutral-500)'
    }
  }, valid === false ? kind.toUpperCase() + ' format looks wrong. Check the characters against your card.' : hint));
}
Object.assign(__ds_scope, { maskAadhaar, CharacterBoxInput });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/CharacterBoxInput.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function Checkbox({
  label,
  hint,
  checked = false,
  onChange,
  disabled,
  id
}) {
  const rid = React.useMemo(() => id || 'cb-' + Math.random().toString(36).slice(2, 8), [id]);
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '10px',
      alignItems: 'flex-start',
      minHeight: '44px',
      paddingTop: '2px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'inline-flex',
      width: '20px',
      height: '20px',
      marginTop: '11px',
      flex: '0 0 auto'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    id: rid,
    checked: checked,
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.checked),
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      position: 'absolute',
      inset: 0,
      margin: 0,
      opacity: 0,
      width: '100%',
      height: '100%'
    }
  }), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: '20px',
      height: '20px',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid ' + (checked ? 'var(--primary)' : 'var(--neutral-300)'),
      background: disabled ? 'var(--neutral-100)' : checked ? 'var(--primary)' : 'var(--surface)',
      boxShadow: focus ? 'var(--focus-ring)' : 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background-color var(--motion-instant), border-color var(--motion-instant)'
    }
  }, checked ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: '9px',
      height: '5px',
      borderLeft: '2px solid var(--surface)',
      borderBottom: '2px solid var(--surface)',
      transform: 'translateY(-1px) rotate(-45deg)'
    }
  }) : null)), /*#__PURE__*/React.createElement("label", {
    htmlFor: rid,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      paddingTop: '9px',
      cursor: disabled ? 'not-allowed' : 'pointer'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--body)',
      lineHeight: 'var(--body-lh)',
      color: disabled ? 'var(--neutral-400)' : 'var(--ink)'
    }
  }, label), hint ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--body-sm)',
      lineHeight: 'var(--body-sm-lh)',
      color: 'var(--neutral-500)'
    }
  }, hint) : null));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Input({
  label,
  hint,
  error,
  required,
  prefix,
  suffix,
  id,
  align = 'left',
  mono = false,
  value,
  onChange,
  ...rest
}) {
  const rid = React.useMemo(() => id || 'in-' + Math.random().toString(36).slice(2, 8), [id]);
  const [focus, setFocus] = React.useState(false);
  const borderColor = error ? 'var(--notice)' : focus ? 'var(--primary)' : 'var(--neutral-300)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    }
  }, label ? /*#__PURE__*/React.createElement("label", {
    htmlFor: rid,
    style: {
      fontSize: 'var(--label)',
      lineHeight: 'var(--label-lh)',
      fontWeight: 'var(--weight-medium)',
      color: 'var(--neutral-700)'
    }
  }, label, required ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--neutral-500)',
      fontWeight: 400
    }
  }, " (required)") : null) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: 'var(--surface)',
      border: '1px solid ' + borderColor,
      borderRadius: 'var(--radius-sm)',
      padding: '0 var(--input-pad-x)',
      height: 'var(--control-height)',
      boxShadow: focus ? error ? 'var(--focus-ring-danger)' : 'var(--focus-ring)' : 'none',
      transition: 'border-color var(--motion-instant)'
    }
  }, prefix ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--neutral-500)',
      fontFamily: mono ? 'var(--font-figure)' : 'inherit'
    }
  }, prefix) : null, /*#__PURE__*/React.createElement("input", _extends({
    id: rid,
    value: value,
    onChange: onChange,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? rid + '-err' : hint ? rid + '-hint' : undefined,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      minWidth: 0,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      padding: 'var(--input-pad-y) 0',
      textAlign: align,
      color: 'var(--ink)',
      fontFamily: mono ? 'var(--font-figure)' : 'var(--font-ui)',
      fontSize: mono ? 'var(--figure)' : 'var(--body)',
      fontVariantNumeric: 'tabular-nums lining-nums'
    }
  }, rest)), suffix), error ? /*#__PURE__*/React.createElement("span", {
    id: rid + '-err',
    role: "alert",
    style: {
      fontSize: 'var(--body-sm)',
      lineHeight: 'var(--body-sm-lh)',
      color: 'var(--notice-text)'
    }
  }, error) : hint ? /*#__PURE__*/React.createElement("span", {
    id: rid + '-hint',
    style: {
      fontSize: 'var(--body-sm)',
      lineHeight: 'var(--body-sm-lh)',
      color: 'var(--neutral-500)'
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/MoneyInput.jsx
try { (() => {
const inr = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0
});
const formatINR = n => inr.format(Math.round(Number(n) || 0));
const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
function under100(n) {
  return n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
}
function under1000(n) {
  const h = Math.floor(n / 100),
    r = n % 100;
  return [h ? ONES[h] + ' hundred' : '', r ? under100(r) : ''].filter(Boolean).join(' ');
}

/** Indian-system words: crore, lakh, thousand, hundred. */
function amountInWords(value) {
  let n = Math.round(Number(value) || 0);
  if (n === 0) return 'Zero';
  const parts = [];
  const cr = Math.floor(n / 10000000);
  n %= 10000000;
  const lk = Math.floor(n / 100000);
  n %= 100000;
  const th = Math.floor(n / 1000);
  n %= 1000;
  if (cr) parts.push(under1000(cr) + ' crore');
  if (lk) parts.push(under100(lk) + ' lakh');
  if (th) parts.push(under100(th) + ' thousand');
  if (n) parts.push(under1000(n));
  const s = parts.join(' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function MoneyInput({
  label,
  hint,
  error,
  required,
  value = '',
  onChange,
  source,
  onSourceClick,
  id,
  disabled
}) {
  const rid = React.useMemo(() => id || 'money-' + Math.random().toString(36).slice(2, 8), [id]);
  const [focus, setFocus] = React.useState(false);
  const raw = String(value).replace(/[^0-9.]/g, '');
  const display = focus ? raw : raw === '' ? '' : formatINR(raw);
  const num = Number(raw || 0);
  const borderColor = error ? 'var(--notice)' : focus ? 'var(--primary)' : 'var(--neutral-300)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    }
  }, label ? /*#__PURE__*/React.createElement("label", {
    htmlFor: rid,
    style: {
      fontSize: 'var(--label)',
      lineHeight: 'var(--label-lh)',
      fontWeight: 'var(--weight-medium)',
      color: 'var(--neutral-700)'
    }
  }, label, required ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--neutral-500)',
      fontWeight: 400
    }
  }, " (required)") : null) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: disabled ? 'var(--neutral-100)' : 'var(--surface)',
      border: '1px solid ' + borderColor,
      borderRadius: 'var(--radius-sm)',
      padding: '0 var(--input-pad-x)',
      height: 'var(--control-height)',
      boxShadow: focus ? error ? 'var(--focus-ring-danger)' : 'var(--focus-ring)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      color: 'var(--neutral-500)',
      fontFamily: 'var(--font-figure)',
      fontSize: 'var(--figure)'
    }
  }, "\u20B9"), /*#__PURE__*/React.createElement("input", {
    id: rid,
    inputMode: "decimal",
    disabled: disabled,
    value: display,
    onChange: e => onChange && onChange(e.target.value.replace(/[^0-9.]/g, '')),
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? rid + '-err' : rid + '-words',
    style: {
      flex: 1,
      minWidth: 0,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      textAlign: 'right',
      fontFamily: 'var(--font-figure)',
      fontSize: 'var(--figure)',
      fontVariantNumeric: 'tabular-nums lining-nums',
      color: 'var(--ink)',
      padding: 'var(--input-pad-y) 0'
    }
  }), source ? /*#__PURE__*/React.createElement(__ds_scope.StatuteChip, {
    source: true,
    onClick: onSourceClick
  }, source) : null), error ? /*#__PURE__*/React.createElement("span", {
    id: rid + '-err',
    role: "alert",
    style: {
      fontSize: 'var(--body-sm)',
      color: 'var(--notice-text)'
    }
  }, error) : /*#__PURE__*/React.createElement("span", {
    id: rid + '-words',
    style: {
      fontSize: 'var(--body-sm)',
      lineHeight: 'var(--body-sm-lh)',
      color: 'var(--neutral-500)'
    }
  }, num >= 100000 ? amountInWords(num) : hint));
}
Object.assign(__ds_scope, { formatINR, amountInWords, MoneyInput });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/MoneyInput.jsx", error: String((e && e.message) || e) }); }

// components/forms/RadioGroup.jsx
try { (() => {
function RadioGroup({
  label,
  hint,
  name,
  options = [],
  value,
  onChange
}) {
  const gid = React.useMemo(() => name || 'rg-' + Math.random().toString(36).slice(2, 8), [name]);
  return /*#__PURE__*/React.createElement("fieldset", {
    style: {
      border: 'none',
      margin: 0,
      padding: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    }
  }, label ? /*#__PURE__*/React.createElement("legend", {
    style: {
      padding: 0,
      marginBottom: '6px',
      fontSize: 'var(--label)',
      lineHeight: 'var(--label-lh)',
      fontWeight: 'var(--weight-medium)',
      color: 'var(--neutral-700)'
    }
  }, label) : null, hint ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--body-sm)',
      color: 'var(--neutral-500)',
      marginBottom: '4px'
    }
  }, hint) : null, options.map(o => /*#__PURE__*/React.createElement(Radio, {
    key: o.value,
    name: gid,
    option: o,
    checked: value === o.value,
    onChange: onChange
  })));
}
function Radio({
  name,
  option,
  checked,
  onChange
}) {
  const rid = name + '-' + option.value;
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '10px',
      alignItems: 'flex-start',
      minHeight: '44px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'inline-flex',
      width: '20px',
      height: '20px',
      marginTop: '11px',
      flex: '0 0 auto'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "radio",
    id: rid,
    name: name,
    checked: checked,
    value: option.value,
    onChange: () => onChange && onChange(option.value),
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      position: 'absolute',
      inset: 0,
      margin: 0,
      opacity: 0,
      width: '100%',
      height: '100%'
    }
  }), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: '20px',
      height: '20px',
      borderRadius: 'var(--radius-full)',
      border: '1px solid ' + (checked ? 'var(--primary)' : 'var(--neutral-300)'),
      background: 'var(--surface)',
      boxShadow: focus ? 'var(--focus-ring)' : 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, checked ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: '10px',
      height: '10px',
      borderRadius: 'var(--radius-full)',
      background: 'var(--primary)'
    }
  }) : null)), /*#__PURE__*/React.createElement("label", {
    htmlFor: rid,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      paddingTop: '9px',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--body)',
      lineHeight: 'var(--body-lh)',
      color: 'var(--ink)'
    }
  }, option.label), option.hint ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--body-sm)',
      lineHeight: 'var(--body-sm-lh)',
      color: 'var(--neutral-500)'
    }
  }, option.hint) : null));
}
Object.assign(__ds_scope, { RadioGroup });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/RadioGroup.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function Select({
  label,
  hint,
  error,
  required,
  options = [],
  value,
  onChange,
  id,
  disabled
}) {
  const rid = React.useMemo(() => id || 'sel-' + Math.random().toString(36).slice(2, 8), [id]);
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    }
  }, label ? /*#__PURE__*/React.createElement("label", {
    htmlFor: rid,
    style: {
      fontSize: 'var(--label)',
      lineHeight: 'var(--label-lh)',
      fontWeight: 'var(--weight-medium)',
      color: 'var(--neutral-700)'
    }
  }, label, required ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--neutral-500)',
      fontWeight: 400
    }
  }, " (required)") : null) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("select", {
    id: rid,
    value: value,
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.value),
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? rid + '-err' : undefined,
    style: {
      appearance: 'none',
      WebkitAppearance: 'none',
      width: '100%',
      height: 'var(--control-height)',
      padding: '0 36px 0 var(--input-pad-x)',
      background: disabled ? 'var(--neutral-100)' : 'var(--surface)',
      color: disabled ? 'var(--neutral-400)' : 'var(--ink)',
      border: '1px solid ' + (error ? 'var(--notice)' : focus ? 'var(--primary)' : 'var(--neutral-300)'),
      borderRadius: 'var(--radius-sm)',
      fontSize: 'var(--body)',
      boxShadow: focus ? 'var(--focus-ring)' : 'none',
      cursor: disabled ? 'not-allowed' : 'pointer'
    }
  }, options.map(o => /*#__PURE__*/React.createElement("option", {
    key: o.value,
    value: o.value
  }, o.label))), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      right: '12px',
      width: '8px',
      height: '8px',
      borderRight: '1.5px solid var(--neutral-400)',
      borderBottom: '1.5px solid var(--neutral-400)',
      transform: 'translateY(-2px) rotate(45deg)',
      pointerEvents: 'none'
    }
  })), error ? /*#__PURE__*/React.createElement("span", {
    id: rid + '-err',
    role: "alert",
    style: {
      fontSize: 'var(--body-sm)',
      color: 'var(--notice-text)'
    }
  }, error) : hint ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--body-sm)',
      lineHeight: 'var(--body-sm-lh)',
      color: 'var(--neutral-500)'
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function Switch({
  label,
  hint,
  checked = false,
  onChange,
  disabled,
  id
}) {
  const rid = React.useMemo(() => id || 'sw-' + Math.random().toString(36).slice(2, 8), [id]);
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      minHeight: '44px'
    }
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: rid,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      cursor: disabled ? 'not-allowed' : 'pointer'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--body)',
      lineHeight: 'var(--body-lh)',
      color: disabled ? 'var(--neutral-400)' : 'var(--ink)'
    }
  }, label), hint ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--body-sm)',
      lineHeight: 'var(--body-sm-lh)',
      color: 'var(--neutral-500)'
    }
  }, hint) : null), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      flex: '0 0 auto',
      width: '44px',
      height: '26px'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    role: "switch",
    id: rid,
    checked: checked,
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.checked),
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      position: 'absolute',
      inset: 0,
      margin: 0,
      opacity: 0,
      width: '100%',
      height: '100%'
    }
  }), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      display: 'block',
      width: '44px',
      height: '26px',
      borderRadius: 'var(--radius-full)',
      background: disabled ? 'var(--neutral-100)' : checked ? 'var(--primary)' : 'var(--neutral-300)',
      boxShadow: focus ? 'var(--focus-ring)' : 'none',
      transition: 'background-color var(--motion-quick)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      top: '3px',
      left: checked ? '21px' : '3px',
      width: '20px',
      height: '20px',
      borderRadius: 'var(--radius-full)',
      background: 'var(--surface)',
      transition: 'left var(--motion-quick)'
    }
  })));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/ledger/DataTable.jsx
try { (() => {
const inr = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0
});
function DataTable({
  columns = [],
  rows = [],
  stacked = false,
  caption,
  rowAction
}) {
  if (stacked) {
    const lead = columns.find(c => c.amount) || columns[0];
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }
    }, rows.map((r, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        background: 'var(--surface)',
        border: '1px solid var(--neutral-200)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-figure)',
        fontSize: 'var(--figure-lg)',
        fontVariantNumeric: 'tabular-nums lining-nums',
        color: 'var(--ink)'
      }
    }, "\u20B9", inr.format(r[lead.key])), columns.filter(c => c.key !== lead.key).map(c => /*#__PURE__*/React.createElement("div", {
      key: c.key,
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: '12px',
        fontSize: 'var(--body-sm)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--neutral-500)'
      }
    }, c.header), /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--ink)',
        fontFamily: c.amount ? 'var(--font-figure)' : 'var(--font-ui)',
        fontVariantNumeric: 'tabular-nums lining-nums'
      }
    }, c.amount ? '₹' + inr.format(r[c.key]) : r[c.key]))))));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1px solid var(--neutral-200)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      background: 'var(--surface)'
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse'
    }
  }, caption ? /*#__PURE__*/React.createElement("caption", {
    style: {
      captionSide: 'bottom',
      textAlign: 'left',
      padding: '12px 16px',
      fontSize: 'var(--caption)',
      color: 'var(--neutral-500)'
    }
  }, caption) : null, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, columns.map(c => /*#__PURE__*/React.createElement("th", {
    key: c.key,
    scope: "col",
    style: {
      position: 'sticky',
      top: 0,
      background: 'var(--neutral-50)',
      textAlign: c.amount ? 'right' : 'left',
      padding: '10px 16px',
      fontSize: 'var(--label)',
      lineHeight: 'var(--label-lh)',
      fontWeight: 'var(--weight-medium)',
      color: 'var(--neutral-700)',
      borderBottom: '1px solid var(--neutral-200)',
      whiteSpace: 'nowrap'
    }
  }, c.header)), rowAction ? /*#__PURE__*/React.createElement("th", {
    scope: "col",
    style: {
      position: 'sticky',
      top: 0,
      background: 'var(--neutral-50)',
      borderBottom: '1px solid var(--neutral-200)',
      width: '44px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      width: 1,
      height: 1,
      overflow: 'hidden',
      clip: 'rect(0 0 0 0)'
    }
  }, "Actions")) : null)), /*#__PURE__*/React.createElement("tbody", null, rows.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: i,
    style: {
      background: i % 2 ? 'var(--surface)' : 'var(--neutral-50)'
    }
  }, columns.map(c => /*#__PURE__*/React.createElement("td", {
    key: c.key,
    style: {
      padding: '10px 16px',
      textAlign: c.amount ? 'right' : 'left',
      fontFamily: c.amount ? 'var(--font-figure)' : 'var(--font-ui)',
      fontSize: c.amount ? 'var(--figure)' : 'var(--body-sm)',
      fontVariantNumeric: 'tabular-nums lining-nums',
      color: 'var(--ink)',
      borderBottom: '1px solid var(--neutral-200)'
    }
  }, c.amount ? '₹' + inr.format(r[c.key]) : r[c.key])), rowAction ? /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '6px 8px',
      textAlign: 'right',
      borderBottom: '1px solid var(--neutral-200)'
    }
  }, rowAction(r, i)) : null)))));
}
Object.assign(__ds_scope, { DataTable });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/ledger/DataTable.jsx", error: String((e && e.message) || e) }); }

// components/ledger/HeroFigure.jsx
try { (() => {
const inr = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0
});
function HeroFigure({
  label,
  amount,
  tone = 'ink',
  note,
  size = 'xl',
  stamp = false
}) {
  const color = tone === 'credit' ? 'var(--credit)' : 'var(--ink)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      animation: stamp ? 'nritax-stamp var(--motion-stamp) both' : undefined
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--label)',
      lineHeight: 'var(--label-lh)',
      fontWeight: 'var(--weight-medium)',
      color: 'var(--neutral-700)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-figure)',
      fontVariantNumeric: 'tabular-nums lining-nums',
      fontSize: size === 'xl' ? 'var(--figure-xl)' : 'var(--figure-lg)',
      lineHeight: size === 'xl' ? 'var(--figure-xl-lh)' : 'var(--figure-lg-lh)',
      fontWeight: 'var(--weight-medium)',
      color
    }
  }, "\u20B9", inr.format(Math.abs(Math.round(amount)))), note ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--body-sm)',
      lineHeight: 'var(--body-sm-lh)',
      color: 'var(--neutral-500)'
    }
  }, note) : null);
}
Object.assign(__ds_scope, { HeroFigure });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/ledger/HeroFigure.jsx", error: String((e && e.message) || e) }); }

// components/ledger/LedgerBlock.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const inr = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0
});
const formatFigure = v => typeof v === 'number' ? inr.format(Math.round(v)) : v;
const HEADS = {
  salary: 'var(--head-salary)',
  house: 'var(--head-house)',
  capgains: 'var(--head-capgains)',
  business: 'var(--head-business)',
  other: 'var(--head-other)',
  foreign: 'var(--head-foreign)'
};
function LedgerBlock({
  rows = [],
  caption,
  currencyHeader = true,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface)',
      border: '1px solid var(--neutral-200)',
      borderRadius: 'var(--radius-none)',
      padding: '20px',
      maxWidth: 'var(--ledger-max-width)',
      ...style
    }
  }, currencyHeader ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      paddingBottom: '8px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 'var(--ledger-amount-col)',
      textAlign: 'right',
      fontFamily: 'var(--font-figure)',
      fontSize: 'var(--statute)',
      color: 'var(--neutral-500)'
    }
  }, "\u20B9")) : null, /*#__PURE__*/React.createElement("div", {
    role: "table",
    style: {
      display: 'flex',
      flexDirection: 'column'
    }
  }, rows.map((r, i) => /*#__PURE__*/React.createElement(LedgerRow, _extends({
    key: i
  }, r)))), caption ? /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: '12px',
      fontSize: 'var(--caption)',
      lineHeight: 'var(--caption-lh)',
      color: 'var(--neutral-500)'
    }
  }, caption) : null);
}
function LedgerRow({
  label,
  statute,
  amount,
  kind = 'row',
  head,
  edited,
  onEditRevert
}) {
  const isFinal = kind === 'final';
  const isSub = kind === 'subtotal';
  return /*#__PURE__*/React.createElement("div", {
    role: "row",
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: 'var(--ledger-row-pad-y) 0',
      borderLeft: head ? '3px solid ' + HEADS[head] : '3px solid transparent',
      paddingLeft: '9px',
      marginLeft: '-12px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'baseline',
      gap: '8px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--body-sm)',
      lineHeight: 'var(--body-sm-lh)',
      color: 'var(--ink)',
      fontWeight: isFinal ? 'var(--weight-semibold)' : isSub ? 'var(--weight-medium)' : 'var(--weight-regular)'
    }
  }, label), edited ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onEditRevert,
    style: {
      background: 'var(--due-tint)',
      color: 'var(--due-text)',
      border: '1px solid var(--due-border)',
      borderRadius: 'var(--radius-xs)',
      fontSize: 'var(--statute)',
      fontFamily: 'var(--font-figure)',
      padding: '1px 5px',
      cursor: 'pointer'
    }
  }, "Edited") : null), statute ? /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '0 0 auto',
      textAlign: 'right',
      paddingTop: '2px'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.StatuteChip, null, statute)) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '0 0 var(--ledger-amount-col)',
      width: 'var(--ledger-amount-col)'
    }
  }, isSub || isFinal ? /*#__PURE__*/React.createElement(Rule, {
    double: isFinal
  }) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      textAlign: 'right',
      fontFamily: 'var(--font-figure)',
      fontVariantNumeric: 'tabular-nums lining-nums',
      fontSize: isFinal ? 'var(--figure-lg)' : 'var(--figure)',
      lineHeight: isFinal ? 'var(--figure-lg-lh)' : 'var(--figure-lh)',
      fontWeight: isFinal ? 'var(--weight-medium)' : 'var(--weight-regular)',
      color: 'var(--ink)'
    }
  }, formatFigure(amount))));
}
function Rule({
  double
}) {
  return /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    style: {
      marginBottom: '6px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: '1px',
      background: double ? 'var(--ink)' : 'var(--neutral-200)'
    }
  }), double ? /*#__PURE__*/React.createElement("div", {
    style: {
      height: '1px',
      background: 'var(--ink)',
      marginTop: 'var(--ledger-double-rule-gap)'
    }
  }) : null);
}
Object.assign(__ds_scope, { formatFigure, LedgerBlock, LedgerRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/ledger/LedgerBlock.jsx", error: String((e && e.message) || e) }); }

// components/ledger/RegimeComparison.jsx
try { (() => {
const inr = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0
});
function RegimeComparison({
  oldRegime,
  newRegime,
  selected = 'new',
  onSelect,
  switchNote
}) {
  const delta = oldRegime.tax - newRegime.tax;
  const material = Math.abs(delta) >= 500;
  const winner = !material ? null : delta > 0 ? 'new' : 'old';
  const sentence = !material ? 'Both regimes cost about the same' : (winner === 'new' ? 'New regime saves you ₹' : 'Old regime saves you ₹') + inr.format(Math.abs(delta));
  const columns = [{
    key: 'new',
    data: newRegime,
    title: 'New regime'
  }, {
    key: 'old',
    data: oldRegime,
    title: 'Old regime'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
      gap: '16px'
    }
  }, columns.map(({
    key,
    data,
    title
  }) => {
    const isWinner = winner === key;
    const isSelected = selected === key;
    return /*#__PURE__*/React.createElement("div", {
      key: key,
      style: {
        border: isWinner ? '2px solid var(--credit)' : '1px solid var(--neutral-200)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--surface)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px'
      }
    }, /*#__PURE__*/React.createElement("h3", {
      style: {
        fontSize: 'var(--h3)',
        lineHeight: 'var(--h3-lh)',
        fontWeight: 'var(--weight-semibold)',
        color: 'var(--ink)'
      }
    }, title), isWinner ? /*#__PURE__*/React.createElement(__ds_scope.StatusPill, {
      tone: "credit",
      label: "Lower tax"
    }) : null), /*#__PURE__*/React.createElement(__ds_scope.LedgerBlock, {
      currencyHeader: false,
      style: {
        border: 'none',
        padding: 0,
        maxWidth: 'none'
      },
      rows: data.rows
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        borderTop: '1px solid var(--neutral-200)',
        paddingTop: '12px',
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--body-sm)',
        fontWeight: 'var(--weight-medium)',
        color: 'var(--ink)'
      }
    }, "Tax with cess"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-figure)',
        fontSize: 'var(--figure-lg)',
        fontVariantNumeric: 'tabular-nums lining-nums',
        color: 'var(--ink)'
      }
    }, "\u20B9", inr.format(data.tax))), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => onSelect && onSelect(key),
      style: {
        height: 'var(--control-height)',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        fontSize: 'var(--label)',
        fontWeight: 'var(--weight-medium)',
        background: isSelected ? 'var(--primary)' : 'var(--surface)',
        color: isSelected ? 'var(--surface)' : 'var(--ink)',
        border: '1px solid ' + (isSelected ? 'var(--primary)' : 'var(--neutral-300)')
      }
    }, isSelected ? 'Filing under this regime' : 'File under this regime'));
  })), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--body)',
      lineHeight: 'var(--body-lh)',
      color: 'var(--ink)'
    }
  }, sentence), switchNote ? /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--body-sm)',
      lineHeight: 'var(--body-sm-lh)',
      color: 'var(--neutral-500)'
    }
  }, switchNote) : null);
}
Object.assign(__ds_scope, { RegimeComparison });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/ledger/RegimeComparison.jsx", error: String((e && e.message) || e) }); }

// components/navigation/AppShell.jsx
try { (() => {
function SealMark({ size = 36, title = 'NRITAX 2.0' }) {
  const gid = React.useId ? React.useId().replace(/:/g, '') : ('s' + Math.random().toString(36).slice(2, 8));
  return /*#__PURE__*/React.createElement("svg", {
    width: size, height: size, viewBox: "0 0 64 64", role: "img", "aria-label": title,
    style: { flex: 'none', display: 'block' }
  }, /*#__PURE__*/React.createElement("circle", { cx: "32", cy: "32", r: "30", fill: "#141C29", stroke: "#0D6B5B", strokeWidth: "2.5" }),
  /*#__PURE__*/React.createElement("circle", { cx: "32", cy: "30", r: "22", fill: "url(#" + gid + ")" }),
  /*#__PURE__*/React.createElement("text", { x: "32", y: "36", textAnchor: "middle", fontFamily: "ui-monospace,SF Mono,Menlo,monospace", fontSize: "16", fontWeight: "700", fill: "#8FE3D0", letterSpacing: "0.04em" }, "NT"),
  /*#__PURE__*/React.createElement("text", { x: "32", y: "48", textAnchor: "middle", fontFamily: "ui-monospace,SF Mono,Menlo,monospace", fontSize: "6.5", fontWeight: "600", fill: "#6E8FA0", letterSpacing: "0.18em" }, "2.0"),
  /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("radialGradient", { id: gid, cx: "50%", cy: "42%", r: "55%" },
    /*#__PURE__*/React.createElement("stop", { offset: "0%", stopColor: "#0D6B5B", stopOpacity: "0.45" }),
    /*#__PURE__*/React.createElement("stop", { offset: "100%", stopColor: "#0D6B5B", stopOpacity: "0.06" }))));
}
function Wordmark({ color = 'var(--surface)', size = 17 }) {
  return /*#__PURE__*/React.createElement("span", {
    style: { fontFamily: 'var(--font-display)', fontVariationSettings: 'var(--font-display-settings)', fontWeight: 'var(--weight-semibold)', fontSize: size + 'px', letterSpacing: '0.01em', color, whiteSpace: 'nowrap', lineHeight: 1 }
  }, "NRITAX ", /*#__PURE__*/React.createElement("span", { style: { fontFamily: 'var(--font-figure)', fontWeight: 'var(--weight-medium)', fontSize: size * 0.8 + 'px' } }, "2.0"));
}
function BrandLockup({ color = 'var(--surface)', sealSize = 36, wordSize = 17 }) {
  return /*#__PURE__*/React.createElement("span", { style: { display: 'inline-flex', alignItems: 'center', gap: '10px', minWidth: 0 } },
    /*#__PURE__*/React.createElement(SealMark, { size: sealSize }),
    /*#__PURE__*/React.createElement(Wordmark, { color, size: wordSize }));
}
function AppShell({ nav, right, children, footer }) {
  return /*#__PURE__*/React.createElement("div", { style: { display: 'flex', flexDirection: 'column', minHeight: '100%', background: 'var(--paper)' } },
    /*#__PURE__*/React.createElement("header", { style: { height: 'var(--shell-header-height)', flex: '0 0 auto', background: 'var(--ink)', color: 'var(--surface)', display: 'flex', alignItems: 'center', gap: '12px', padding: '0 var(--gutter-mobile)', overflow: 'hidden', borderBottom: '3px solid var(--seal)' } },
      /*#__PURE__*/React.createElement("span", { style: { flex: '0 0 auto' } }, /*#__PURE__*/React.createElement(BrandLockup, null)),
      /*#__PURE__*/React.createElement("nav", { style: { display: 'flex', alignItems: 'center', gap: '4px', flex: '1 1 auto', minWidth: 0, overflowX: 'auto', overflowY: 'hidden', scrollbarWidth: 'none', msOverflowStyle: 'none' } },
        (nav || []).map(n => /*#__PURE__*/React.createElement("button", { key: n.label, type: "button", onClick: n.onClick, style: { background: n.active ? 'rgba(255,255,255,0.10)' : 'transparent', border: 'none', color: n.active ? 'var(--surface)' : 'rgba(255,255,255,0.72)', height: 'var(--control-height-compact)', padding: '0 12px', borderRadius: 'var(--radius-control)', fontSize: 'var(--label)', fontWeight: 'var(--weight-medium)', cursor: 'pointer', whiteSpace: 'nowrap', flex: '0 0 auto', transition: 'background-color var(--motion-instant), color var(--motion-instant)' } }, n.label))),
      /*#__PURE__*/React.createElement("span", { style: { flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: '12px' } }, right)),
    /*#__PURE__*/React.createElement("main", { style: { flex: 1, minHeight: 0, overflow: 'auto' } }, children), footer);
}
function StickyActionBar({ children, note }) {
  return /*#__PURE__*/React.createElement("div", { style: { position: 'sticky', bottom: 0, background: 'var(--surface)', boxShadow: 'var(--elev-sticky)', padding: '12px var(--gutter-mobile)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'space-between' } },
    note ? /*#__PURE__*/React.createElement("span", { style: { fontSize: 'var(--body-sm)', color: 'var(--neutral-500)' } }, note) : null,
    /*#__PURE__*/React.createElement("div", { style: { display: 'flex', gap: '8px', marginLeft: 'auto' } }, children));
}
Object.assign(__ds_scope, { SealMark, Wordmark, BrandLockup, AppShell, StickyActionBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/AppShell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/filing_app/Dashboard.jsx
try { (() => {
(function () {
  const {
    Card,
    CardHeader,
    Button,
    StatusPill,
    DeadlineBanner,
    LedgerBlock,
    HeroFigure,
    EmptyState,
    DataTable
  } = window.NRITAX20DesignSystem_c86cd4;
  function Dashboard({
    go
  }) {
    return /*#__PURE__*/React.createElement(Page, {
      title: "My returns",
      kicker: "AY 2026-27 \xB7 PAN ABCPD1234E",
      wide: true
    }, /*#__PURE__*/React.createElement(DeadlineBanner, {
      days: 9,
      dueDate: "31 July 2026",
      action: /*#__PURE__*/React.createElement(Button, {
        onClick: () => go('income')
      }, "Continue my return")
    }), /*#__PURE__*/React.createElement("div", {
      className: "ntx-grid-sidebar"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }
    }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
      title: "FY 2025-26 \xB7 ITR-2",
      meta: "Started 4 June 2026 \xB7 saved 2 minutes ago",
      action: /*#__PURE__*/React.createElement(StatusPill, {
        status: "review_user"
      })
    }), /*#__PURE__*/React.createElement(LedgerBlock, {
      currencyHeader: false,
      style: {
        border: 'none',
        padding: 0,
        maxWidth: 'none'
      },
      rows: [{
        label: 'Gross total income',
        statute: 'Form 16, AIS',
        amount: 1447318,
        head: 'salary'
      }, {
        label: 'Less: Chapter VI-A',
        statute: 'u/s 80C, 80D',
        amount: 0
      }, {
        label: 'Total income (rounded)',
        statute: 's.288A',
        amount: 1447320,
        kind: 'subtotal'
      }]
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: '8px',
        marginTop: '16px',
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement(Button, {
      onClick: () => go('income')
    }, "Continue my return"), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      onClick: () => go('documents')
    }, "Add a document"))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
      title: "Tax already paid",
      meta: "From 26AS, as on 12 June 2026",
      action: /*#__PURE__*/React.createElement(Button, {
        variant: "quiet",
        size: "compact"
      }, "Open 26AS")
    }), (() => {
      const cols = [{
        key: 'd',
        header: 'Deductor'
      }, {
        key: 't',
        header: 'TAN'
      }, {
        key: 'a',
        header: 'Tax deducted',
        amount: true
      }];
      const rows = [{
        d: 'Infosys Ltd',
        t: 'BLRI12345A',
        a: 104000
      }, {
        d: 'HDFC Bank',
        t: 'MUMH04567B',
        a: 8000
      }];
      const cap = 'Two deductors. Add a challan if you paid advance tax yourself.';
      return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
        className: "ntx-wide-only"
      }, /*#__PURE__*/React.createElement(DataTable, {
        columns: cols,
        rows: rows,
        caption: cap
      })), /*#__PURE__*/React.createElement("div", {
        className: "ntx-narrow-only"
      }, /*#__PURE__*/React.createElement(DataTable, {
        stacked: true,
        columns: cols,
        rows: rows
      })));
    })())), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }
    }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(HeroFigure, {
      label: "Refund due",
      amount: 8557,
      tone: "credit",
      note: "Estimated on the new regime. Final after processing."
    })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
      title: "Earlier returns"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column'
      }
    }, [['AY 2025-26', 'processed', 'Refund ₹4,120'], ['AY 2024-25', 'processed', 'No refund']].map(([y, s, note]) => /*#__PURE__*/React.createElement("div", {
      key: y,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 0',
        borderTop: '1px solid var(--neutral-200)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        fontSize: 'var(--body-sm)',
        color: 'var(--ink)'
      }
    }, y, /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--neutral-500)'
      }
    }, note)), /*#__PURE__*/React.createElement(StatusPill, {
      status: s
    }))))), /*#__PURE__*/React.createElement(EmptyState, {
      line: "No notices against your PAN.",
      action: /*#__PURE__*/React.createElement(Button, {
        variant: "quiet",
        size: "compact"
      }, "How we check")
    }))));
  }
  Object.assign(window, {
    Dashboard
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/filing_app/Dashboard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/filing_app/DocumentsStep.jsx
try { (() => {
(function () {
  const {
    Card,
    CardHeader,
    Button,
    DocumentUpload,
    TrustBar,
    FilingProgress,
    CharacterBoxInput,
    StickyActionBar
  } = window.NRITAX20DesignSystem_c86cd4;
  function DocumentsStep({
    go
  }) {
    const [pan, setPan] = React.useState('ABCPD1234E');
    return /*#__PURE__*/React.createElement(Page, {
      title: "Your details",
      kicker: "Step 1 of 7"
    }, /*#__PURE__*/React.createElement(FilingProgress, {
      current: 0,
      onStep: () => {}
    }), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
      title: "Who is filing",
      meta: "We read these off your PAN card and Aadhaar"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--field-gap)'
      }
    }, /*#__PURE__*/React.createElement(CharacterBoxInput, {
      kind: "pan",
      label: "PAN",
      value: pan,
      onChange: setPan,
      hint: "Ten characters, as printed on your card"
    }), /*#__PURE__*/React.createElement(CharacterBoxInput, {
      kind: "aadhaar",
      label: "Aadhaar",
      value: "123412341234",
      onChange: () => {},
      hint: "Masked to XXXX XXXX 1234 the moment you leave this field"
    }))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
      title: "Your documents",
      meta: "Form 16, 26AS and AIS cover most salaried returns"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }
    }, /*#__PURE__*/React.createElement(DocumentUpload, {
      state: "parsed",
      fileName: "Form 16 \u2014 FY 2025-26.pdf",
      fields: [{
        label: 'Gross salary',
        value: '14,80,000'
      }, {
        label: 'Standard deduction',
        value: '75,000'
      }, {
        label: 'Professional tax',
        value: '2,400',
        uncertain: true
      }]
    }), /*#__PURE__*/React.createElement(DocumentUpload, {
      state: "parsing",
      fileName: "AIS \u2014 AY 2026-27.pdf"
    }), /*#__PURE__*/React.createElement(DocumentUpload, {
      state: "password",
      fileName: "HDFC statement Apr-Mar.pdf"
    }), /*#__PURE__*/React.createElement(DocumentUpload, {
      state: "idle"
    }))), /*#__PURE__*/React.createElement(TrustBar, {
      marks: [{
        name: 'e-Return Intermediary',
        reference: 'ERIP00XXXX'
      }, {
        name: 'ISO/IEC 27001:2022',
        reference: 'Cert. XXXXXX'
      }, {
        name: 'AES-256 at rest'
      }]
    }), /*#__PURE__*/React.createElement(StickyActionBar, {
      note: "Saved 2 minutes ago"
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      onClick: () => go('dashboard')
    }, "Back"), /*#__PURE__*/React.createElement(Button, {
      onClick: () => go('income')
    }, "Continue to income")));
  }
  Object.assign(window, {
    DocumentsStep
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/filing_app/DocumentsStep.jsx", error: String((e && e.message) || e) }); }

// ui_kits/filing_app/FiledScreen.jsx
try { (() => {
(function () {
  const {
    Card,
    CardHeader,
    Button,
    Acknowledgement,
    StatusPill,
    RadioGroup,
    FilingProgress
  } = window.NRITAX20DesignSystem_c86cd4;
  function FiledScreen({
    go
  }) {
    const [how, setHow] = React.useState('aadhaar');
    return /*#__PURE__*/React.createElement(Page, {
      title: "File and verify",
      kicker: "Step 7 of 7"
    }, /*#__PURE__*/React.createElement(FilingProgress, {
      current: 6,
      onStep: () => {}
    }), /*#__PURE__*/React.createElement(Acknowledgement, {
      ackNumber: "284917650120726",
      filedOn: "12 July 2026",
      itrForm: "ITR-2",
      regime: "New",
      figure: "Refund \u20B912,536"
    }), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
      title: "Verify within 30 days",
      meta: "An unverified return is not a filed return",
      action: /*#__PURE__*/React.createElement(StatusPill, {
        status: "filed_unverified"
      })
    }), /*#__PURE__*/React.createElement(RadioGroup, {
      label: "How do you want to verify?",
      value: how,
      onChange: setHow,
      options: [{
        value: 'aadhaar',
        label: 'Aadhaar OTP',
        hint: 'Fastest. Needs the mobile linked to your Aadhaar.'
      }, {
        value: 'net',
        label: 'Net banking',
        hint: 'Through your bank\u2019s income tax portal link.'
      }, {
        value: 'dsc',
        label: 'Digital signature'
      }]
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: '8px',
        marginTop: '16px',
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement(Button, null, "Send the OTP"), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      onClick: () => go('dashboard')
    }, "Back to my returns"))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
      title: "What happens next"
    }), /*#__PURE__*/React.createElement("ol", {
      style: {
        margin: 0,
        paddingLeft: '18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        fontSize: 'var(--body-sm)',
        lineHeight: 'var(--body-sm-lh)',
        color: 'var(--neutral-700)'
      }
    }, /*#__PURE__*/React.createElement("li", null, "You verify. The status changes to e-Verified."), /*#__PURE__*/React.createElement("li", null, "The department processes the return, usually in two to six weeks."), /*#__PURE__*/React.createElement("li", null, "If the refund is confirmed, it is credited to HDFC ****4412 and the status changes to Refund credited."))));
  }
  Object.assign(window, {
    FiledScreen
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/filing_app/FiledScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/filing_app/IncomeStep.jsx
try { (() => {
(function () {
  const {
    Card,
    CardHeader,
    Button,
    MoneyInput,
    Select,
    Checkbox,
    FilingProgress,
    StickyActionBar,
    LedgerBlock,
    Explainer,
    StatuteChip
  } = window.NRITAX20DesignSystem_c86cd4;
  function IncomeStep({
    go
  }) {
    const [salary, setSalary] = React.useState('1480000');
    const [other, setOther] = React.useState('42318');
    const gross = Number(salary || 0) + Number(other || 0);
    return /*#__PURE__*/React.createElement(Page, {
      title: "Income",
      kicker: "Step 2 of 7"
    }, /*#__PURE__*/React.createElement(FilingProgress, {
      current: 1,
      onStep: () => {}
    }), /*#__PURE__*/React.createElement("div", {
      className: "ntx-grid-aside"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }
    }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
      title: "Salary",
      meta: "Read from Form 16 Part B",
      action: /*#__PURE__*/React.createElement(StatuteChip, {
        source: true
      }, "Form 16")
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--field-gap)'
      }
    }, /*#__PURE__*/React.createElement(MoneyInput, {
      label: "Gross salary",
      value: salary,
      onChange: setSalary,
      source: "Form 16",
      required: true
    }), /*#__PURE__*/React.createElement(MoneyInput, {
      label: "Exempt allowances",
      value: "0",
      onChange: () => {},
      hint: "HRA, LTA and similar. Only under the old regime."
    }), /*#__PURE__*/React.createElement(Select, {
      label: "Employer type",
      options: [{
        value: 'other',
        label: 'Other than government'
      }, {
        value: 'gov',
        label: 'Central or state government'
      }]
    }))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
      title: "Other sources",
      meta: "Interest, dividends and small receipts",
      action: /*#__PURE__*/React.createElement(StatuteChip, {
        source: true
      }, "AIS")
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--field-gap)'
      }
    }, /*#__PURE__*/React.createElement(MoneyInput, {
      label: "Savings and deposit interest",
      value: other,
      onChange: setOther,
      source: "AIS"
    }), /*#__PURE__*/React.createElement(Checkbox, {
      label: "I had income from house property this year",
      hint: "Rent received, or interest on a home loan you want to set off",
      onChange: () => {}
    }), /*#__PURE__*/React.createElement(Checkbox, {
      label: "I sold shares, mutual funds or property",
      hint: "Adds the capital gains schedule",
      onChange: () => {}
    }))), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 'var(--body-sm)',
        lineHeight: 'var(--body-sm-lh)',
        color: 'var(--neutral-700)'
      }
    }, "Anything we read from ", /*#__PURE__*/React.createElement(Explainer, {
      term: "AIS",
      definition: "The Annual Information Statement. It lists what banks and companies reported against your PAN, so interest and dividends do not have to be typed by hand."
    }), " can be edited. Your figure wins, and we keep the parsed value so you can revert.")), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
      title: "As it stands",
      meta: "Updates as you type"
    }), /*#__PURE__*/React.createElement("div", {
      "aria-live": "polite"
    }, /*#__PURE__*/React.createElement(LedgerBlock, {
      currencyHeader: false,
      style: {
        border: 'none',
        padding: 0,
        maxWidth: 'none'
      },
      rows: [{
        label: 'Income from salary',
        statute: 'u/s 17(1)',
        amount: Number(salary || 0),
        head: 'salary'
      }, {
        label: 'Income from other sources',
        statute: 'AIS',
        amount: Number(other || 0),
        head: 'other'
      }, {
        label: 'Gross total income',
        amount: gross,
        kind: 'subtotal'
      }]
    })))), /*#__PURE__*/React.createElement(StickyActionBar, {
      note: "Saved just now"
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      onClick: () => go('documents')
    }, "Back"), /*#__PURE__*/React.createElement(Button, {
      onClick: () => go('review')
    }, "Continue to deductions")));
  }
  Object.assign(window, {
    IncomeStep
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/filing_app/IncomeStep.jsx", error: String((e && e.message) || e) }); }

// ui_kits/filing_app/ReviewStep.jsx
try { (() => {
(function () {
  const {
    Card,
    CardHeader,
    Button,
    FilingProgress,
    StickyActionBar,
    LedgerBlock,
    HeroFigure,
    RegimeComparison,
    Dialog,
    StatusPill
  } = window.NRITAX20DesignSystem_c86cd4;
  const newRows = [{
    label: 'Total income',
    statute: 's.288A',
    amount: 1447320
  }, {
    label: 'Tax on total income',
    amount: 95638
  }, {
    label: 'Add: cess 4%',
    amount: 3826
  }];
  const oldRows = [{
    label: 'Total income',
    statute: 's.288A',
    amount: 1285320
  }, {
    label: 'Tax on total income',
    amount: 122946
  }, {
    label: 'Add: cess 4%',
    amount: 4918
  }];
  function ReviewStep({
    go
  }) {
    const [regime, setRegime] = React.useState('new');
    const [ask, setAsk] = React.useState(false);
    return /*#__PURE__*/React.createElement(Page, {
      title: "Review",
      kicker: "Step 5 of 7",
      wide: true
    }, /*#__PURE__*/React.createElement(FilingProgress, {
      current: 4,
      onStep: () => {}
    }), /*#__PURE__*/React.createElement("div", {
      className: "ntx-grid-aside"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }
    }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
      title: "Which regime",
      meta: "You can switch until you file",
      action: /*#__PURE__*/React.createElement(StatusPill, {
        status: "ready_to_file"
      })
    }), /*#__PURE__*/React.createElement(RegimeComparison, {
      selected: regime,
      onSelect: r => {
        setRegime(r);
        if (r === 'old') setAsk(true);
      },
      newRegime: {
        tax: 99464,
        rows: newRows
      },
      oldRegime: {
        tax: 127864,
        rows: oldRows
      },
      switchNote: "Switching to the old regime brings back 4 deductions worth \u20B91,62,000."
    })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
      title: "Computation of total income",
      meta: "Every row traces to a section or a document"
    }), /*#__PURE__*/React.createElement(LedgerBlock, {
      rows: [{
        label: 'Gross salary',
        statute: 'u/s 17(1)',
        amount: 1480000,
        head: 'salary'
      }, {
        label: 'Less: standard deduction',
        statute: 'u/s 16(ia)',
        amount: 75000
      }, {
        label: 'Income from salary',
        amount: 1405000,
        kind: 'subtotal'
      }, {
        label: 'Income from other sources',
        statute: 'AIS',
        amount: 42318,
        head: 'other',
        edited: true
      }, {
        label: 'Gross total income',
        amount: 1447318,
        kind: 'subtotal'
      }, {
        label: 'Less: Chapter VI-A',
        statute: 'not available',
        amount: 0
      }, {
        label: 'Total income (rounded)',
        statute: 's.288A',
        amount: 1447320,
        kind: 'subtotal'
      }, {
        label: 'Tax on total income',
        amount: 95638
      }, {
        label: 'Add: health and education cess 4%',
        amount: 3826
      }, {
        label: 'Less: TDS',
        statute: '26AS',
        amount: 112000
      }, {
        label: 'Refund due',
        amount: 12536,
        kind: 'final'
      }],
      caption: "Rounded under s.288A and s.288B. Nothing here is abbreviated to lakh or crore."
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }
    }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(HeroFigure, {
      label: "Refund due",
      amount: 12536,
      tone: "credit",
      note: "Credited to HDFC ****4412 after the department processes this return."
    })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
      title: "Before you file"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }
    }, [['Bank account validated', 'credit'], ['Aadhaar linked to PAN', 'credit'], ['One AIS entry unmatched', 'due']].map(([l, t]) => /*#__PURE__*/React.createElement("div", {
      key: l,
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: '12px',
        alignItems: 'center',
        fontSize: 'var(--body-sm)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--ink)'
      }
    }, l), /*#__PURE__*/React.createElement(StatusPill, {
      tone: t,
      label: t === 'credit' ? 'Done' : 'Check'
    }))))))), /*#__PURE__*/React.createElement(Dialog, {
      open: ask,
      onClose: () => setAsk(false),
      title: "Switch to the old regime?",
      description: "This brings back 4 deductions worth \u20B91,62,000 and raises your tax by \u20B928,400.",
      footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
        variant: "secondary",
        onClick: () => {
          setRegime('new');
          setAsk(false);
        }
      }, "Keep the new regime"), /*#__PURE__*/React.createElement(Button, {
        onClick: () => setAsk(false)
      }, "Switch"))
    }), /*#__PURE__*/React.createElement(StickyActionBar, {
      note: regime === 'new' ? 'Filing under the new regime' : 'Filing under the old regime'
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      onClick: () => go('income')
    }, "Back"), /*#__PURE__*/React.createElement(Button, {
      onClick: () => go('filed')
    }, "File my return")));
  }
  Object.assign(window, {
    ReviewStep
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/filing_app/ReviewStep.jsx", error: String((e && e.message) || e) }); }

// ui_kits/filing_app/Shared.jsx
try { (() => {
(function () {
  const NS = window.NRITAX20DesignSystem_c86cd4;
  function Page({
    title,
    kicker,
    children,
    wide
  }) {
    return /*#__PURE__*/React.createElement("div", {
      className: "ntx-page",
      style: {
        maxWidth: wide ? 'var(--content-max-app)' : '820px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }
    }, kicker ? /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-figure)',
        fontSize: 'var(--statute)',
        color: 'var(--neutral-500)'
      }
    }, kicker) : null, /*#__PURE__*/React.createElement("h1", {
      className: "ntx-display-sm",
      style: {
        color: 'var(--ink)'
      }
    }, title)), children);
  }
  function SectionLabel({
    children
  }) {
    return /*#__PURE__*/React.createElement("h2", {
      style: {
        fontSize: 'var(--h3)',
        lineHeight: 'var(--h3-lh)',
        fontWeight: 'var(--weight-semibold)',
        color: 'var(--ink)'
      }
    }, children);
  }
  Object.assign(window, {
    Page,
    SectionLabel,
    NS
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/filing_app/Shared.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing_site/GuideScreen.jsx
try { (() => {
(function () {
  const {
    Card,
    CardHeader,
    Button,
    LedgerBlock,
    Explainer,
    StatuteChip,
    DataTable
  } = window.NRITAX20DesignSystem_c86cd4;
  function GuideScreen() {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'var(--paper)'
      }
    }, /*#__PURE__*/React.createElement("article", {
      className: "ntx-section",
      style: {
        maxWidth: 'var(--content-max-reading)',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-figure)',
        fontSize: 'var(--statute)',
        color: 'var(--neutral-500)'
      }
    }, "Guides \xB7 updated 2 June 2026 \xB7 6 min"), /*#__PURE__*/React.createElement("h1", {
      className: "ntx-display-lg",
      style: {
        color: 'var(--ink)'
      }
    }, "Old regime or new regime"), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: '17px',
        lineHeight: 1.55,
        color: 'var(--neutral-700)'
      }
    }, "The answer depends on one thing: how much you can actually claim under Chapter VI-A. Here is how to check in five minutes.")), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 'var(--body)',
        lineHeight: 'var(--body-lh)',
        color: 'var(--ink)'
      }
    }, "The new regime gives you lower slab rates and a larger standard deduction, and takes away most deductions. The old regime keeps the deductions and charges higher rates. There is no universally better one. There is only a better one for your numbers this year."), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 'var(--body)',
        lineHeight: 'var(--body-lh)',
        color: 'var(--ink)'
      }
    }, "Start with what you can prove. Add up your ", /*#__PURE__*/React.createElement(Explainer, {
      term: "Chapter VI-A",
      definition: "The group of deductions you can claim from your income, like 80C and 80D. They apply under the old regime only."
    }), " claims with receipts in hand, not intentions: provident fund, insurance premiums paid, the home loan principal, medical cover. If that total is under about \u20B93,00,000, the new regime is usually lower."), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
      title: "The same salary, both ways",
      meta: "Gross salary \u20B914,80,000 \xB7 FY 2025-26"
    }), /*#__PURE__*/React.createElement("div", {
      className: "ntx-grid-2"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--label)',
        fontWeight: 'var(--weight-medium)',
        color: 'var(--neutral-700)'
      }
    }, "New regime"), /*#__PURE__*/React.createElement(LedgerBlock, {
      currencyHeader: false,
      style: {
        border: 'none',
        padding: 0,
        maxWidth: 'none'
      },
      rows: [{
        label: 'Standard deduction',
        statute: 'u/s 16(ia)',
        amount: 75000
      }, {
        label: 'Chapter VI-A',
        statute: 'not available',
        amount: 0
      }, {
        label: 'Total income',
        statute: 's.288A',
        amount: 1405000,
        kind: 'subtotal'
      }, {
        label: 'Tax with cess',
        amount: 99464
      }]
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--label)',
        fontWeight: 'var(--weight-medium)',
        color: 'var(--neutral-700)'
      }
    }, "Old regime"), /*#__PURE__*/React.createElement(LedgerBlock, {
      currencyHeader: false,
      style: {
        border: 'none',
        padding: 0,
        maxWidth: 'none'
      },
      rows: [{
        label: 'Standard deduction',
        statute: 'u/s 16(ia)',
        amount: 50000
      }, {
        label: 'Chapter VI-A claimed',
        statute: 'u/s 80C, 80D',
        amount: 162000
      }, {
        label: 'Total income',
        statute: 's.288A',
        amount: 1268000,
        kind: 'subtotal'
      }, {
        label: 'Tax with cess',
        amount: 127864
      }]
    }))), /*#__PURE__*/React.createElement("p", {
      style: {
        marginTop: '16px',
        fontSize: 'var(--body)',
        color: 'var(--ink)'
      }
    }, "New regime saves you \u20B928,400 on these figures.")), /*#__PURE__*/React.createElement("h2", {
      style: {
        fontSize: 'var(--h2)',
        fontWeight: 'var(--weight-semibold)',
        color: 'var(--ink)'
      }
    }, "Where the crossover sits"), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 'var(--body)',
        lineHeight: 'var(--body-lh)',
        color: 'var(--ink)'
      }
    }, "For most salaried filers the two regimes meet somewhere between \u20B93,00,000 and \u20B94,25,000 of claimed deductions. Below the crossover the new regime wins; above it the old one does."), (() => {
      const cols = [{
        key: 'g',
        header: 'Gross salary',
        amount: true
      }, {
        key: 'c',
        header: 'Deductions where they break even',
        amount: true
      }];
      const rows = [{
        g: 900000,
        c: 262500
      }, {
        g: 1200000,
        c: 312500
      }, {
        g: 1480000,
        c: 358000
      }, {
        g: 2000000,
        c: 425000
      }];
      return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
        className: "ntx-wide-only"
      }, /*#__PURE__*/React.createElement(DataTable, {
        columns: cols,
        rows: rows,
        caption: "Illustrative, assuming no exempt allowances. Your own crossover appears in the app once your documents are read."
      })), /*#__PURE__*/React.createElement("div", {
        className: "ntx-narrow-only"
      }, /*#__PURE__*/React.createElement(DataTable, {
        stacked: true,
        columns: cols,
        rows: rows
      })));
    })(), /*#__PURE__*/React.createElement("h2", {
      style: {
        fontSize: 'var(--h2)',
        fontWeight: 'var(--weight-semibold)',
        color: 'var(--ink)'
      }
    }, "Three things people get wrong"), /*#__PURE__*/React.createElement("ol", {
      style: {
        margin: 0,
        paddingLeft: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        fontSize: 'var(--body)',
        lineHeight: 'var(--body-lh)',
        color: 'var(--ink)'
      }
    }, /*#__PURE__*/React.createElement("li", null, "Counting deductions they intend to make rather than ones already paid in the year."), /*#__PURE__*/React.createElement("li", null, "Forgetting that the employer's regime choice in April does not bind the return in July."), /*#__PURE__*/React.createElement("li", null, "Choosing the old regime for a \u20B9300 saving. Under \u20B9500 the two are the same decision.")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement(StatuteChip, null, "u/s 115BAC"), /*#__PURE__*/React.createElement(StatuteChip, null, "u/s 16(ia)"), /*#__PURE__*/React.createElement(StatuteChip, null, "Chapter VI-A")), /*#__PURE__*/React.createElement("div", {
      style: {
        borderTop: '1px solid var(--neutral-200)',
        paddingTop: '24px',
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement(Button, null, "Compare with my own figures"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--body-sm)',
        color: 'var(--neutral-500)'
      }
    }, "Takes one number and about a minute."))));
  }
  Object.assign(window, {
    GuideScreen
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing_site/GuideScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing_site/HomeScreen.jsx
try { (() => {
(function () {
  const {
    Button,
    MoneyInput,
    LedgerBlock,
    RegimeComparison,
    Card,
    CardHeader,
    StatuteChip,
    Explainer,
    Acknowledgement,
    StatusPill
  } = window.NRITAX20DesignSystem_c86cd4;
  const CESS = 0.04;
  function newRegimeTax(ti) {
    const slabs = [[400000, 0], [800000, 0.05], [1200000, 0.10], [1600000, 0.15], [2000000, 0.20], [2400000, 0.25]];
    let tax = 0,
      prev = 0;
    for (const [cap, rate] of slabs) {
      if (ti > prev) tax += Math.min(ti, cap) > prev ? (Math.min(ti, cap) - prev) * rate : 0;
      prev = cap;
    }
    if (ti > 2400000) tax += (ti - 2400000) * 0.30;
    return Math.round(tax * (1 + CESS));
  }
  function oldRegimeTax(ti) {
    let tax = 0;
    if (ti > 1000000) tax += (ti - 1000000) * 0.30;
    if (ti > 500000) tax += (Math.min(ti, 1000000) - 500000) * 0.20;
    if (ti > 250000) tax += (Math.min(ti, 500000) - 250000) * 0.05;
    return Math.round(tax * (1 + CESS));
  }
  function HomeScreen({
    go
  }) {
    const [salary, setSalary] = React.useState('1480000');
    const gross = Number(salary || 0);
    const tiNew = Math.max(0, Math.round((gross - 75000) / 10) * 10);
    const tiOld = Math.max(0, Math.round((gross - 50000 - 162000) / 10) * 10);
    const taxNew = newRegimeTax(tiNew),
      taxOld = oldRegimeTax(tiOld);
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("section", {
      className: "ntx-section",
      style: {
        background: 'var(--paper)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "ntx-shell ntx-grid-hero"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }
    }, /*#__PURE__*/React.createElement("h1", {
      className: "ntx-display-xl",
      style: {
        color: 'var(--ink)'
      }
    }, "We file your tax return in India"), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: '17px',
        lineHeight: 1.55,
        color: 'var(--neutral-700)',
        maxWidth: '44ch'
      }
    }, "Upload Form 16, ", /*#__PURE__*/React.createElement(Explainer, {
      term: "26AS",
      definition: "A statement from the department showing tax already deducted against your PAN. We read it so you do not have to type TDS by hand."
    }), " and AIS. Answer plain questions. See both regimes side by side, then file. A CA can take over at any point."), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement(Button, {
      size: "mobilePrimary",
      onClick: () => go('pricing')
    }, "Start my return"), /*#__PURE__*/React.createElement(Button, {
      size: "mobilePrimary",
      variant: "secondary",
      onClick: () => go('guide')
    }, "Read the regime guide")), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 'var(--body-sm)',
        color: 'var(--neutral-500)'
      }
    }, "Filing for AY 2026-27 is open. Due date 31 July 2026.")), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
      title: "See your two regimes",
      meta: "Enter one figure. Nothing is stored until you sign in."
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }
    }, /*#__PURE__*/React.createElement(MoneyInput, {
      label: "Gross salary for FY 2025-26",
      value: salary,
      onChange: setSalary
    }), /*#__PURE__*/React.createElement("div", {
      "aria-live": "polite"
    }, /*#__PURE__*/React.createElement(RegimeComparison, {
      selected: "new",
      newRegime: {
        tax: taxNew,
        rows: [{
          label: 'Total income',
          statute: 's.288A',
          amount: tiNew
        }, {
          label: 'Tax before cess',
          amount: Math.round(taxNew / 1.04)
        }]
      },
      oldRegime: {
        tax: taxOld,
        rows: [{
          label: 'Total income',
          statute: 's.288A',
          amount: tiOld
        }, {
          label: 'Tax before cess',
          amount: Math.round(taxOld / 1.04)
        }]
      },
      switchNote: "Old regime assumes \u20B91,62,000 of Chapter VI-A deductions. Your real figures replace this once you upload Form 16."
    })))))), /*#__PURE__*/React.createElement("section", {
      className: "ntx-section",
      style: {
        background: 'var(--ink)',
        color: 'var(--surface)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "ntx-shell ntx-grid-band"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }
    }, /*#__PURE__*/React.createElement("h2", {
      className: "ntx-display-lg",
      style: {}
    }, "Every figure traces to a line and a section"), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 'var(--body)',
        lineHeight: 'var(--body-lh)',
        color: 'rgba(252,253,252,0.82)',
        maxWidth: '48ch'
      }
    }, "The computation sheet is the product. Each row names where the number came from, so you can check it against the paper in front of you before you file."), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement(StatuteChip, {
      source: true
    }, "Form 16 Part B"), /*#__PURE__*/React.createElement(StatuteChip, {
      source: true
    }, "26AS"), /*#__PURE__*/React.createElement(StatuteChip, {
      source: true
    }, "AIS"), /*#__PURE__*/React.createElement(StatuteChip, null, "u/s 16(ia)"), /*#__PURE__*/React.createElement(StatuteChip, null, "s.288A"))), /*#__PURE__*/React.createElement(LedgerBlock, {
      rows: [{
        label: 'Gross salary',
        statute: 'u/s 17(1)',
        amount: 1480000,
        head: 'salary'
      }, {
        label: 'Less: standard deduction',
        statute: 'u/s 16(ia)',
        amount: 75000
      }, {
        label: 'Income from salary',
        amount: 1405000,
        kind: 'subtotal'
      }, {
        label: 'Income from other sources',
        statute: 'AIS',
        amount: 42318,
        head: 'other'
      }, {
        label: 'Total income (rounded)',
        statute: 's.288A',
        amount: 1447320,
        kind: 'subtotal'
      }, {
        label: 'Less: TDS',
        statute: '26AS',
        amount: 112000
      }, {
        label: 'Refund due',
        amount: 8557,
        kind: 'final'
      }],
      caption: "A real sheet from a salaried return, figures changed."
    }))), /*#__PURE__*/React.createElement("section", {
      className: "ntx-section",
      style: {
        background: 'var(--paper)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "ntx-shell",
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '32px'
      }
    }, /*#__PURE__*/React.createElement("h2", {
      className: "ntx-display-lg",
      style: {
        color: 'var(--ink)'
      }
    }, "Four steps, once a year"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
        gap: '16px'
      }
    }, [['01', 'Upload', 'Photograph Form 16. We read it, along with 26AS and AIS.'], ['02', 'Answer', 'Plain questions, no schedule numbers. Character boxes for PAN and Aadhaar so nothing is mistyped.'], ['03', 'Compare', 'Both regimes, side by side, with the difference in rupees.'], ['04', 'File and verify', 'We file, you verify within 30 days, and we track the refund.']].map(([n, t, d]) => /*#__PURE__*/React.createElement(Card, {
      key: n,
      padding: "20px"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-figure)',
        fontSize: 'var(--statute)',
        color: 'var(--primary)'
      }
    }, n), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--h3)',
        fontWeight: 'var(--weight-semibold)',
        color: 'var(--ink)'
      }
    }, t), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--body-sm)',
        lineHeight: 'var(--body-sm-lh)',
        color: 'var(--neutral-700)'
      }
    }, d))))))), /*#__PURE__*/React.createElement("section", {
      className: "ntx-section",
      style: {
        background: 'var(--paper)',
        paddingTop: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "ntx-shell ntx-grid-band"
    }, /*#__PURE__*/React.createElement(Acknowledgement, {
      ackNumber: "284917650120726",
      filedOn: "12 July 2026",
      itrForm: "ITR-2",
      regime: "New",
      figure: "Refund \u20B98,557"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }
    }, /*#__PURE__*/React.createElement("h2", {
      className: "ntx-display-lg",
      style: {
        color: 'var(--ink)'
      }
    }, "You end with a receipt, not a promise"), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 'var(--body)',
        lineHeight: 'var(--body-lh)',
        color: 'var(--neutral-700)',
        maxWidth: '46ch'
      }
    }, "The acknowledgement number is the department's, not ours. We show it the moment it arrives, and we keep the status honest: filed is not verified, and verified is not processed."), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement(StatusPill, {
      status: "filed_unverified"
    }), /*#__PURE__*/React.createElement(StatusPill, {
      status: "everified"
    }), /*#__PURE__*/React.createElement(StatusPill, {
      status: "processed"
    }), /*#__PURE__*/React.createElement(StatusPill, {
      status: "refund_issued"
    }))))));
  }
  Object.assign(window, {
    HomeScreen
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing_site/HomeScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing_site/PricingScreen.jsx
try { (() => {
(function () {
  const {
    Card,
    CardHeader,
    Button,
    StatusPill,
    LedgerBlock,
    TrustBar,
    Explainer
  } = window.NRITAX20DesignSystem_c86cd4;
  const PLANS = [{
    name: 'Self filing',
    price: 499,
    who: 'Salary from one employer, no capital gains.',
    includes: ['Form 16, 26AS and AIS read for you', 'Both regimes compared', 'e-Filing and e-Verification', 'Refund tracking']
  }, {
    name: 'Reviewed by a CA',
    price: 1499,
    who: 'Multiple employers, capital gains, house property.',
    includes: ['Everything in self filing', 'A CA checks the return before filing', 'Chat with the same CA until it is processed', 'Notice reply drafting for one notice'],
    recommended: true
  }, {
    name: 'Expert filed',
    price: 3999,
    who: 'Foreign income, presumptive business, or a defective return to fix.',
    includes: ['A CA prepares the return end to end', 'Schedule FA and foreign asset reporting', 'Advance tax planning for next year', 'Notice handling through the year']
  }];
  function PricingScreen() {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'var(--paper)'
      }
    }, /*#__PURE__*/React.createElement("section", {
      className: "ntx-section",
      style: {
        paddingBottom: '32px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "ntx-shell",
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }
    }, /*#__PURE__*/React.createElement("h1", {
      className: "ntx-display-lg",
      style: {
        color: 'var(--ink)'
      }
    }, "One price per return"), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 'var(--body)',
        lineHeight: 'var(--body-lh)',
        color: 'var(--neutral-700)',
        maxWidth: '56ch'
      }
    }, "You pay after you see the computation and before you file. No charge if we cannot file your return."))), /*#__PURE__*/React.createElement("section", {
      className: "ntx-section",
      style: {
        paddingTop: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "ntx-shell",
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
        gap: '16px',
        alignItems: 'start'
      }
    }, PLANS.map(p => /*#__PURE__*/React.createElement("div", {
      key: p.name,
      style: {
        background: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--card-pad)',
        border: p.recommended ? '2px solid var(--primary)' : '1px solid var(--neutral-200)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px'
      }
    }, /*#__PURE__*/React.createElement("h2", {
      style: {
        fontSize: 'var(--h2)',
        fontWeight: 'var(--weight-semibold)',
        color: 'var(--ink)'
      }
    }, p.name), p.recommended ? /*#__PURE__*/React.createElement(StatusPill, {
      tone: "primary",
      label: "Most returns"
    }) : null), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'baseline',
        gap: '6px'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-figure)',
        fontSize: 'var(--figure-xl)',
        fontWeight: 'var(--weight-medium)',
        fontVariantNumeric: 'tabular-nums lining-nums',
        color: 'var(--ink)'
      }
    }, "\u20B9", p.price.toLocaleString('en-IN')), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--body-sm)',
        color: 'var(--neutral-500)'
      }
    }, "per return, incl. GST")), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 'var(--body-sm)',
        lineHeight: 'var(--body-sm-lh)',
        color: 'var(--neutral-700)'
      }
    }, p.who), /*#__PURE__*/React.createElement("ul", {
      style: {
        margin: 0,
        padding: 0,
        listStyle: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }
    }, p.includes.map(i => /*#__PURE__*/React.createElement("li", {
      key: i,
      style: {
        display: 'flex',
        gap: '8px',
        fontSize: 'var(--body-sm)',
        lineHeight: 'var(--body-sm-lh)',
        color: 'var(--ink)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      "aria-hidden": "true",
      style: {
        color: 'var(--credit)',
        fontFamily: 'var(--font-figure)'
      }
    }, "\u2713"), i))), /*#__PURE__*/React.createElement(Button, {
      variant: p.recommended ? 'primary' : 'secondary',
      fullWidth: true
    }, "Start with ", p.name.toLowerCase()))))), /*#__PURE__*/React.createElement("section", {
      className: "ntx-section",
      style: {
        paddingTop: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "ntx-shell ntx-grid-aside"
    }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
      title: "What a late filing costs",
      meta: "So the deadline is a number, not a mood"
    }), /*#__PURE__*/React.createElement(LedgerBlock, {
      currencyHeader: false,
      style: {
        border: 'none',
        padding: 0,
        maxWidth: 'none'
      },
      rows: [{
        label: 'Late fee, total income above ₹5,00,000',
        statute: 's.234F',
        amount: 5000
      }, {
        label: 'Late fee, total income up to ₹5,00,000',
        statute: 's.234F',
        amount: 1000
      }, {
        label: 'Interest on unpaid tax, per month',
        statute: 's.234A',
        amount: '1%'
      }],
      caption: "Belated returns for AY 2026-27 close on 31 December 2026."
    })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
      title: "Common questions"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        fontSize: 'var(--body-sm)',
        lineHeight: 'var(--body-sm-lh)',
        color: 'var(--neutral-700)'
      }
    }, /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("strong", {
      style: {
        color: 'var(--ink)'
      }
    }, "Do I need my ", /*#__PURE__*/React.createElement(Explainer, {
      term: "AIS",
      definition: "The Annual Information Statement lists what banks and companies reported against your PAN. We fetch it so interest and dividends are not missed."
    }), "?"), /*#__PURE__*/React.createElement("br", null), "No. We fetch it once you consent."), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("strong", {
      style: {
        color: 'var(--ink)'
      }
    }, "Can I switch regime after paying?"), /*#__PURE__*/React.createElement("br", null), "Yes, until the return is filed. The computation updates and the price does not change."), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("strong", {
      style: {
        color: 'var(--ink)'
      }
    }, "Who sees my documents?"), /*#__PURE__*/React.createElement("br", null), "Only you, and the CA you are assigned if you choose a reviewed plan."))))), /*#__PURE__*/React.createElement("section", {
      className: "ntx-section",
      style: {
        paddingTop: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "ntx-shell"
    }, /*#__PURE__*/React.createElement(TrustBar, {
      align: "space-between",
      marks: [{
        name: 'e-Return Intermediary',
        reference: 'ERIP00XXXX'
      }, {
        name: 'ISO/IEC 27001:2022',
        reference: 'Cert. XXXXXX'
      }, {
        name: 'SOC 2 Type II'
      }, {
        name: 'AES-256 at rest'
      }]
    }))));
  }
  Object.assign(window, {
    PricingScreen
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing_site/PricingScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing_site/SiteChrome.jsx
try { (() => {
(function () {
  const {
    Wordmark,
    Button,
    StatusPill
  } = window.NRITAX20DesignSystem_c86cd4;
  function SiteNav({
    page,
    go
  }) {
    const items = [['home', 'How it works'], ['pricing', 'Pricing'], ['guide', 'Guides']];
    return /*#__PURE__*/React.createElement("header", {
      style: {
        background: 'var(--ink)',
        color: 'var(--surface)',
        height: 'var(--shell-header-height)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '0 var(--gutter-mobile)',
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => go('home'),
      style: {
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        flex: '0 0 auto'
      }
    }, /*#__PURE__*/React.createElement(Wordmark, null)), /*#__PURE__*/React.createElement("nav", {
      style: {
        display: 'flex',
        gap: '20px',
        flex: '1 1 auto',
        minWidth: 0,
        overflowX: 'auto',
        scrollbarWidth: 'none'
      }
    }, items.map(([k, l]) => /*#__PURE__*/React.createElement("button", {
      key: k,
      type: "button",
      onClick: () => go(k),
      style: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        fontSize: 'var(--label)',
        fontWeight: 'var(--weight-medium)',
        color: page === k ? 'var(--surface)' : 'rgba(252,253,252,0.72)',
        borderBottom: page === k ? '1px solid var(--surface)' : '1px solid transparent',
        whiteSpace: 'nowrap',
        flex: '0 0 auto'
      }
    }, l))), /*#__PURE__*/React.createElement("span", {
      className: "ntx-wide-only",
      style: {
        flex: '0 0 auto'
      }
    }, /*#__PURE__*/React.createElement(Button, {
      size: "compact",
      variant: "secondary"
    }, "Sign in")), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: '0 0 auto'
      }
    }, /*#__PURE__*/React.createElement(Button, {
      size: "compact"
    }, "Start my return")));
  }
  function SiteFooter() {
    const {
      TrustBar
    } = window.NRITAX20DesignSystem_c86cd4;
    return /*#__PURE__*/React.createElement("footer", {
      className: "ntx-section",
      style: {
        background: 'var(--primary-800)',
        color: 'rgba(252,253,252,0.82)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: 'var(--content-max-app)',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(160px, 100%), 1fr))',
        gap: '32px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }
    }, /*#__PURE__*/React.createElement(Wordmark, null), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 'var(--body-sm)',
        lineHeight: 'var(--body-sm-lh)',
        maxWidth: '34ch'
      }
    }, "We file your income tax return in India. Registered e-Return Intermediary.")), [['Product', ['How it works', 'Pricing', 'Expert filing', 'Security']], ['Guides', ['Old vs new regime', 'Form 16 explained', '26AS and AIS', 'Belated returns']], ['Company', ['About', 'Contact', 'Terms', 'Privacy']]].map(([h, links]) => /*#__PURE__*/React.createElement("div", {
      key: h,
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--label)',
        fontWeight: 'var(--weight-semibold)',
        color: 'var(--surface)'
      }
    }, h), links.map(l => /*#__PURE__*/React.createElement("a", {
      key: l,
      href: "#",
      style: {
        fontSize: 'var(--body-sm)',
        color: 'rgba(252,253,252,0.82)',
        textDecoration: 'none'
      }
    }, l))))), /*#__PURE__*/React.createElement("div", {
      style: {
        filter: 'invert(1) grayscale(1)',
        opacity: 0.9
      }
    }, /*#__PURE__*/React.createElement(TrustBar, {
      marks: [{
        name: 'e-Return Intermediary',
        reference: 'ERIP00XXXX'
      }, {
        name: 'ISO/IEC 27001:2022',
        reference: 'Cert. XXXXXX'
      }, {
        name: 'SOC 2 Type II'
      }, {
        name: 'AES-256 at rest'
      }]
    })), /*#__PURE__*/React.createElement("p", {
      style: {
        fontFamily: 'var(--font-figure)',
        fontSize: 'var(--statute)'
      }
    }, "\xA9 2026 NRITAX. Figures shown are illustrative. Registration numbers are placeholders pending real credentials.")));
  }
  Object.assign(window, {
    SiteNav,
    SiteFooter
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing_site/SiteChrome.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.CardHeader = __ds_scope.CardHeader;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.FILING_STATUSES = __ds_scope.FILING_STATUSES;

__ds_ns.StatusPill = __ds_scope.StatusPill;

__ds_ns.StatuteChip = __ds_scope.StatuteChip;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.ExpertPanel = __ds_scope.ExpertPanel;

__ds_ns.Explainer = __ds_scope.Explainer;

__ds_ns.Acknowledgement = __ds_scope.Acknowledgement;

__ds_ns.DeadlineBanner = __ds_scope.DeadlineBanner;

__ds_ns.DocumentUpload = __ds_scope.DocumentUpload;

__ds_ns.FILING_STEPS = __ds_scope.FILING_STEPS;

__ds_ns.FilingProgress = __ds_scope.FilingProgress;

__ds_ns.TrustBar = __ds_scope.TrustBar;

__ds_ns.CharacterBoxInput = __ds_scope.CharacterBoxInput;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.MoneyInput = __ds_scope.MoneyInput;

__ds_ns.RadioGroup = __ds_scope.RadioGroup;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.DataTable = __ds_scope.DataTable;

__ds_ns.HeroFigure = __ds_scope.HeroFigure;

__ds_ns.LedgerBlock = __ds_scope.LedgerBlock;

__ds_ns.LedgerRow = __ds_scope.LedgerRow;

__ds_ns.RegimeComparison = __ds_scope.RegimeComparison;

__ds_ns.SealMark = __ds_scope.SealMark;

__ds_ns.Wordmark = __ds_scope.Wordmark;

__ds_ns.BrandLockup = __ds_scope.BrandLockup;

__ds_ns.AppShell = __ds_scope.AppShell;

__ds_ns.StickyActionBar = __ds_scope.StickyActionBar;

})();
