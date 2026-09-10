import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  Bold, Italic, List, ListOrdered, Redo2, Strikethrough, Undo2,
  Heading2, Heading3, RemoveFormatting, Quote, Minus,
} from 'lucide-react'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  value: string // HTML
  onChange: (html: string) => void
  dir?: 'rtl' | 'ltr'
  placeholder?: string
}

const btn =
  'flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-40'

/**
 * Lightweight TipTap rich-text editor storing HTML.
 * Used for bilingual department/service content.
 */
export function RichTextEditor({ value, onChange, dir = 'ltr', placeholder }: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        dir,
        class: 'prose-tiptap min-h-32 rounded-b-lg border-t border-border px-3 py-2.5 text-sm leading-relaxed outline-none',
        'data-placeholder': placeholder ?? '',
      },
    },
    onUpdate: ({ editor: e }) => {
      // emit empty string (not '<p></p>') when there is no real content
      const text = e.getText().trim()
      onChange(text ? e.getHTML() : '')
    },
  })

  // keep editor in sync when the parent resets the form (open create/edit dialog)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      const text = editor.getText().trim()
      if (!value && !text) return // both empty, nothing to do
      editor.commands.setContent(value || '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  if (!editor) return null

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/50 p-1">
        <button type="button" className={btn} onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} aria-label="Bold"><Bold className="h-4 w-4" /></button>
        <button type="button" className={btn} onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} aria-label="Italic"><Italic className="h-4 w-4" /></button>
        <button type="button" className={btn} onClick={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run()} aria-label="Strikethrough"><Strikethrough className="h-4 w-4" /></button>
        <span className="mx-1 h-5 w-px bg-border" />
        <button type="button" className={btn} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} aria-label="Heading 2"><Heading2 className="h-4 w-4" /></button>
        <button type="button" className={btn} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} aria-label="Heading 3"><Heading3 className="h-4 w-4" /></button>
        <span className="mx-1 h-5 w-px bg-border" />
        <button type="button" className={cn(btn, editor.isActive('bulletList') && 'bg-accent text-accent-foreground')} onClick={() => editor.chain().focus().toggleBulletList().run()} aria-label="Bullet list"><List className="h-4 w-4" /></button>
        <button type="button" className={cn(btn, editor.isActive('orderedList') && 'bg-accent text-accent-foreground')} onClick={() => editor.chain().focus().toggleOrderedList().run()} aria-label="Numbered list"><ListOrdered className="h-4 w-4" /></button>
        <button type="button" className={btn} onClick={() => editor.chain().focus().toggleBlockquote().run()} aria-label="Quote"><Quote className="h-4 w-4" /></button>
        <button type="button" className={btn} onClick={() => editor.chain().focus().setHorizontalRule().run()} aria-label="Divider"><Minus className="h-4 w-4" /></button>
        <span className="mx-1 h-5 w-px bg-border" />
        <button type="button" className={btn} onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} aria-label="Clear formatting"><RemoveFormatting className="h-4 w-4" /></button>
        <span className="ms-auto flex gap-0.5">
          <button type="button" className={btn} onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().chain().focus().undo().run()} aria-label="Undo"><Undo2 className="h-4 w-4" /></button>
          <button type="button" className={btn} onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().chain().focus().redo().run()} aria-label="Redo"><Redo2 className="h-4 w-4" /></button>
        </span>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
