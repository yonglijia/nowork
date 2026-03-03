const cloud = require("wx-server-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async () => {
  const col = db.collection("vent_config")
  const byId = await col.doc("default").get().catch(() => null)
  if (byId && byId.data) return { config: byId.data.config || byId.data }
  const first = await col.limit(1).get().catch(() => null)
  const doc = first && first.data && first.data[0]
  return { config: (doc && (doc.config || doc)) || null }
}

