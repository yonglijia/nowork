const { listMedals } = require("../../utils/effortService")

function toTimeText(ms) {
  const d = new Date(ms)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}.${m}.${day}`
}

Page({
  data: {
    items: []
  },

  onLoad() {
    this.refresh()
  },

  async onPullDownRefresh() {
    await this.refresh()
    wx.stopPullDownRefresh()
  },

  async refresh() {
    try {
      const items = await listMedals()
      this.setData({
        items: (items || []).map((it) => ({
          key: it.key,
          name: it.name,
          desc: it.desc,
          unlockedAt: it.unlockedAt,
          unlockedAtText: toTimeText(it.unlockedAt || Date.now())
        }))
      })
    } catch (e) {
      wx.showToast({ title: "加载失败", icon: "none" })
    }
  }
})

