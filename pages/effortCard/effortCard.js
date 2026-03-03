Page({
  data: {
    mode: "public",
    isPrivate: false,
    modeText: "公开",
    dateText: "",
    stats: { workHours: 0, overtimeHours: 0, tasksDone: 0 },
    extras: [],
    extrasText: "无",
    medals: [],
    medalsText: "未解锁"
  },

  onLoad(query) {
    const payload = safeParse(safeDecode(query.q)) || {}
    const mode = payload.mode === "private" ? "private" : "public"
    const isPrivate = mode === "private"
    const dateKey = payload.dateKey || ""
    const dateText = dateKey ? String(dateKey).replaceAll("-", ".") : ""
    const stats = payload.stats || { workHours: 0, overtimeHours: 0, tasksDone: 0 }
    const extras = Array.isArray(payload.extras) ? payload.extras : []
    const medals = Array.isArray(payload.medals) ? payload.medals : []
    this.setData({
      mode,
      isPrivate,
      modeText: isPrivate ? "私密" : "公开",
      dateText,
      stats,
      extras,
      extrasText: extras.length ? extras.join(" · ") : "无",
      medals,
      medalsText: medals.length ? medals.map((m) => m.name).join(" · ") : "未解锁"
    })
  },

  onShareAppMessage() {
    const title = this.data.isPrivate ? "私密实干卡片" : "今日实干｜付出记录器"
    const q = encodeURIComponent(
      JSON.stringify({
        mode: this.data.mode,
        dateKey: this.data.dateText.replaceAll(".", "-"),
        stats: this.data.stats,
        extras: this.data.extras,
        medals: this.data.medals
      })
    )
    return { title, path: `/pages/effortCard/effortCard?q=${q}` }
  },

  onShareTimeline() {
    const title = this.data.isPrivate ? "私密实干卡片" : "今日实干｜付出记录器"
    const q = encodeURIComponent(
      JSON.stringify({
        mode: this.data.mode,
        dateKey: this.data.dateText.replaceAll(".", "-"),
        stats: this.data.stats,
        extras: this.data.extras,
        medals: this.data.medals
      })
    )
    return { title, query: `q=${q}` }
  }
})

function safeDecode(v) {
  try {
    return decodeURIComponent(v || "")
  } catch (e) {
    return v || ""
  }
}

function safeParse(v) {
  try {
    return JSON.parse(v || "")
  } catch (e) {
    return null
  }
}

