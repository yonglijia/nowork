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
  const { action, text, dateKey: inputDateKey } = event || {}
  
  if (!OPENID) {
    return { ok: false, error: "no_auth" }
  }
  
  const dateKey = inputDateKey || getDateKey()
  
  // 获取今日任务
  if (action === "get") {
    const res = await db.collection("top_tasks")
      .where({ _openid: OPENID, dateKey })
      .limit(1)
      .get()
    
    const item = res.data && res.data[0]
    if (!item) {
      return { ok: true, item: null }
    }
    
    return {
      ok: true,
      item: {
        _id: item._id,
        text: item.text,
        dateKey: item.dateKey,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }
    }
  }
  
  // 设置/更新今日任务
  if (action === "set") {
    const taskText = String(text || "").trim()
    if (!taskText) {
      return { ok: false, error: "empty_text" }
    }
    if (taskText.length > 20) {
      return { ok: false, error: "too_long" }
    }
    
    // 检查今天是否已设置
    const existRes = await db.collection("top_tasks")
      .where({ _openid: OPENID, dateKey })
      .limit(1)
      .get()
    
    const now = Date.now()
    
    if (existRes.data && existRes.data.length > 0) {
      // 更新
      const existItem = existRes.data[0]
      await db.collection("top_tasks").doc(existItem._id).update({
        data: {
          text: taskText,
          updatedAt: now
        }
      })
      return {
        ok: true,
        item: {
          _id: existItem._id,
          text: taskText,
          dateKey,
          updatedAt: now
        }
      }
    }
    
    // 新增
    const addRes = await db.collection("top_tasks").add({
      data: {
        _openid: OPENID,
        text: taskText,
        dateKey,
        createdAt: now,
        updatedAt: now
      }
    })
    
    return {
      ok: true,
      item: {
        _id: addRes._id,
        text: taskText,
        dateKey,
        createdAt: now,
        updatedAt: now
      }
    }
  }
  
  // 删除今日任务
  if (action === "delete") {
    await db.collection("top_tasks")
      .where({ _openid: OPENID, dateKey })
      .remove()
    
    return { ok: true }
  }
  
  return { ok: false, error: "unknown_action" }
}
