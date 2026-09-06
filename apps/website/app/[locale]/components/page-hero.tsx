import { cn } from '@/lib/utils'

/**
 * Reusable page hero: background image under a dark overlay with the
 * page title and a short description. Falls back to a brand gradient
 * when no image is provided.
 */
export function PageHero({
  title,
  description,
  image,
  className,
}: {
  title: string
  description?: string
  /** Path under /public; omit for the gradient fallback */
  image?: string
  className?: string
}) {
  return (
    <section
      className={cn(
        'relative flex min-h-56 items-center justify-center overflow-hidden py-16',
        className,
      )}
    >
      {image ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${image})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-brand-deep/90 via-neutral-900 to-neutral-900" />
      )}
      {/* Dark layer over the image */}
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
        <h1 className="font-heading text-3xl font-bold text-white sm:text-4xl">{title}</h1>
        {description && (
          <p className="mt-3 text-base leading-relaxed text-neutral-300 sm:text-lg">
            {description}
          </p>
        )}
      </div>
    </section>
  )
}
