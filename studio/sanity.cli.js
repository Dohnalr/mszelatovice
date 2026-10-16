import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'dsss8o0a',
    dataset: 'production',
  },
  // Administrace poběží na https://mszelatovice.sanity.studio
  studioHost: 'mszelatovice',
  deployment: {
    autoUpdates: true,
  },
})
