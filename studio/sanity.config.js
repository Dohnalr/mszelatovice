import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {csCZLocale} from '@sanity/locale-cs-cz'
import {schemaTypes} from './schemaTypes'
import {structure} from './structure'

export default defineConfig({
  name: 'default',
  title: 'MŠ Želatovice',
  projectId: 'dsss8o0a',
  dataset: 'production',
  plugins: [structureTool({structure}), csCZLocale()],
  schema: {
    types: schemaTypes,
    templates: (prev) => [
      ...prev,
      {
        id: 'akce-v-mesici',
        title: 'Akce v měsíci',
        schemaType: 'akce',
        parameters: [
          {name: 'rok', type: 'string'},
          {name: 'mesic', type: 'number'},
        ],
        value: (p) => ({skolniRok: p.rok, mesic: p.mesic}),
      },
    ],
  },
})
