type SecurityNoticeProps = {
  children: string;
};

export function SecurityNotice({ children }: SecurityNoticeProps) {
  return (
    <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
      {children}
    </p>
  );
}
