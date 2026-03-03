const { listVentPosts, addVentPost } = require("../../utils/ventService")

function toTimeText(ms) {
  const d = new Date(ms)
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  const hh = String(d.getHours()).padStart(2, "0")
  const mm = String(d.getMinutes()).padStart(2, "0")
  return `${m}-${day} ${hh}:${mm}`
}

Page({
  data: {
    draft: "",
    items: [],
    loading: false
  },

  onLoad() {
    this.refresh()
  },

  async onPullDownRefresh() {
    await this.refresh()
    wx.stopPullDownRefresh()
  },

  onDraftInput(e) {
    this.setData({ draft: e.detail.value || "" })
  },

  async refresh() {
    if (this.data.loading) return
    this.setData({ loading: true })
    try {
      const items = await listVentPosts({ limit: 30 })
      this.setData({
        items: (items || []).map((it) => ({
          _id: it._id || `${it.createdAt || ""}_${Math.random()}`,
          text: it.text || "",
          createdAt: it.createdAt || Date.now(),
          createdAtText: toTimeText(it.createdAt || Date.now())
        }))
      })
    } catch (e) {
      wx.showToast({ title: "加载失败", icon: "none" })
    } finally {
      this.setData({ loading: false })
    }
  },

  async onPost() {
    const text = String(this.data.draft || "").trim()
    if (!text) {
      wx.showToast({ title: "先写点再发布", icon: "none" })
      return
    }
    if (text.length > 120) {
      wx.showToast({ title: "最多120字", icon: "none" })
      return
    }

    wx.showLoading({ title: "发布中..." })
    try {
      await addVentPost({ text })
      this.setData({ draft: "" })
      wx.hideLoading()
      wx.showToast({ title: "已匿名发布" })
      await this.refresh()
    } catch (e) {
      wx.hideLoading()
      if (e && e.code === "cloud_not_enabled") {
        wx.showToast({ title: "未启用云开发，暂不可发布", icon: "none" })
        return
      }
      wx.showToast({ title: "发布失败", icon: "none" })
    }
  }
})