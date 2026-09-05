import { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { ALL_COUNTRIES, findCountry, type Country } from '@/lib/countries'
import { useI18n } from '@/lib/i18n'
import type { CountryCode } from 'libphonenumber-js'

type CountrySelectProps = {
  value: CountryCode
  onChange: (code: CountryCode) => void
}

/** Searchable country picker: all countries, matched in Arabic or English. */
export function CountrySelect({ value, onChange }: CountrySelectProps) {
  const { locale, t } = useI18n()
  const [open, setOpen] = useState(false)
  const selected = findCountry(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button variant="outline" className="w-36 shrink-0 justify-start font-normal" />}
      >
        {selected && (
          <>
            <span className="text-base leading-none">{selected.flag}</span>
            <span dir="ltr" className="font-mono text-xs">
              {selected.dial}
            </span>
          </>
        )}
        <ChevronsUpDown className="ms-auto h-3.5 w-3.5 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder={t('phone.searchCountry')} />
          <CommandList>
            <CommandEmpty>{t('phone.noCountry')}</CommandEmpty>
            <CommandGroup>
              {ALL_COUNTRIES.map((c: Country) => (
                <CommandItem
                  key={c.code}
                  value={`${c.code} ${c.nameAr} ${c.nameEn} ${c.dial}`}
                  onSelect={() => {
                    onChange(c.code)
                    setOpen(false)
                  }}
                >
                  <span className="text-base leading-none">{c.flag}</span>
                  <span dir="auto" className="flex-1 truncate">
                    {locale === 'ar' ? c.nameAr : c.nameEn}
                  </span>
                  <span dir="ltr" className="font-mono text-xs text-muted-foreground">
                    {c.dial}
                  </span>
                  {c.code === value && <Check className="h-3.5 w-3.5" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
