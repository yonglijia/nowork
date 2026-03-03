const defaultConfig = require("./defaultVentConfig")

function canUseCloud() {
  return !!(wx.cloud && wx.cloud.callFunction)
}

async function getVentConfig() {
  try {
    if (!canUseCloud()) return defaultConfig
    const res = await wx.cloud.callFunction({ name: "getVentConfig" })
    if (res && res.result && res.result.config) return res.result.config
    return defaultConfig
  } catch (e) {
    return defaultConfig
  }
}

async function listVentPosts({ limit = 30 } = {}) {
  if (!canUseCloud()) return []
  const res = await wx.cloud.callFunction({
    name: "listVentPosts",
    data: { limit }
  })
  return (res && res.result && res.result.items) || []
}

async function addVentPost({ text }) {
  if (!canUseCloud()) {
    const err = new Error("cloud_not_enabled")
    err.code = "cloud_not_enabled"
    throw err
  }
  const res = await wx.cloud.callFunction({
    name: "addVentPost",
    data: { text }
  })
  return res && res.result
}

async function saveMoodTag({ dateKey, tag }) {
  if (!canUseCloud()) return { ok: false, skipped: true }
  const res = await wx.cloud.callFunction({
    name: "saveMoodTag",
    data: { dateKey, tag }
  })
  return res && res.result
}

module.exports = {
  getVentConfig,
  listVentPosts,
  addVentPost,
  saveMoodTag
}

