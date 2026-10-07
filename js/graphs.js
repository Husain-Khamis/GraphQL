// Cancels XP awards that were reversed later (a negative row removes the matching earlier row)
function cancelReversals(rows) {
    const out = []
    rows.forEach((r) => {
        if (r.amount < 0) {
            const i = out.map((o) => o.amount).lastIndexOf(-r.amount)
            if (i !== -1) {
                out.splice(i, 1)
                return
            }
        }
        out.push(r)
    })
    return out
}

// Charts are drawn in real pixels at the container's width, so text stays readable on phones
const NARROW = 520

function chartWidth(container) {
    return Math.max(280, Math.floor(container.clientWidth))
}

function makeSvg(container, W, H, label) {
    const root = d3.select(container)
    root.selectAll('*').remove()
    return root.append('svg')
        .attr('viewBox', `0 0 ${W} ${H}`)
        .attr('role', 'img')
        .attr('aria-label', label)
        .style('width', '100%')
}

function noData(container) {
    const root = d3.select(container)
    root.selectAll('*').remove()
    root.append('p').attr('class', 'no-data').text('NO DATA')
}

function drawXPChart(container, xpData) {
    let sum = 0
    const pts = cancelReversals(xpData).map((d) => ({
        date: new Date(d.date),
        amount: d.amount,
        total: (sum += d.amount),
    }))
    if (pts.length === 0) return noData(container)

    const W = chartWidth(container)
    const narrow = W < NARROW
    const H = narrow ? 240 : 340
    const m = narrow ? { t: 16, r: 16, b: 32, l: 56 } : { t: 24, r: 70, b: 40, l: 70 }

    const x = d3.scaleTime().domain(d3.extent(pts, (d) => d.date)).range([m.l, W - m.r])
    const y = d3.scaleLinear().domain([0, sum]).nice().range([H - m.b, m.t])
    const xTicks = Math.max(2, Math.floor((W - m.l - m.r) / 110))

    const svg = makeSvg(container, W, H, `XP over time, total ${formatSize(sum)}`)

    // fade under the line
    const grad = svg.append('defs').append('linearGradient')
        .attr('id', 'xpFill').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 1)
    grad.append('stop').attr('offset', '0%').attr('stop-color', 'currentColor').attr('stop-opacity', 0.35)
    grad.append('stop').attr('offset', '100%').attr('stop-color', 'currentColor').attr('stop-opacity', 0)

    // horizontal gridlines are the y axis ticks, stretched across the chart
    svg.append('g')
        .attr('class', 'grid')
        .attr('transform', `translate(${m.l},0)`)
        .call(d3.axisLeft(y).ticks(narrow ? 4 : 5).tickSize(-(W - m.l - m.r)).tickPadding(narrow ? 6 : 10).tickFormat(formatSize))

    svg.append('g')
        .attr('transform', `translate(0,${H - m.b})`)
        .call(d3.axisBottom(x).ticks(xTicks).tickPadding(8))

    svg.append('path')
        .datum(pts)
        .attr('fill', 'url(#xpFill)')
        .attr('d', d3.area().x((d) => x(d.date)).y0(H - m.b).y1((d) => y(d.total)))

    svg.append('path')
        .datum(pts)
        .attr('fill', 'none')
        .attr('stroke', 'currentColor')
        .attr('stroke-width', 2)
        .attr('d', d3.line().x((d) => x(d.date)).y((d) => y(d.total)))

    // hover points
    svg.selectAll('circle').data(pts).join('circle')
        .attr('cx', (d) => x(d.date))
        .attr('cy', (d) => y(d.total))
        .attr('r', 3)
        .attr('fill', 'currentColor')
        .append('title')
        .text((d) => `${d.date.toISOString().slice(0, 10)}: +${formatSize(d.amount)} (total ${formatSize(d.total)})`)

    // current total at the end of the line (no room for it on narrow screens)
    if (narrow) return
    const last = pts[pts.length - 1]
    svg.append('text')
        .attr('x', x(last.date) + 8)
        .attr('y', y(last.total))
        .attr('dy', '0.35em')
        .attr('fill', 'currentColor')
        .text(formatSize(last.total))
}

function drawSkillsChart(container, skills) {
    if (skills.length === 0) return noData(container)

    const W = chartWidth(container)
    const narrow = W < NARROW
    const rowH = 26
    const m = narrow ? { t: 8, r: 48, b: 8, l: 110 } : { t: 8, r: 60, b: 8, l: 170 }
    const H = m.t + m.b + skills.length * rowH
    const maxChars = narrow ? 14 : 22
    const short = (s) => (s.length > maxChars ? s.slice(0, maxChars - 1) + '\u2026' : s)

    // bars are drawn out of 100, like the platform's own skill bars
    const x = d3.scaleLinear().domain([0, 100]).range([m.l, W - m.r])
    const y = d3.scaleBand().domain(skills.map((d) => d.name)).range([m.t, H - m.b]).padding(0.25)

    const svg = makeSvg(container, W, H, 'Skills')

    // labels start at the left edge of the chart
    svg.selectAll('.skill-name').data(skills).join('text')
        .attr('class', 'skill-name')
        .attr('x', 0)
        .attr('y', (d) => y(d.name) + y.bandwidth() / 2)
        .attr('dy', '0.35em')
        .attr('fill', 'currentColor')
        .text((d) => short(d.name))

    // empty track
    svg.selectAll('.track').data(skills).join('rect')
        .attr('class', 'track')
        .attr('x', m.l)
        .attr('y', (d) => y(d.name))
        .attr('width', x(100) - m.l)
        .attr('height', y.bandwidth())
        .attr('fill', 'none')
        .attr('stroke', 'currentColor')
        .attr('stroke-opacity', 0.35)

    // filled part
    svg.selectAll('.bar-fill').data(skills).join('rect')
        .attr('class', 'bar-fill')
        .attr('x', m.l)
        .attr('y', (d) => y(d.name))
        .attr('width', (d) => x(d.value) - m.l)
        .attr('height', y.bandwidth())
        .attr('fill', 'currentColor')
        .append('title')
        .text((d) => `${d.name}: ${d.value}%`)

    // values in one aligned column
    svg.selectAll('.value').data(skills).join('text')
        .attr('class', 'value')
        .attr('x', W - m.r + 8)
        .attr('y', (d) => y(d.name) + y.bandwidth() / 2)
        .attr('dy', '0.35em')
        .attr('fill', 'currentColor')
        .text((d) => `${d.value}%`)
}