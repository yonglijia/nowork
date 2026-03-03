function wrapTextLines(ctx, text, maxWidth) {
  const chars = String(text || "").split("")
  const lines = []
  let line = ""
  for (let i = 0; i < chars.length; i++) {
    const testLine = line + chars[i]
    const w = ctx.measureText(testLine).width
    if (w > maxWidth && line) {
      lines.push(line)
      line = chars[i]
    } else {
      line = testLine
    }
  }
  if (line) lines.push(line)
  return lines
}

async function getImageInfo(src) {
  return new Promise((resolve, reject) => {
    wx.getImageInfo({
      src,
      success: resolve,
      fail: reject
    })
  })
}

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

async function renderShareCard({ canvas, text, meme, footer }) {
  const width = 900
  const height = 1200
  const ctx = canvas.getContext("2d")

  ctx.clearRect(0, 0, width, height)
  // background mint wash
  const bg = ctx.createLinearGradient(0, 0, width, height)
  bg.addColorStop(0, "#ecfdf5")
  bg.addColorStop(1, "#f0fdfa")
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, width, height)

  // soft blobs
  drawBlob(ctx, 120, 140, 220, "rgba(45,212,191,0.22)")
  drawBlob(ctx, 760, 240, 260, "rgba(167,243,208,0.35)")
  drawBlob(ctx, 720, 1040, 240, "rgba(16,185,129,0.16)")

  const pad = 64
  const cardRadius = 36

  // card background
  const cardBg = ctx.createLinearGradient(pad, pad, width - pad, height - pad)
  cardBg.addColorStop(0, "#0f766e")
  cardBg.addColorStop(1, "#115e59")
  ctx.fillStyle = cardBg
  roundRect(ctx, pad, pad, width - pad * 2, height - pad * 2, cardRadius)
  ctx.fill()

  // meme area
  const memeBox = { x: pad + 48, y: pad + 64, w: width - (pad + 48) * 2, h: 420 }
  ctx.fillStyle = "rgba(255,255,255,0.14)"
  roundRect(ctx, memeBox.x, memeBox.y, memeBox.w, memeBox.h, 28)
  ctx.fill()

  if (meme && meme.type === "image" && meme.url) {
    try {
      const info = await getImageInfo(meme.url)
      const imgW = info.width
      const imgH = info.height
      const scale = Math.min(memeBox.w / imgW, memeBox.h / imgH)
      const dw = imgW * scale
      const dh = imgH * scale
      const dx = memeBox.x + (memeBox.w - dw) / 2
      const dy = memeBox.y + (memeBox.h - dh) / 2
      ctx.drawImage(info.path, dx, dy, dw, dh)
    } catch (e) {
      drawEmojiFallback(ctx, memeBox, "😤")
    }
  } else {
    const emoji = (meme && meme.type === "emoji" && meme.value) || "😤"
    drawEmojiFallback(ctx, memeBox, emoji)
  }

  // text
  const textX = pad + 72
  const textY = memeBox.y + memeBox.h + 72
  const textW = width - textX - (pad + 72)

  ctx.fillStyle = "#ffffff"
  ctx.font = "bold 54px sans-serif"
  ctx.textBaseline = "top"

  const lines = wrapTextLines(ctx, text, textW)
  const maxLines = 5
  const finalLines = lines.slice(0, maxLines)
  for (let i = 0; i < finalLines.length; i++) {
    const y = textY + i * 72
    ctx.fillText(finalLines[i], textX, y)
  }

  // footer
  ctx.fillStyle = "rgba(255,255,255,0.78)"
  ctx.font = "32px sans-serif"
  const footerText = footer || "今日嘴硬 · 安全发泄区"
  ctx.fillText(footerText, textX, height - pad - 96)

  return { width, height, tempFilePath: await canvasToTemp(canvas, width, height) }
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

function drawEmojiFallback(ctx, box, emoji) {
  ctx.fillStyle = "rgba(255,255,255,0.10)"
  roundRect(ctx, box.x, box.y, box.w, box.h, 28)
  ctx.fill()
  ctx.fillStyle = "#ffffff"
  ctx.font = "180px sans-serif"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(emoji, box.x + box.w / 2, box.y + box.h / 2)
  ctx.textAlign = "left"
  ctx.textBaseline = "top"
}

function drawBlob(ctx, x, y, r, color) {
  ctx.save()
  ctx.beginPath()
  ctx.fillStyle = color
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

module.exports = {
  renderShareCard
}

