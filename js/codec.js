const Codec = (() => {
    const KEY = 'codecSound'
    const VOLUME = 0.7
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let typing = 0

    const soundOn = () => localStorage.getItem(KEY) !== 'off'

    const sounds = {}
    ;['btnClick', 'loggingIn', 'login', 'logout', 'switching'].forEach((name) => {
        const a = new Audio(`assets/${name}.mp3`)
        a.preload = 'auto'
        a.volume = VOLUME
        sounds[name] = a
    })

    // Fire and forget. Browsers block audio before a user gesture, so errors are ignored.
    function play(name) {
        if (!soundOn()) return
        const a = sounds[name]
        a.currentTime = 0
        a.play().catch(() => {})
    }

    function stop(name) {
        const a = sounds[name]
        a.pause()
        a.currentTime = 0
    }

    // Plays a sound and resolves when it ends, or after `cap` ms at most
    function playAndWait(name, cap = 3000) {
        return new Promise((resolve) => {
            if (!soundOn()) return resolve()
            const a = sounds[name]
            const done = () => {
                clearTimeout(timer)
                resolve()
            }
            const timer = setTimeout(done, cap)
            a.currentTime = 0
            a.addEventListener('ended', done, { once: true })
            a.play().catch(done)
        })
    }

    // Click sound for every button, except those that have their own sound (data-sfx)
    document.addEventListener('click', (e) => {
        const b = e.target.closest('button')
        if (b && !b.dataset.sfx) play('btnClick')
    })

    // Typewriter. A newer call cancels any typing still in progress.
    function type(el, text, speed = 18) {
        const id = ++typing
        el.textContent = ''
        if (reduced) {
            el.textContent = text
            return Promise.resolve()
        }
        return new Promise((resolve) => {
            let i = 0
            const step = () => {
                if (id !== typing) return resolve()
                i += 1
                el.textContent = text.slice(0, i)
                el.scrollTop = el.scrollHeight
                if (i < text.length) setTimeout(step, speed)
                else resolve()
            }
            step()
        })
    }

    function bindSoundButton(btn) {
        const label = () => (btn.textContent = `SOUND: ${soundOn() ? 'ON' : 'OFF'}`)
        label()
        btn.addEventListener('click', () => {
            localStorage.setItem(KEY, soundOn() ? 'off' : 'on')
            label()
        })
    }

    return { play, stop, playAndWait, type, bindSoundButton }
})()