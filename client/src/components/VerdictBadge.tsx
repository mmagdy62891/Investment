export default function VerdictBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className="verdict-badge" style={{ background: `${color}26`, color, border: `1px solid ${color}88` }}>
      {label}
    </span>
  );
}
