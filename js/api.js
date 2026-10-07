const GRAPHQL_URL = 'https://learn.reboot01.com/api/graphql-engine/v1/graphql'
// Every cohort has its own module event (different id), but they all share this path
const XP_EVENT_PATH = '/bahrain/bh-module'

function logout() {
    localStorage.removeItem('jwt')
    window.location.replace('index.html')
}

function decodeJWT(token) {
    const parts = token.split('.')
    if (parts.length !== 3) throw new Error('Malformed JWT')
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
}

// Returns null when the stored token looks usable, otherwise why it is not.
// The signature can only be checked by the server, so a forged token still fails on the first query.
function sessionProblem(token = localStorage.getItem('jwt')) {
    if (!token) return 'NO SESSION TOKEN FOUND.'
    let payload
    try {
        payload = decodeJWT(token)
    } catch {
        return 'SESSION TOKEN IS MALFORMED.'
    }
    if (!payload || !/^\d+$/.test(String(payload.sub))) return 'SESSION TOKEN IS MALFORMED.'
    if (payload.exp && payload.exp * 1000 <= Date.now()) return 'SESSION HAS EXPIRED.'
    return null
}

async function graphql(query, variables = {}) {
    const res = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('jwt')}`,
        },
        body: JSON.stringify({ query, variables }),
    })

    if (res.status === 401) {
        logout()
        throw new Error('Unauthorized')
    }

    const json = await res.json()
    if (json.errors) {
        if (json.errors[0].extensions?.code === 'invalid-jwt') logout()
        throw new Error(json.errors[0].message)
    }
    return json.data
}

// NORMAL query
async function getUser() {
    const data = await graphql(`{ user { id login } }`)
    return data.user[0]
}

// ARGUMENTS query (where + order_by + variables)
async function getXPOverTime() {
    const data = await graphql(
        `query ($type: String!, $eventPath: String!) {
            transaction(
                where: { type: { _eq: $type }, event: { path: { _eq: $eventPath } } }
                order_by: { createdAt: asc }
            ) {
                amount
                createdAt
            }
        }`,
        { type: 'xp', eventPath: XP_EVENT_PATH }
    )
    return data.transaction.map((t) => ({ date: t.createdAt, amount: t.amount }))
}

// NESTED query (result -> user)
async function getResults() {
    const data = await graphql(`{ result { id grade path user { id login } } }`)
    return data.result
}

async function getPassFail() {
    const results = await getResults()
    return {
        pass: results.filter((r) => r.grade === 1).length,
        fail: results.filter((r) => r.grade === 0).length,
    }
}

function getTotalXP(xpData) {
    return xpData.reduce((sum, x) => sum + x.amount, 0)
}

// Audit totals and ratio, read from the user record
async function getAuditTotals() {
    const userId = Number(decodeJWT(localStorage.getItem('jwt')).sub)
    const data = await graphql(
        `query ($userId: Int!) {
            user_by_pk(id: $userId) { auditRatio totalUp totalDown }
        }`,
        { userId }
    )
    const u = data.user_by_pk
    return { up: u.totalUp, down: u.totalDown, ratio: u.auditRatio }
}

// Highest amount per skill, filtered on the server
async function getSkills() {
    const userId = Number(decodeJWT(localStorage.getItem('jwt')).sub)
    const data = await graphql(
        `query ($userId: Int!) {
            user_by_pk(id: $userId) {
                transactions(
                    order_by: [{ type: desc }, { amount: desc }]
                    distinct_on: [type]
                    where: { userId: { _eq: $userId }, type: { _like: "skill_%" } }
                ) { type amount }
            }
        }`,
        { userId }
    )
    return data.user_by_pk.transactions
        .map((t) => ({ name: t.type.replace('skill_', ''), value: t.amount }))
        .sort((a, b) => b.value - a.value)
}