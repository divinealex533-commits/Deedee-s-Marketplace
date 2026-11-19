import CopyButton from './CopyButton';

export default function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line2 bg-[#070B17]">
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <span className="text-xs font-medium uppercase tracking-wider text-placeholder">{label ?? 'Code'}</span>
        <CopyButton value={code} label={label ?? 'Code'} />
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-soft"><code>{code}</code></pre>
    </div>
  );
}
