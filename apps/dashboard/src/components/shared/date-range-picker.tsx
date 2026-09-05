import { CalendarIcon, X } from 'lucide-react'
import { ar as arLocale, enUS } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/lib/i18n'

type DateFieldProps = {
  id: string
  label: string
  date: Date | undefined
  onChange: (date: Date | undefined) => void
}

/** Single labeled date input: label above, popover calendar with year/month dropdowns. */
export function DateField({ id, label, date, onChange }: DateFieldProps) {
  const { locale, dir } = useI18n()
  const label_text =
    date ? date.toLocaleDateString('en-GB').replaceAll('/', '-') : undefined

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Popover>
        <PopoverTrigger render={<Button id={id} variant="outline" size="sm" className="h-9 w-44 justify-start font-normal" />}>
          <CalendarIcon className="h-4 w-4" />
          <span dir="ltr" className="truncate text-xs">
            {label_text ?? '\u2000\u2014\u2000'}
          </span>
          {date && (
            <span
              role="button"
              tabIndex={0}
              className="ms-auto text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation()
                onChange(undefined)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation()
                  onChange(undefined)
                }
              }}
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => onChange(d)}
            numberOfMonths={1}
            captionLayout="dropdown"
            defaultMonth={date}
            dir={dir}
            locale={locale === 'ar' ? arLocale : enUS}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
