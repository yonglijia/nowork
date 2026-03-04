const { getWageConfig, saveWageConfig, getMonthlyWageBill, getWageHistory } = require("../../utils/wageService")

Page({
  data: {
    // 配置
    config: null,
    showSetupModal: false,
    setupStep: 1,
    monthlySalary: "",
    workDays: 22,
    overtimeRate: 1.5,
    workDaysOptions: [22, 23, 24, 25],
    overtimeRateOptions: [1.5, 2],
    
    // 月度数据
    monthKey: "",
    totalWage: 0,
    avgDailyWage: 0,
    workDaysCount: 0,
    totalOvertimeHours: 0,
    totalPatience: 0,
    summaryText: "",
    monthlySalary: 0,
    dailyWage: 0,
    
    // 历史记录
    history: [],
    showHistory: false,
    loading: true
  },

  async onLoad() {
    await this.loadConfig()
  },

  async onShow() {
    if (this.data.config) {
      await this.loadMonthlyBill()
    }
  },

  async loadConfig() {
    try {
      const config = await getWageConfig()
      if (config) {
        this.setData({ 
          config,
          monthlySalary: String(config.monthlySalary),
          workDays: config.workDays,
          overtimeRate: config.overtimeRate || 1.5,
          loading: false
        })
        await this.loadMonthlyBill()
      } else {
        this.setData({ 
          showSetupModal: true, 
          setupStep: 1,
          loading: false 
        })
      }
    } catch (e) {
      this.setData({ loading: false })
      console.error("加载配置失败", e)
    }
  },

  async loadMonthlyBill() {
    try {
      const bill = await getMonthlyWageBill()
      if (bill) {
        this.setData({
          monthKey: bill.monthKey,
          totalWage: bill.totalWage,
          avgDailyWage: bill.avgDailyWage,
          workDaysCount: bill.workDays,
          totalOvertimeHours: bill.totalOvertimeHours,
          totalPatience: bill.totalPatience,
          summaryText: bill.summaryText,
          monthlySalary: bill.monthlySalary,
          dailyWage: bill.dailyWage
        })
      }
    } catch (e) {
      console.error("加载月度账单失败", e)
    }
  },

  // 设置相关
  onSalaryInput(e) {
    this.setData({ monthlySalary: e.detail.value })
  },

  onWorkDaysChange(e) {
    const index = Number(e.detail.value)
    const workDays = this.data.workDaysOptions[index]
    this.setData({ workDays })
  },

  onOvertimeRateChange(e) {
    const index = Number(e.detail.value)
    const overtimeRate = this.data.overtimeRateOptions[index]
    this.setData({ overtimeRate })
  },

  nextStep() {
    const { setupStep, monthlySalary, workDays } = this.data
    
    if (setupStep === 1) {
      if (!monthlySalary || Number(monthlySalary) <= 0) {
        wx.showToast({ title: "请输入月薪", icon: "none" })
        return
      }
      this.setData({ setupStep: 2 })
    } else if (setupStep === 2) {
      this.setData({ setupStep: 3 })
    }
  },

  prevStep() {
    const { setupStep } = this.data
    if (setupStep > 1) {
      this.setData({ setupStep: setupStep - 1 })
    }
  },

  async completeSetup() {
    const { monthlySalary, workDays, overtimeRate } = this.data
    
    try {
      const res = await saveWageConfig({
        monthlySalary: Number(monthlySalary),
        workDays,
        overtimeRate,
        pushEnabled: true
      })
      
      if (res.ok) {
        this.setData({ 
          showSetupModal: false,
          config: res.config
        })
        await this.loadMonthlyBill()
        wx.showToast({ title: "设置成功", icon: "success" })
      } else {
        wx.showToast({ title: "设置失败", icon: "none" })
      }
    } catch (e) {
      wx.showToast({ title: "设置失败", icon: "none" })
    }
  },

  showSetup() {
    this.setData({ showSetupModal: true, setupStep: 1 })
  },

  hideSetupModal() {
    if (this.data.config) {
      this.setData({ showSetupModal: false })
    }
  },

  // 今日日报
  goTodayReport() {
    wx.navigateTo({ url: "/pages/wageReport/wageReport" })
  },

  // 历史记录
  async toggleHistory() {
    if (!this.data.showHistory) {
      await this.loadHistory()
    }
    this.setData({ showHistory: !this.data.showHistory })
  },

  async loadHistory() {
    try {
      const history = await getWageHistory()
      this.setData({ history })
    } catch (e) {
      console.error("加载历史记录失败", e)
    }
  },

  goToHistoryMonth(e) {
    const monthKey = e.currentTarget.dataset.month
    wx.navigateTo({ url: `/pages/wageReport/wageReport?monthKey=${monthKey}` })
  },

  // 修改设置
  showModifySetup() {
    this.setData({ showSetupModal: true, setupStep: 1 })
  }
})
