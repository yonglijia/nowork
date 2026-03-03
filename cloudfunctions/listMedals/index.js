const cloud = require("wx-server-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async () => {
  const { OPENID } = cloud.getWXContext()
  const res = await db
    .collection("medals")
    .where({ _openid: OPENID })
    .orderBy("unlockedAt", "desc")
    .get()

  const items = (res.data || []).map((m) => ({
    key: m.key,
    name: m.name,
    desc: m.desc,
    unlockedAt: m.unlockedAt
  }))
  return { items }
}

