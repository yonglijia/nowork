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

// 获取话术列表
async function getRefusalScripts(options = {}) {
  const { category, keyword } = options
  const data = await callCloud("getRefusalScripts", { category, keyword })
  return data.data || []
}

// 检查是否已收藏
async function checkFavorite(scriptId) {
  return await callCloud("manageFavoriteScript", { 
    action: "check", 
    scriptId 
  })
}

// 添加收藏
async function addFavorite(scriptId, scriptText, category, categoryName) {
  return await callCloud("manageFavoriteScript", { 
    action: "add", 
    scriptId, 
    scriptText, 
    category, 
    categoryName 
  })
}

// 取消收藏
async function removeFavorite(scriptId) {
  return await callCloud("manageFavoriteScript", { 
    action: "remove", 
    scriptId 
  })
}

// 批量取消收藏
async function removeFavoriteBatch(scriptIds) {
  return await callCloud("manageFavoriteScript", { 
    action: "removeBatch", 
    scriptIds 
  })
}

// 获取收藏列表
async function listFavorites() {
  const res = await callCloud("manageFavoriteScript", { action: "list" })
  return res.data || []
}

// 获取今日最重要事项
async function getTopTask(dateKey) {
  const res = await callCloud("manageTopTask", { 
    action: "get", 
    dateKey 
  })
  return res.item || null
}

// 设置今日最重要事项
async function setTopTask(text) {
  return await callCloud("manageTopTask", { 
    action: "set", 
    text 
  })
}

// 删除今日最重要事项
async function deleteTopTask() {
  return await callCloud("manageTopTask", { action: "delete" })
}

module.exports = {
  getRefusalScripts,
  checkFavorite,
  addFavorite,
  removeFavorite,
  removeFavoriteBatch,
  listFavorites,
  getTopTask,
  setTopTask,
  deleteTopTask
}
