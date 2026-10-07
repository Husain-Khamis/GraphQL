const statusEl = document.getElementById('status')
const dialogue = document.getElementById('dialogue')
const wave = document.getElementById('wave')

document.getElementById('logoutBtn').addEventListener('click', async () => {
    await Codec.playAndWait('logout', 2500)
    logout()
})
Codec.bindSoundButton(document.getElementById('soundBtn'))

// Route guard: without a usable token the profile is never shown, only the error page
const problem = sessionProblem()
if (problem) {
    localStorage.removeItem('jwt')
    document.title = 'Unauthorized'
    document.getElementById('deniedMsg').textContent = problem
    document.getElementById('denied').hidden = false
} else {
    document.getElementById('app').hidden = false
    init()
}

function formatSize(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(2) + ' MB'
    if (n >= 1e3) return Math.round(n / 1e3) + ' KB'
    return n + ' B'
}

// Decorative frequency, derived from the user id
function frequency(userId, i) {
    const whole = 100 + (userId % 90)
    const dec = String((userId + i * 7) % 100).padStart(2, '0')
    return `${whole}.${dec}`
}

function el(tag, className, text) {
    const e = document.createElement(tag)
    if (className) e.className = className
    if (text !== undefined) e.textContent = text
    return e
}

// label + value row
function row(label, value, i, big = false) {
    const r = el('div', big ? 'row big' : 'row')
    r.style.setProperty('--i', i)
    r.append(el('span', 'label', label), el('span', 'value', String(value)))
    return r
}

// label + bar + value row (pct is 0 to 100)
function barRow(label, valueText, pct, i) {
    const r = el('div', 'row bar-row')
    r.style.setProperty('--i', i)
    const bar = el('div', 'bar')
    const fill = el('div', 'fill')
    fill.style.width = `${Math.min(100, Math.max(0, pct))}%`
    bar.append(fill)
    r.append(el('span', 'label', label), bar, el('span', 'value', valueText))
    return r
}

// Each contact builds fresh rows every time, so the reveal animation replays
function buildContacts({ user, xpData, audits, skills }) {
    const maxAudit = Math.max(audits.up, audits.down) || 1
    return [
        {
            name: 'IDENTITY',
            img: 'ID.png',
            rows: () => [row('ID', user.id, 0, true), row('LOGIN', user.login, 1, true)],
        },
        {
            name: 'XP',
            img: 'xp.png',
            rows: () => [row('TOTAL XP', formatSize(getTotalXP(xpData)), 0, true)],
        },
        {
            name: 'AUDITS',
            img: 'audits.png',
            rows: () => [
                barRow('DONE', formatSize(audits.up), (audits.up / maxAudit) * 100, 0),
                barRow('RECEIVED', formatSize(audits.down), (audits.down / maxAudit) * 100, 1),
                row('RATIO', audits.ratio.toFixed(2), 2, true),
            ],
        },
        {
            name: 'SKILLS',
            img: 'skills.png',
            rows: () =>
                skills.map((s, i) => barRow(s.name.toUpperCase(), `${s.value}%`, s.value, i)),
        },
    ]
}

function setupContacts(contacts, userId) {
    const nav = document.getElementById('contacts')
    const frame = document.getElementById('contactFrame')
    const img = document.getElementById('contactImg')
    let current = -1
    let run = 0

    const buttons = contacts.map((c, i) => {
        const b = document.createElement('button')
        b.type = 'button'
        b.textContent = c.name
        b.addEventListener('click', () => select(i))
        nav.appendChild(b)
        return b
    })

    function select(i, clickSound = false) {
        const n = (i + contacts.length) % contacts.length
        if (n === current) return
        current = n
        const mine = ++run

        buttons.forEach((b, j) => b.setAttribute('aria-pressed', String(j === n)))
        document.getElementById('contactName').textContent = contacts[n].name
        document.getElementById('freq').textContent = frequency(userId, n)

        img.src = `assets/${contacts[n].img}`
        img.alt = contacts[n].name

        frame.classList.remove('tuning')
        void frame.offsetWidth
        frame.classList.add('tuning')

        if (clickSound) Codec.play('btnClick')

        dialogue.replaceChildren(...contacts[n].rows())
        dialogue.scrollTop = 0

        wave.classList.add('talking')
        setTimeout(() => {
            if (mine === run) wave.classList.remove('talking')
        }, 1000)
    }

    document.getElementById('prevBtn').addEventListener('click', () => select(current - 1))
    document.getElementById('nextBtn').addEventListener('click', () => select(current + 1))
    document.addEventListener('keydown', (e) => {
        if (eggOpen()) return
        if (e.key === 'ArrowLeft') select(current - 1, true)
        if (e.key === 'ArrowRight') select(current + 1, true)
    })

    select(0)
}

// Easter egg: this arrow sequence plays a video
const EGG_SEQUENCE = [
    'ArrowLeft', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowUp',
]
const egg = document.getElementById('egg')
const eggVideo = document.getElementById('eggVideo')
const eggOpen = () => !egg.hidden
const EGG_FADE_MS = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1200
let eggFadeTimer

function openEgg() {
    clearTimeout(eggFadeTimer)
    egg.classList.remove('fading')
    egg.hidden = false
    eggVideo.muted = localStorage.getItem('codecSound') === 'off'
    eggVideo.currentTime = 0
    eggVideo.play().catch(() => {})
}

function closeEgg() {
    clearTimeout(eggFadeTimer)
    eggVideo.pause()
    egg.classList.remove('fading')
    egg.hidden = true
}

// When the video ends on its own, fade the overlay out before hiding it
function fadeOutEgg() {
    egg.classList.add('fading')
    eggFadeTimer = setTimeout(closeEgg, EGG_FADE_MS)
}

let eggKeys = []
document.addEventListener('keydown', (e) => {
    if (eggOpen()) {
        if (e.key === 'Escape') closeEgg()
        return
    }
    if (!e.key.startsWith('Arrow')) return
    eggKeys = [...eggKeys, e.key].slice(-EGG_SEQUENCE.length)
    if (eggKeys.join() === EGG_SEQUENCE.join()) {
        e.preventDefault()
        eggKeys = []
        openEgg()
    }
})
eggVideo.addEventListener('ended', fadeOutEgg)
egg.addEventListener('click', (e) => {
    if (e.target === egg) closeEgg()
})
document.getElementById('eggClose').addEventListener('click', closeEgg)

// Charts are drawn at the container's real width, and redrawn when that width changes
function drawCharts(xpData, skills) {
    const xpEl = document.getElementById('xpChart')
    const skillsEl = document.getElementById('skillsChart')
    const draw = () => {
        drawXPChart(xpEl, xpData)
        drawSkillsChart(skillsEl, skills)
    }
    draw()

    let width = xpEl.clientWidth
    let timer
    window.addEventListener('resize', () => {
        clearTimeout(timer)
        timer = setTimeout(() => {
            if (xpEl.clientWidth === width) return
            width = xpEl.clientWidth
            draw()
        }, 150)
    })
}

// Placeholder blocks shown while the profile data is loading.
// Real content replaces them, since the dialogue and charts clear their children before drawing.
function showSkeleton() {
    const bar = (cls) => {
        const b = el('div', `skeleton ${cls}`)
        b.setAttribute('aria-hidden', 'true')
        return b
    }
    const app = document.getElementById('app')
    app.classList.add('loading')
    app.setAttribute('aria-busy', 'true')

    dialogue.replaceChildren(
        ...[0, 1, 2].map(() => {
            const r = el('div', 'row skeleton-row')
            r.append(bar('sk-label'), bar('sk-value'))
            return r
        })
    )
    document.getElementById('xpChart').replaceChildren(bar('sk-chart'))
    document.getElementById('skillsChart').replaceChildren(
        ...[0, 1, 2, 3].map(() => bar('sk-skill'))
    )
}

function hideSkeleton() {
    const app = document.getElementById('app')
    app.classList.remove('loading')
    app.removeAttribute('aria-busy')
    document.querySelectorAll('.skeleton, .skeleton-row').forEach((s) => s.remove())
}

async function init() {
    showSkeleton()
    statusEl.textContent = 'CONNECTING...'
    try {
        const [user, xpData, audits, skills] = await Promise.all([
            getUser(),
            getXPOverTime(),
            getAuditTotals(),
            getSkills(),
        ])

        document.getElementById('selfName').textContent = user.login.toUpperCase()
        setupContacts(buildContacts({ user, xpData, audits, skills }), user.id)

        drawCharts(xpData, skills)

        statusEl.textContent = ''
    } catch (err) {
        statusEl.textContent = 'TRANSMISSION FAILED. TRY AGAIN.'
    } finally {
        hideSkeleton()
    }
}