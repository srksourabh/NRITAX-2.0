type SecurityNoticeProps = {
  children: string;
};

export function SecurityNotice({ children }: SecurityNoticeProps) {
  return (
    <p className="rounded-lg border border-[rgba(25,195,125,0.24)] bg-[rgba(25,195,125,0.10)] p-4 text-caption text-brand-ink">
      {children}
    </p>
  );
}
