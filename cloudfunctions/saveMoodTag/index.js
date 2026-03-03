const cloud = require("wx-server-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const dateKey = String(event.dateKey || "").trim()
  const tag = String(event.tag || "").trim()
  if (!dateKey || !tag) return { ok: false }

  const { OPENID } = cloud.getWXContext()
  const openid = OPENID
  const col = db.collection("moods")
  const existing = await col.where({ _openid: openid, dateKey }).limit(1).get()
  const updatedAt = Date.now()
  if (existing.data && existing.data[0]) {
    await col.doc(existing.data[0]._id).update({ data: { tag, updatedAt } })
    return { ok: true, updated: true }
  }
  await col.add({ data: { dateKey, tag, createdAt: updatedAt, updatedAt } })
  return { ok: true, created: true }
}

