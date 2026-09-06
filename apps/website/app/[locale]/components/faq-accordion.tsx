'use client'

import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type FaqItem = { id: string; question: string; answer: string }

/** shadcn-style accordion used for the FAQ section. */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  return (
    <AccordionPrimitive.Root type="single" collapsible className="space-y-3">
      {items.map((item, i) => (
        <AccordionPrimitive.Item
          key={item.id}
          value={item.id}
          className="overflow-hidden rounded-xl border border-border bg-card"
        >
          <AccordionPrimitive.Header>
            <AccordionPrimitive.Trigger className="group flex w-full items-center justify-between gap-4 px-5 py-4 text-start text-sm font-bold outline-none transition-colors hover:bg-muted/50">
              <span className="flex items-center gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand-deep">
                  {i + 1}
                </span>
                {item.question}
              </span>
              <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
            <p className={cn('border-t border-border px-5 py-4 ps-15 text-sm leading-relaxed text-muted-foreground')}>
              {item.answer}
            </p>
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
      ))}
    </AccordionPrimitive.Root>
  )
}
