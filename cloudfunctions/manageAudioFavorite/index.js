const cloud = require("wx-server-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { action, audioId, audioTitle, category, categoryName, duration, url } = event || {}
  
  if (!OPENID) {
    return { ok: false, error: "no_auth" }
  }
  
  // 添加收藏
  if (action === "add") {
    if (!audioId) {
      return { ok: false, error: "missing_audio_id" }
    }
    
    // 检查是否已收藏
    const existRes = await db.collection("favorite_audios")
      .where({ _openid: OPENID, audioId })
      .limit(1)
      .get()
    
    if (existRes.data && existRes.data.length > 0) {
      return { ok: true, message: "already_favorited" }
    }
    
    await db.collection("favorite_audios").add({
      data: {
        _openid: OPENID,
        audioId,
        audioTitle: audioTitle || "",
        category: category || "",
        categoryName: categoryName || "",
        duration: duration || 0,
        url: url || "",
        createdAt: Date.now()
      }
    })
    
    return { ok: true }
  }
  
  // 取消收藏
  if (action === "remove") {
    if (!audioId) {
      return { ok: false, error: "missing_audio_id" }
    }
    
    await db.collection("favorite_audios")
      .where({ _openid: OPENID, audioId })
      .remove()
    
    return { ok: true }
  }
  
  // 批量删除
  if (action === "removeBatch") {
    const { audioIds } = event
    if (!audioIds || !Array.isArray(audioIds) || audioIds.length === 0) {
      return { ok: false, error: "missing_audio_ids" }
    }
    
    await db.collection("favorite_audios")
      .where({
        _openid: OPENID,
        audioId: _.in(audioIds)
      })
      .remove()
    
    return { ok: true }
  }
  
  // 检查是否已收藏
  if (action === "check") {
    if (!audioId) {
      return { ok: false, error: "missing_audio_id" }
    }
    
    const res = await db.collection("favorite_audios")
      .where({ _openid: OPENID, audioId })
      .limit(1)
      .get()
    
    return { ok: true, isFavorited: res.data && res.data.length > 0 }
  }
  
  // 获取收藏列表
  if (action === "list") {
    const res = await db.collection("favorite_audios")
      .where({ _openid: OPENID })
      .orderBy("createdAt", "desc")
      .limit(100)
      .get()
    
    return {
      ok: true,
      data: (res.data || []).map(item => ({
        _id: item._id,
        audioId: item.audioId,
        audioTitle: item.audioTitle,
        category: item.category,
        categoryName: item.categoryName,
        duration: item.duration,
        url: item.url,
        createdAt: item.createdAt
      }))
    }
  }
  
  return { ok: false, error: "unknown_action" }
}
