import {defineField, defineType} from 'sanity'
import {CalendarIcon} from '@sanity/icons/Calendar'

export const MESICE = [
  {title: 'Září', value: 9},
  {title: 'Říjen', value: 10},
  {title: 'Listopad', value: 11},
  {title: 'Prosinec', value: 12},
  {title: 'Leden', value: 1},
  {title: 'Únor', value: 2},
  {title: 'Březen', value: 3},
  {title: 'Duben', value: 4},
  {title: 'Květen', value: 5},
  {title: 'Červen', value: 6},
  {title: 'Červenec', value: 7},
  {title: 'Srpen', value: 8},
]

/** Školní rok, do kterého patří dnešní datum, např. "2026/2027". */
export function aktualniSkolniRok(d = new Date()) {
  const y = d.getFullYear()
  return d.getMonth() + 1 >= 9 ? `${y}/${y + 1}` : `${y - 1}/${y}`
}

export const akce = defineType({
  name: 'akce',
  title: 'Akce',
  type: 'document',
  icon: CalendarIcon,
  fields: [
    defineField({
      name: 'nazev',
      title: 'Název akce',
      type: 'string',
      description: 'Např. „Drakiáda s rodiči“',
      validation: (r) => r.required().max(120),
    }),
    defineField({
      name: 'skolniRok',
      title: 'Školní rok',
      type: 'string',
      description: 'Ve tvaru 2026/2027',
      initialValue: () => aktualniSkolniRok(),
      validation: (r) =>
        r.required().regex(/^\d{4}\/\d{4}$/, {name: 'školní rok'}).error('Zadejte ve tvaru 2026/2027'),
    }),
    defineField({
      name: 'mesic',
      title: 'Měsíc',
      type: 'number',
      options: {list: MESICE, layout: 'dropdown'},
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'datum',
      title: 'Přesné datum',
      type: 'date',
      description: 'Nepovinné. Když termín ještě není jistý, nechte prázdné.',
      options: {dateFormat: 'D. M. YYYY'},
      validation: (r) =>
        r.custom((datum, ctx) => {
          if (!datum || !ctx.document?.mesic) return true
          const m = Number(String(datum).slice(5, 7))
          return m === ctx.document.mesic ? true : 'Datum nesedí s vybraným měsícem'
        }),
    }),
    defineField({
      name: 'poznamka',
      title: 'Poznámka',
      type: 'string',
      description: 'Krátké upřesnění pod názvem, např. „s rodiči“ nebo „každou středu“',
      validation: (r) => r.max(160),
    }),
    defineField({
      name: 'poradi',
      title: 'Pořadí v měsíci',
      type: 'number',
      description: 'Nepovinné. Menší číslo = výš. Akce s datem se řadí podle data.',
    }),
  ],
  orderings: [
    {
      title: 'Školní rok a měsíc',
      name: 'rokMesic',
      by: [
        {field: 'skolniRok', direction: 'desc'},
        {field: 'datum', direction: 'asc'},
        {field: 'poradi', direction: 'asc'},
      ],
    },
  ],
  preview: {
    select: {title: 'nazev', mesic: 'mesic', rok: 'skolniRok', datum: 'datum', poznamka: 'poznamka'},
    prepare({title, mesic, rok, datum, poznamka}) {
      const m = MESICE.find((x) => x.value === mesic)?.title || '?'
      const d = datum ? `${Number(datum.slice(8, 10))}. ${Number(datum.slice(5, 7))}. · ` : ''
      return {
        title,
        subtitle: `${d}${m} ${rok || ''}${poznamka ? ' — ' + poznamka : ''}`,
      }
    },
  },
})
