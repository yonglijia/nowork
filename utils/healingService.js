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

// 获取今日治愈文案
async function getHealingQuote() {
  const res = await callCloud("getHealingContent", { action: "getQuote" })
  return res.data || null
}

// 获取疏导文案
async function getGuidance(score) {
  const res = await callCloud("getHealingContent", { action: "getGuidance", score })
  return res.data || null
}

// 获取音频列表
async function getAudios(options = {}) {
  const { category, keyword } = options
  const res = await callCloud("getHealingContent", { action: "getAudios", category, keyword })
  return res.data || []
}

// 保存情绪打分
async function saveMoodScore(score) {
  return await callCloud("saveMoodScore", { action: "save", score })
}

// 获取今日情绪打分
async function getMoodScore() {
  const res = await callCloud("saveMoodScore", { action: "get" })
  return res.score !== undefined ? res.score : null
}

// 获取历史情绪打分
async function getMoodHistory(limit = 30) {
  const res = await callCloud("saveMoodScore", { action: "history", limit })
  return res.data || []
}

// 检查音频是否已收藏
async function checkAudioFavorite(audioId) {
  return await callCloud("manageAudioFavorite", { action: "check", audioId })
}

// 添加音频收藏
async function addAudioFavorite(audio) {
  return await callCloud("manageAudioFavorite", {
    action: "add",
    audioId: audio.id,
    audioTitle: audio.title,
    category: audio.category,
    categoryName: audio.categoryName,
    duration: audio.duration,
    url: audio.url
  })
}

// 取消音频收藏
async function removeAudioFavorite(audioId) {
  return await callCloud("manageAudioFavorite", { action: "remove", audioId })
}

// 批量取消音频收藏
async function removeAudioFavoriteBatch(audioIds) {
  return await callCloud("manageAudioFavorite", { action: "removeBatch", audioIds })
}

// 获取音频收藏列表
async function listAudioFavorites() {
  const res = await callCloud("manageAudioFavorite", { action: "list" })
  return res.data || []
}

module.exports = {
  getHealingQuote,
  getGuidance,
  getAudios,
  saveMoodScore,
  getMoodScore,
  getMoodHistory,
  checkAudioFavorite,
  addAudioFavorite,
  removeAudioFavorite,
  removeAudioFavoriteBatch,
  listAudioFavorites
}
