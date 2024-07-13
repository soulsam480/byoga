// uno.config.ts
import { defineConfig, presetTypography, presetUno, presetWind } from 'unocss'
import presetRemToPx from '@unocss/preset-rem-to-px'
import { presetDaisy } from 'unocss-preset-daisy'

export default defineConfig({
  presets: [
    presetUno(),
    presetWind(),
    presetTypography(),
    presetRemToPx(),
    presetDaisy({ themes: ['forest'], darkTheme: 'forest' }),
  ],
})
