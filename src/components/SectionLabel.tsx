// src/components/SectionLabel.tsx

export function SectionLabel({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="font-mono text-sm md:text-base font-medium tracking-[0.15em] uppercase text-accent">
        {children}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
