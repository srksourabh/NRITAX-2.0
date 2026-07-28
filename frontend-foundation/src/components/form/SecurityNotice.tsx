type SecurityNoticeProps = {
  children: string;
};

export function SecurityNotice({ children }: SecurityNoticeProps) {
  return (
    <p className="rounded-lg border border-[rgba(161,92,7,0.26)] bg-[rgba(161,92,7,0.12)] p-4 text-sm font-semibold leading-6 text-[#7C4705]">
      {children}
    </p>
  );
}
