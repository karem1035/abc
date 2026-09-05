import { CalendarIcon, X } from 'lucide-react'
import { type DateRange } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatDateTime } from '@/lib/format'

type DateRangePickerProps = {
  range: DateRange | undefined
  onChange: (range: DateRange | undefined) => void
}

/** Popover calendar range picker with year/month dropdowns. */
export function DateRangePicker({ range, onChange }: DateRangePickerProps) {

  const label =
    range?.from
      ? range.to
        ? `${formatDateTime(range.from.toISOString())} → ${formatDateTime(range.to.toISOString())}`
        : formatDateTime(range.from.toISOString())
      : undefined

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" className="max-w-72 justify-start font-normal" />
        }
      >
        <CalendarIcon className="h-4 w-4" />
        <span dir="ltr" className="truncate text-xs">
          {label ?? '\u2000\u2014\u2000'}
        </span>
        {range?.from && (
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
          mode="range"
          selected={range}
          onSelect={onChange}
          numberOfMonths={1}
          captionLayout="dropdown"
          defaultMonth={range?.from}
          dir="ltr"
        />
      </PopoverContent>
    </Popover>
  )
}
