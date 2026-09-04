export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-sm text-neutral-500">Coming soon — not part of this scaffold step.</p>
    </div>
  )
}
