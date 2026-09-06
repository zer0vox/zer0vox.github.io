import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
// Base styles first: page stylesheets are imported from their own modules
// and must be able to override these, not be overridden by them.
import './index.css'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)

// Hand the screen over from the boot loader in index.html. Two frames, because
// render() only schedules the work: the first lands the commit, the second is
// the frame it is painted in, and lifting the cover any earlier shows a page
// that is not there yet.
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    const boot = document.getElementById('boot')
    if (!boot) return

    // Where the entry animation had actually got to. On a warm load React is
    // here before the .28s delay is up and this is still 0 — nothing was ever
    // shown, so there is nothing to fade and the node just goes. Reading the
    // real value rather than assuming 1 is what keeps a fast load from
    // flashing a loader on its way out.
    const opacity = Number.parseFloat(getComputedStyle(boot).opacity) || 0
    boot.style.animation = 'none'

    if (opacity < 0.02) {
      boot.remove()
      return
    }

    // Pinned to where the animation left it, then transitioned down from
    // there — a CSS animation cannot be interrupted mid-flight, it would snap
    // back to full opacity first.
    boot.style.opacity = String(opacity)
    boot.style.pointerEvents = 'none'
    requestAnimationFrame(() => {
      boot.style.transition = 'opacity .5s cubic-bezier(.2, .7, .2, 1)'
      boot.style.opacity = '0'
    })
    setTimeout(() => boot.remove(), 700)
  })
})
