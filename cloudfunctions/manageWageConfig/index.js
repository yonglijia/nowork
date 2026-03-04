const cloud = require("wx-server-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { action, monthlySalary, workDays, overtimeRate, pushEnabled } = event || {}
  
  if (!OPENID) {
    return { ok: false, error: "no_auth" }
  }
  
  // 获取配置
  if (action === "get") {
    const res = await db.collection("wage_config")
      .where({ _openid: OPENID })
      .limit(1)
      .get()
    
    const config = res.data && res.data[0]
    if (!config) {
      return { ok: true, config: null }
    }
    
    return {
      ok: true,
      config: {
        _id: config._id,
        monthlySalary: config.monthlySalary,
        workDays: config.workDays,
        overtimeRate: config.overtimeRate || 1.5,
        pushEnabled: config.pushEnabled !== false,
        dailyWage: config.dailyWage,
        hourlyWage: config.hourlyWage,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt
      }
    }
  }
  
  // 保存配置
  if (action === "save") {
    // 参数校验
    const salary = Number(monthlySalary)
    const days = Number(workDays)
    const rate = Number(overtimeRate) || 1.5
    
    if (!salary || salary <= 0) {
      return { ok: false, error: "invalid_salary" }
    }
    if (!days || days < 20 || days > 31) {
      return { ok: false, error: "invalid_work_days" }
    }
    
    // 计算日薪和时薪
    const dailyWage = salary / days
    const hourlyWage = dailyWage / 8
    
    const now = Date.now()
    
    // 检查是否已有配置
    const existRes = await db.collection("wage_config")
      .where({ _openid: OPENID })
      .limit(1)
      .get()
    
    if (existRes.data && existRes.data.length > 0) {
      // 更新
      await db.collection("wage_config").doc(existRes.data[0]._id).update({
        data: {
          monthlySalary: salary,
          workDays: days,
          overtimeRate: rate,
          pushEnabled: pushEnabled !== false,
          dailyWage,
          hourlyWage,
          updatedAt: now
        }
      })
      
      return {
        ok: true,
        config: {
          monthlySalary: salary,
          workDays: days,
          overtimeRate: rate,
          pushEnabled: pushEnabled !== false,
          dailyWage,
          hourlyWage
        }
      }
    }
    
    // 新增
    await db.collection("wage_config").add({
      data: {
        _openid: OPENID,
        monthlySalary: salary,
        workDays: days,
        overtimeRate: rate,
        pushEnabled: pushEnabled !== false,
        dailyWage,
        hourlyWage,
        createdAt: now,
        updatedAt: now
      }
    })
    
    return {
      ok: true,
      config: {
        monthlySalary: salary,
        workDays: days,
        overtimeRate: rate,
        pushEnabled: pushEnabled !== false,
        dailyWage,
        hourlyWage
      }
    }
  }
  
  // 更新推送开关
  if (action === "togglePush") {
    const existRes = await db.collection("wage_config")
      .where({ _openid: OPENID })
      .limit(1)
      .get()
    
    if (!existRes.data || existRes.data.length === 0) {
      return { ok: false, error: "config_not_found" }
    }
    
    await db.collection("wage_config").doc(existRes.data[0]._id).update({
      data: {
        pushEnabled: pushEnabled !== false,
        updatedAt: Date.now()
      }
    })
    
    return { ok: true }
  }
  
  return { ok: false, error: "unknown_action" }
}
