async function canvasToTemp(canvas, width, height) {
  return new Promise((resolve, reject) => {
    wx.canvasToTempFilePath({
      canvas,
      width,
      height,
      destWidth: width,
      destHeight: height,
      fileType: "png",
      quality: 1,
      success: (res) => resolve(res.tempFilePath),
      fail: reject
    })
  })
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function blob(ctx, x, y, r, color) {
  ctx.save()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function wrapLines(ctx, text, maxWidth) {
  const chars = String(text || "").split("")
  const lines = []
  let line = ""
  for (const ch of chars) {
    const next = line + ch
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line)
      line = ch
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}

async function renderEffortCard({ canvas, dateText, stats, extras, medals }) {
  const width = 900
  const height = 1200
  const ctx = canvas.getContext("2d")

  // background
  const bg = ctx.createLinearGradient(0, 0, width, height)
  bg.addColorStop(0, "#ecfdf5")
  bg.addColorStop(1, "#f0fdfa")
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, width, height)
  blob(ctx, 130, 170, 230, "rgba(45,212,191,0.22)")
  blob(ctx, 770, 240, 270, "rgba(167,243,208,0.35)")
  blob(ctx, 720, 1040, 240, "rgba(16,185,129,0.16)")

  const pad = 64
  const cardX = pad
  const cardY = pad
  const cardW = width - pad * 2
  const cardH = height - pad * 2

  const cardBg = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH)
  cardBg.addColorStop(0, "#0f766e")
  cardBg.addColorStop(1, "#115e59")
  ctx.fillStyle = cardBg
  roundRect(ctx, cardX, cardY, cardW, cardH, 40)
  ctx.fill()

  // header
  ctx.fillStyle = "rgba(255,255,255,0.96)"
  ctx.font = "900 48px sans-serif"
  ctx.textBaseline = "top"
  ctx.fillText("今日实干", cardX + 56, cardY + 56)

  ctx.fillStyle = "rgba(255,255,255,0.78)"
  ctx.font = "32px sans-serif"
  ctx.fillText(dateText || "", cardX + 56, cardY + 120)

  // stats grid
  const gridX = cardX + 56
  const gridY = cardY + 190
  const gridW = cardW - 112
  const cellW = (gridW - 24) / 2
  const cellH = 150

  const cells = [
    { label: "工作时长", value: `${stats.workHours}h` },
    { label: "加班时长", value: `${stats.overtimeHours}h` },
    { label: "完成任务", value: `${stats.tasksDone}项` },
    { label: "额外付出", value: `${(extras || []).length}项` }
  ]

  for (let i = 0; i < cells.length; i++) {
    const r = Math.floor(i / 2)
    const c = i % 2
    const x = gridX + c * (cellW + 24)
    const y = gridY + r * (cellH + 18)
    ctx.fillStyle = "rgba(255,255,255,0.14)"
    roundRect(ctx, x, y, cellW, cellH, 28)
    ctx.fill()

    ctx.fillStyle = "rgba(255,255,255,0.75)"
    ctx.font = "28px sans-serif"
    ctx.fillText(cells[i].label, x + 26, y + 22)

    ctx.fillStyle = "#ffffff"
    ctx.font = "900 52px sans-serif"
    ctx.fillText(cells[i].value, x + 26, y + 64)
  }

  // extras
  const extrasY = gridY + 2 * (cellH + 18) + 24
  ctx.fillStyle = "rgba(255,255,255,0.86)"
  ctx.font = "900 34px sans-serif"
  ctx.fillText("额外付出", gridX, extrasY)

  const extrasText = (extras && extras.length ? extras.join(" · ") : "无")
  ctx.fillStyle = "rgba(255,255,255,0.78)"
  ctx.font = "32px sans-serif"
  const lines = wrapLines(ctx, extrasText, gridW)
  const showLines = lines.slice(0, 2)
  showLines.forEach((line, idx) => {
    ctx.fillText(line, gridX, extrasY + 52 + idx * 44)
  })

  // medals
  const medalsY = extrasY + 160
  ctx.fillStyle = "rgba(255,255,255,0.86)"
  ctx.font = "900 34px sans-serif"
  ctx.fillText("已解锁勋章", gridX, medalsY)

  const medalNames = (medals || []).map((m) => m.name).slice(0, 3)
  ctx.fillStyle = "rgba(255,255,255,0.78)"
  ctx.font = "32px sans-serif"
  ctx.fillText(medalNames.length ? medalNames.join(" · ") : "未解锁", gridX, medalsY + 52)

  // footer
  ctx.fillStyle = "rgba(255,255,255,0.72)"
  ctx.font = "30px sans-serif"
  ctx.fillText("今日实干 · 付出记录器", gridX, cardY + cardH - 90)

  return { width, height, tempFilePath: await canvasToTemp(canvas, width, height) }
}

module.exports = {
  renderEffortCard
}

