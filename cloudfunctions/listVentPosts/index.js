const cloud = require("wx-server-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const limit = Math.min(50, Math.max(1, parseInt(event.limit || 30, 10) || 30))
  const res = await db
    .collection("vent_posts")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get()
  const items = (res.data || []).map((it) => ({
    _id: it._id,
    text: it.text,
    createdAt: it.createdAt
  }))
  return { items }
}

