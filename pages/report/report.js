const { getReports } = require("../../utils/effortService")

Page({
  data: {
    week: { rangeText: "-", workHours: 0, overtimeHours: 0, tasksDone: 0 },
    month: { rangeText: "-", workHours: 0, overtimeHours: 0, tasksDone: 0 }
  },

  onLoad() {
    this.refresh()
  },

  async onPullDownRefresh() {
    await this.refresh()
    wx.stopPullDownRefresh()
  },

  async refresh() {
    wx.showLoading({ title: "统计中..." })
    try {
      const res = await getReports()
      if (res) {
        this.setData({
          week: res.week,
          month: res.month
        })
      }
      wx.hideLoading()
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: "加载失败", icon: "none" })
    }
  }
})

