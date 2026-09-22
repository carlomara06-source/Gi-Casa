export function Placeholder({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center bg-neutral-200 text-center ${className}`}
      style={{
        backgroundImage:
          "repeating-linear-gradient(135deg, rgba(21,18,14,.05) 0px, rgba(21,18,14,.05) 2px, transparent 2px, transparent 10px)",
      }}
    >
      <span className="px-2 font-mono text-[10px] tracking-wide text-neutral-500 uppercase">{label}</span>
    </div>
  );
}
