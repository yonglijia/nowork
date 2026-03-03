const cloud = require("wx-server-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { action, scriptId, scriptText, category, categoryName } = event || {}
  
  if (!OPENID) {
    return { ok: false, error: "no_auth" }
  }
  
  // 添加收藏
  if (action === "add") {
    if (!scriptId || !scriptText) {
      return { ok: false, error: "missing_params" }
    }
    
    // 检查是否已收藏
    const existRes = await db.collection("favorite_scripts")
      .where({ _openid: OPENID, scriptId })
      .limit(1)
      .get()
    
    if (existRes.data && existRes.data.length > 0) {
      return { ok: true, message: "already_favorited" }
    }
    
    await db.collection("favorite_scripts").add({
      data: {
        _openid: OPENID,
        scriptId,
        scriptText,
        category: category || "",
        categoryName: categoryName || "",
        createdAt: Date.now()
      }
    })
    
    return { ok: true }
  }
  
  // 取消收藏
  if (action === "remove") {
    if (!scriptId) {
      return { ok: false, error: "missing_script_id" }
    }
    
    await db.collection("favorite_scripts")
      .where({ _openid: OPENID, scriptId })
      .remove()
    
    return { ok: true }
  }
  
  // 批量删除
  if (action === "removeBatch") {
    const { scriptIds } = event
    if (!scriptIds || !Array.isArray(scriptIds) || scriptIds.length === 0) {
      return { ok: false, error: "missing_script_ids" }
    }
    
    await db.collection("favorite_scripts")
      .where({
        _openid: OPENID,
        scriptId: _.in(scriptIds)
      })
      .remove()
    
    return { ok: true }
  }
  
  // 检查是否已收藏
  if (action === "check") {
    if (!scriptId) {
      return { ok: false, error: "missing_script_id" }
    }
    
    const res = await db.collection("favorite_scripts")
      .where({ _openid: OPENID, scriptId })
      .limit(1)
      .get()
    
    return { ok: true, isFavorited: res.data && res.data.length > 0 }
  }
  
  // 获取收藏列表
  if (action === "list") {
    const res = await db.collection("favorite_scripts")
      .where({ _openid: OPENID })
      .orderBy("createdAt", "desc")
      .limit(100)
      .get()
    
    return {
      ok: true,
      data: (res.data || []).map(item => ({
        _id: item._id,
        scriptId: item.scriptId,
        scriptText: item.scriptText,
        category: item.category,
        categoryName: item.categoryName,
        createdAt: item.createdAt
      }))
    }
  }
  
  return { ok: false, error: "unknown_action" }
}
