Page({
  data: {
    mode: "public",
    isPrivate: false,
    modeText: "公开",
    text: "",
    meme: { type: "emoji", value: "😤" }
  },

  onLoad(query) {
    const mode = query.mode === "private" ? "private" : "public"
    const text = safeDecode(query.t) || "今天也要嘴硬一下。"
    const meme = safeParse(safeDecode(query.m)) || { type: "emoji", value: "😤" }
    const isPrivate = mode === "private"
    this.setData({
      mode,
      isPrivate,
      modeText: isPrivate ? "私密" : "公开",
      text,
      meme
    })
  },

  onShareAppMessage() {
    const title = this.data.isPrivate ? "私密吐槽卡片" : "吐槽卡片｜今日嘴硬"
    const t = encodeURIComponent(this.data.text || "")
    const m = encodeURIComponent(JSON.stringify(this.data.meme || { type: "emoji", value: "😤" }))
    const path = `/pages/card/card?mode=${this.data.mode}&t=${t}&m=${m}`
    return { title, path }
  },

  onShareTimeline() {
    const title = this.data.isPrivate ? "私密吐槽卡片" : "吐槽卡片｜今日嘴硬"
    const t = encodeURIComponent(this.data.text || "")
    const m = encodeURIComponent(JSON.stringify(this.data.meme || { type: "emoji", value: "😤" }))
    return { title, query: `mode=${this.data.mode}&t=${t}&m=${m}` }
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