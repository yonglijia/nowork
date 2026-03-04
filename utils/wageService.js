function canUseCloud() {
  return !!(wx.cloud && wx.cloud.callFunction)
}

async function callCloud(name, data = {}) {
  if (!canUseCloud()) {
    const err = new Error("cloud_not_enabled")
    err.code = "cloud_not_enabled"
    throw err
  }
  const res = await wx.cloud.callFunction({ name, data })
  return (res && res.result) || {}
}

// 获取窝囊费配置
async function getWageConfig() {
  const res = await callCloud("manageWageConfig", { action: "get" })
  return res.config || null
}

// 保存窝囊费配置
async function saveWageConfig(data) {
  const { monthlySalary, workDays, overtimeRate, pushEnabled } = data
  return await callCloud("manageWageConfig", { 
    action: "save", 
    monthlySalary, 
    workDays, 
    overtimeRate,
    pushEnabled
  })
}

// 切换推送开关
async function toggleWagePush(pushEnabled) {
  return await callCloud("manageWageConfig", { action: "togglePush", pushEnabled })
}

// 获取今日窝囊费日报
async function getTodayWageReport() {
  const res = await callCloud("getWageReport", { action: "today" })
  return res.data || null
}

// 获取月度窝囊费账单
async function getMonthlyWageBill(monthKey) {
  const res = await callCloud("getWageReport", { action: "monthly", monthKey })
  return res.data || null
}

// 获取历史月份列表
async function getWageHistory() {
  const res = await callCloud("getWageReport", { action: "history" })
  return res.data || []
}

// 计算窝囊费（本地计算，用于实时预览）
function calculateWage(monthlySalary, workDays, overtimeHours = 0, overtimeRate = 1.5) {
  const dailyWage = monthlySalary / workDays
  const hourlyWage = dailyWage / 8
  const overtimePay = overtimeHours * hourlyWage * overtimeRate
  const totalWage = dailyWage + overtimePay
  
  return {
    dailyWage: Math.round(dailyWage * 100) / 100,
    hourlyWage: Math.round(hourlyWage * 100) / 100,
    overtimePay: Math.round(overtimePay * 100) / 100,
    totalWage: Math.round(totalWage * 100) / 100
  }
}

module.exports = {
  getWageConfig,
  saveWageConfig,
  toggleWagePush,
  getTodayWageReport,
  getMonthlyWageBill,
  getWageHistory,
  calculateWage
}
