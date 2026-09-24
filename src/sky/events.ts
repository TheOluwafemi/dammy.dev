// Events between the sky and the preloader, kept apart from sky.ts so the preloader
// doesn't need to import the WebGL code.

/** Fired on document once the first frame (with the cloud text on home) is on screen. */
export const SKY_READY = 'sky:ready'
/** Dispatch on document to let the cloud headline condense (the preloader does this on exit). */
export const SKY_CONDENSE = 'sky:condense'

export const skyIsReady = () => Boolean((window as unknown as { __skyReady?: boolean }).__skyReady)
export const markSkyReady = () => {
  ;(window as unknown as { __skyReady?: boolean }).__skyReady = true
  document.dispatchEvent(new Event(SKY_READY))
}
