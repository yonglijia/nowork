const cloud = require("wx-server-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 治愈自嘲文案库
const COMFORT_TEXTS = [
  "辛苦了，今天又是一条好汉！",
  "窝囊费到手，明天继续躺平。",
  "钱虽然不多，但每一分都是血汗钱。",
  "打工人打工魂，打工都是人上人！",
  "今天又是为生活奔波的一天呢~",
  "窝囊费已入账，明天继续加油打工人！",
  "虽然很累，但至少有钱拿对吧？",
  "今天的窝囊费，明天的奶茶钱！",
  "钱不钱的不重要，主要是想体验生活。",
  "又苟了一天，窝囊费get！"
]

// 日报展示文案
const DAILY_TEXTS = [
  "今日份的窝囊费已结算完毕~",
  "打工人收工，窝囊费到手！",
  "又是辛苦搬砖的一天呢~",
  "钱到手了，累了也值了！"
]

function getDateKey() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function getMonthKey() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  return `${y}-${m}`
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { action, dateKey: inputDateKey, monthKey: inputMonthKey } = event || {}
  
  if (!OPENID) {
    return { ok: false, error: "no_auth" }
  }
  
  const dateKey = inputDateKey || getDateKey()
  const monthKey = inputMonthKey || getMonthKey()
  
  // 获取今日日报
  if (action === "today") {
    // 获取用户配置
    const configRes = await db.collection("wage_config")
      .where({ _openid: OPENID })
      .limit(1)
      .get()
    
    const config = configRes.data && configRes.data[0]
    if (!config) {
      return { ok: false, error: "config_not_found", needSetup: true }
    }
    
    // 获取今日实干数据
    const effortRes = await db.collection("efforts")
      .where({ _openid: OPENID, dateKey })
      .limit(1)
      .get()
    
    const effort = effortRes.data && effortRes.data[0]
    
    // 计算今日数据
    const dailyWage = config.dailyWage
    const hourlyWage = config.hourlyWage
    const overtimeRate = config.overtimeRate || 1.5
    
    // 工作时长
    const workHours = effort ? (effort.workHours || 0) : 0
    const overtimeHours = effort ? (effort.overtimeHours || 0) : 0
    
    // 加班费
    const overtimePay = overtimeHours * hourlyWage * overtimeRate
    
    // 今日窝囊费
    const todayWage = dailyWage + overtimePay
    
    // 今日工时
    const totalHours = workHours + overtimeHours
    
    // 获取今日忍耐值（从情绪忍耐记录计算）
    const忍耐Res = await db.collection("patience_records")
      .where({ _openid: OPENID, dateKey })
      .get()
    const patienceCount = (忍耐Res.data || []).length
    const todayPatience = patienceCount * 10
    
    return {
      ok: true,
      data: {
        dateKey,
        todayWage: Math.round(todayWage * 100) / 100,
        dailyWage: Math.round(dailyWage * 100) / 100,
        overtimePay: Math.round(overtimePay * 100) / 100,
        overtimeHours,
        totalHours,
        todayPatience,
        hourlyWage: Math.round(hourlyWage * 100) / 100,
        overtimeRate,
        comfortText: getRandomItem(COMFORT_TEXTS),
        dailyText: getRandomItem(DAILY_TEXTS)
      }
    }
  }
  
  // 获取月度账单
  if (action === "monthly") {
    // 获取用户配置
    const configRes = await db.collection("wage_config")
      .where({ _openid: OPENID })
      .limit(1)
      .get()
    
    const config = configRes.data && configRes.data[0]
    if (!config) {
      return { ok: false, error: "config_not_found", needSetup: true }
    }
    
    // 获取该月所有实干数据
    const effortsRes = await db.collection("efforts")
      .where({ 
        _openid: OPENID,
        dateKey: _.regex(`^${monthKey}`)
      })
      .get()
    
    const efforts = effortsRes.data || []
    
    // 获取该月忍耐值记录
    const patienceRes = await db.collection("patience_records")
      .where({ 
        _openid: OPENID,
        dateKey: _.regex(`^${monthKey}`)
      })
      .get()
    
    const patienceRecords = patienceRes.data || []
    const totalPatience = patienceRecords.length * 10
    
    // 计算月度数据
    const dailyWage = config.dailyWage
    const hourlyWage = config.hourlyWage
    const overtimeRate = config.overtimeRate || 1.5
    
    let totalWage = 0
    let totalOvertimeHours = 0
    let workDays = efforts.length
    
    efforts.forEach(e => {
      const overtimeHours = e.overtimeHours || 0
      const overtimePay = overtimeHours * hourlyWage * overtimeRate
      totalWage += dailyWage + overtimePay
      totalOvertimeHours += overtimeHours
    })
    
    // 日均收入
    const avgDailyWage = workDays > 0 ? totalWage / workDays : 0
    
    // 生成总结文案
    let summaryText = ""
    if (totalWage > dailyWage * 25) {
      summaryText = "本月窝囊费爆表！打工人实锤了！"
    } else if (totalWage > dailyWage * 20) {
      summaryText = "本月收获满满，辛苦了打工人！"
    } else if (workDays > 0) {
      summaryText = "本月稳扎稳打，继续保持！"
    } else {
      summaryText = "本月还没开始记录呢，快去记录吧~"
    }
    
    return {
      ok: true,
      data: {
        monthKey,
        totalWage: Math.round(totalWage * 100) / 100,
        avgDailyWage: Math.round(avgDailyWage * 100) / 100,
        workDays,
        totalOvertimeHours: Math.round(totalOvertimeHours * 10) / 10,
        totalPatience,
        summaryText,
        monthlySalary: config.monthlySalary,
        dailyWage: Math.round(dailyWage * 100) / 100
      }
    }
  }
  
  // 获取历史月份列表
  if (action === "history") {
    // 获取用户配置
    const configRes = await db.collection("wage_config")
      .where({ _openid: OPENID })
      .limit(1)
      .get()
    
    const config = configRes.data && configRes.data[0]
    if (!config) {
      return { ok: false, error: "config_not_found", needSetup: true }
    }
    
    // 获取所有有记录的月份
    const effortsRes = await db.collection("efforts")
      .where({ _openid: OPENID })
      .orderBy("dateKey", "desc")
      .limit(365)
      .get()
    
    const efforts = effortsRes.data || []
    
    // 按月份分组统计
    const monthMap = {}
    efforts.forEach(e => {
      const mKey = e.dateKey.substring(0, 7)
      if (!monthMap[mKey]) {
        monthMap[mKey] = {
          monthKey: mKey,
          workDays: 0,
          totalOvertimeHours: 0
        }
      }
      monthMap[mKey].workDays++
      monthMap[mKey].totalOvertimeHours += e.overtimeHours || 0
    })
    
    // 计算每月窝囊费
    const dailyWage = config.dailyWage
    const hourlyWage = config.hourlyWage
    const overtimeRate = config.overtimeRate || 1.5
    
    const history = Object.values(monthMap).map(m => {
      const overtimePay = m.totalOvertimeHours * hourlyWage * overtimeRate
      const totalWage = m.workDays * dailyWage + overtimePay
      return {
        ...m,
        totalWage: Math.round(totalWage * 100) / 100,
        totalOvertimeHours: Math.round(m.totalOvertimeHours * 10) / 10
      }
    }).sort((a, b) => b.monthKey.localeCompare(a.monthKey))
    
    return {
      ok: true,
      data: history
    }
  }
  
  return { ok: false, error: "unknown_action" }
}
