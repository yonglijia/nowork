const cloud = require("wx-server-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const text = String(event.text || "").trim()
  if (!text) return { ok: false, error: "empty" }
  if (text.length > 120) return { ok: false, error: "too_long" }

  const createdAt = Date.now()
  const res = await db.collection("vent_posts").add({
    data: {
      text,
      createdAt
    }
  })
  return { ok: true, _id: res._id, createdAt }
}

