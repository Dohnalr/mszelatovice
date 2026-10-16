import {CalendarIcon} from '@sanity/icons/Calendar'
import {MESICE, aktualniSkolniRok} from './schemaTypes/akce'

// Levý panel: akce rozdělené podle školního roku a měsíce.
export const structure = (S, context) =>
  S.list()
    .title('Obsah')
    .items([
      S.listItem()
        .title(`Akce – letošní rok (${aktualniSkolniRok()})`)
        .icon(CalendarIcon)
        .child(rokPoMesicich(S, aktualniSkolniRok())),
      S.listItem()
        .title('Akce podle školního roku')
        .icon(CalendarIcon)
        .child(async () => {
          const roky = await context
            .getClient({apiVersion: '2025-02-19'})
            .fetch('array::unique(*[_type == "akce"].skolniRok)')
          const serazene = [...new Set([...(roky || []), aktualniSkolniRok()])].sort().reverse()
          return S.list()
            .title('Školní roky')
            .items(
              serazene.map((rok) =>
                S.listItem().id(rok.replace('/', '-')).title(rok).child(rokPoMesicich(S, rok)),
              ),
            )
        }),
      S.divider(),
      S.documentTypeListItem('akce').title('Všechny akce'),
    ])

function rokPoMesicich(S, rok) {
  return S.list()
    .title(`Školní rok ${rok}`)
    .items(
      MESICE.map((m) =>
        S.listItem()
          .id(`m${m.value}`)
          .title(m.title)
          .child(
            S.documentList()
              .title(`${m.title} ${rok}`)
              .schemaType('akce')
              .filter('_type == "akce" && skolniRok == $rok && mesic == $mesic')
              .params({rok, mesic: m.value})
              .defaultOrdering([
                {field: 'datum', direction: 'asc'},
                {field: 'poradi', direction: 'asc'},
                {field: 'nazev', direction: 'asc'},
              ])
              .initialValueTemplates([
                S.initialValueTemplateItem('akce-v-mesici', {rok, mesic: m.value}),
              ]),
          ),
      ),
    )
}
