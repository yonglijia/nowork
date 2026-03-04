const cloud = require("wx-server-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

function getDateKey() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { action, score, dateKey: inputDateKey } = event || {}
  
  if (!OPENID) {
    return { ok: false, error: "no_auth" }
  }
  
  const dateKey = inputDateKey || getDateKey()
  
  // 保存情绪打分
  if (action === "save") {
    if (score === undefined || score === null) {
      return { ok: false, error: "missing_score" }
    }
    
    const numScore = Number(score)
    if (isNaN(numScore) || numScore < 1 || numScore > 10) {
      return { ok: false, error: "invalid_score" }
    }
    
    const now = Date.now()
    
    // 检查今天是否已打分
    const existRes = await db.collection("mood_scores")
      .where({ _openid: OPENID, dateKey })
      .limit(1)
      .get()
    
    if (existRes.data && existRes.data.length > 0) {
      // 更新
      await db.collection("mood_scores").doc(existRes.data[0]._id).update({
        data: {
          score: numScore,
          updatedAt: now
        }
      })
      return { ok: true, updated: true }
    }
    
    // 新增
    await db.collection("mood_scores").add({
      data: {
        _openid: OPENID,
        score: numScore,
        dateKey,
        createdAt: now,
        updatedAt: now
      }
    })
    
    return { ok: true, created: true }
  }
  
  // 获取今日打分
  if (action === "get") {
    const res = await db.collection("mood_scores")
      .where({ _openid: OPENID, dateKey })
      .limit(1)
      .get()
    
    const item = res.data && res.data[0]
    if (!item) {
      return { ok: true, score: null }
    }
    
    return {
      ok: true,
      score: item.score,
      dateKey: item.dateKey
    }
  }
  
  // 获取历史打分记录
  if (action === "history") {
    const { limit = 30 } = event
    const res = await db.collection("mood_scores")
      .where({ _openid: OPENID })
      .orderBy("dateKey", "desc")
      .limit(limit)
      .get()
    
    return {
      ok: true,
      data: (res.data || []).map(item => ({
        score: item.score,
        dateKey: item.dateKey,
        createdAt: item.createdAt
      }))
    }
  }
  
  return { ok: false, error: "unknown_action" }
}
