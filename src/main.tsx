import { render } from 'preact'
import { registerSW } from 'virtual:pwa-register'
import '@fontsource/atkinson-hyperlegible/400.css'
import '@fontsource/atkinson-hyperlegible/700.css'
import '@fontsource/bricolage-grotesque/700.css'
import '@fontsource/bricolage-grotesque/800.css'
import './style.css'
import { App } from './ui/App'
import { lancerSurprises } from './lib/surprises'

// mise à jour automatique : la nouvelle version s'installe et s'applique au lancement suivant
registerSW({ immediate: true })

render(<App />, document.getElementById('app')!)

// de temps en temps, une mascotte à l'écran fait une petite surprise
lancerSurprises()
