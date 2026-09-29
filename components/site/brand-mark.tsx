export function BrandMark({ className = "brand-mark" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 26 26" aria-hidden="true">
      <rect width="26" height="26" rx="7" fill="currentColor" />
      <path
        d="M11.2 6v10a3 3 0 0 0 3 3h2.3M7.4 10.2h8.4"
        fill="none"
        stroke="var(--mark-cut, #fff)"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="19.2" cy="19" r="1.7" fill="var(--mark-cut, #fff)" />
    </svg>
  );
}
