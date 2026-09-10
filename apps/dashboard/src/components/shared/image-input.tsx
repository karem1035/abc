import { ImagePlus, Link2, Loader2, Trash2, UploadCloud } from 'lucide-react'
import { useRef, useState, type DragEvent } from 'react'
import { api } from '@/api/client'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

type UploadResponse = { url: string; thumbUrl: string | null }

type Props = {
  /** Current image URL ('' when unset) */
  value: string
  onChange: (url: string) => void
  /** square (avatars) or wide (banners) preview */
  aspect?: 'square' | 'wide'
}

/**
 * Image picker with two sources:
 * - drag & drop / browse → uploaded to /storage/images, which auto-compresses
 *   to WebP (max 1920px) and generates a 400px thumbnail on the backend
 * - or paste an external image URL
 */
export function ImageInput({ value, onChange, aspect = 'wide' }: Props) {
  const { t } = useI18n()
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [urlMode, setUrlMode] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function upload(file: File) {
    if (!file.type.startsWith('image/')) {
      setError(t('imageInput.notImage'))
      return
    }
    setError(null)
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await api<UploadResponse>('/storage/images', { method: 'POST', body: form })
      onChange(res.url)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setUploading(false)
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) void upload(file)
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div
          className={cn(
            'group relative overflow-hidden rounded-lg border border-border',
            aspect === 'square' ? 'size-28' : 'h-36 w-full',
          )}
        >
          <img src={value} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-md bg-white/90 px-3 py-1.5 text-xs font-bold text-neutral-900"
            >
              {t('imageInput.replace')}
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="flex items-center gap-1 rounded-md bg-destructive px-3 py-1.5 text-xs font-bold text-white"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t('common.delete')}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            'flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-7 text-muted-foreground transition-colors',
            dragOver ? 'border-primary bg-primary/5 text-foreground' : 'border-border hover:border-primary/40 hover:bg-muted/50',
            aspect === 'square' && 'size-40',
          )}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <UploadCloud className="h-6 w-6" />
          )}
          <span className="text-xs font-semibold">
            {uploading ? t('imageInput.uploading') : t('imageInput.dropHere')}
          </span>
        </button>
      )}

      {/* hidden file input (also used by "replace") */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void upload(file)
          e.target.value = ''
        }}
      />

      {uploading && value && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {t('imageInput.uploading')}
        </p>
      )}

      {/* URL mode toggle for external images */}
      <div className="flex items-center gap-2">
        {urlMode ? (
          <div className="flex flex-1 items-center gap-1.5">
            <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              dir="ltr"
              type="url"
              placeholder="https://…"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onBlur={() => setUrlMode(false)}
              className="h-8 w-full rounded-md border border-border bg-transparent px-2 text-xs outline-none focus:border-primary"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setUrlMode(true)}
            className="flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ImagePlus className="h-3.5 w-3.5" />
            {t('imageInput.fromUrl')}
          </button>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
