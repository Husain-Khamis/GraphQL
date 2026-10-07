const SIGNIN_URL = 'https://learn.reboot01.com/api/auth/signin'

const form = document.getElementById('loginForm')
const errorMsg = document.getElementById('error')
const calling = document.getElementById('calling')

Codec.bindSoundButton(document.getElementById('soundBtn'))

if (localStorage.getItem('jwt')) {
    window.location.href = 'profile.html'
}

function endCall() {
    Codec.stop('loggingIn')
    calling.hidden = true
}

form.addEventListener('submit', async (e) => {
    e.preventDefault()
    errorMsg.textContent = ''

    const id = document.getElementById('idInput').value.trim()
    const password = document.getElementById('passwordInput').value

    calling.hidden = false
    Codec.play('loggingIn')

    try {
        const creds = btoa(`${id}:${password}`)
        const res = await fetch(SIGNIN_URL, {
            method: 'POST',
            headers: { Authorization: `Basic ${creds}` },
        })

        if (!res.ok) {
            endCall()
            errorMsg.textContent = 'Invalid Username/Email Or Password'
            return
        }

        const raw = await res.text()
        const token = raw.replace(/^"|"$/g, '')

        localStorage.setItem('jwt', token)

        Codec.stop('loggingIn')
        await Codec.playAndWait('login', 3000)
        window.location.href = 'profile.html'
    } catch (err) {
        endCall()
        errorMsg.textContent = 'Something went wrong. Please Try Again'
    }
})