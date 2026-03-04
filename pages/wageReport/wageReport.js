const { getTodayWageReport, getMonthlyWageBill, getWageConfig } = require("../../utils/wageService")

Page({
  data: {
    loading: true,
    needSetup: false,
    
    // 日报数据
    dateKey: "",
    todayWage: 0,
    dailyWage: 0,
    overtimePay: 0,
    overtimeHours: 0,
    totalHours: 0,
    todayPatience: 0,
    hourlyWage: 0,
    overtimeRate: 1.5,
    comfortText: "",
    dailyText: "",
    
    // 是否是历史月份
    isHistory: false,
    monthKey: "",
    
    // 月度数据（用于历史查看）
    monthlyData: null
  },

  async onLoad(options) {
    const monthKey = options.monthKey
    
    if (monthKey) {
      // 查看历史月份
      this.setData({ isHistory: true, monthKey })
      await this.loadHistoryMonth(monthKey)
    } else {
      // 查看今日日报
      await this.loadTodayReport()
    }
  },

  async loadTodayReport() {
    try {
      const data = await getTodayWageReport()
      if (data) {
        this.setData({
          ...data,
          loading: false
        })
      }
    } catch (e) {
      if (e.needSetup || e.error === "config_not_found") {
        this.setData({ 
          loading: false, 
          needSetup: true 
        })
      } else {
        this.setData({ loading: false })
        wx.showToast({ title: "加载失败", icon: "none" })
      }
    }
  },

  async loadHistoryMonth(monthKey) {
    try {
      const data = await getMonthlyWageBill(monthKey)
      if (data) {
        this.setData({
          monthlyData: data,
          loading: false
        })
      }
    } catch (e) {
      this.setData({ loading: false })
      wx.showToast({ title: "加载失败", icon: "none" })
    }
  },

  goSetup() {
    wx.navigateTo({ url: "/pages/wageBill/wageBill" })
  },

  goBack() {
    wx.navigateBack()
  },

  // 保存图片
  async onSaveImage() {
    // TODO: 实现图片保存功能
    wx.showToast({ title: "功能开发中", icon: "none" })
  },

  // 分享
  onShareAppMessage() {
    const { todayWage, dailyText } = this.data
    return {
      title: `今日窝囊费 ¥${todayWage}，${dailyText}`,
      path: "/pages/wageBill/wageBill"
    }
  }
})
