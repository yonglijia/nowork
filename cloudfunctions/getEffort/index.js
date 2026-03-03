const cloud = require("wx-server-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const dateKey = String(event.dateKey || "").trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return { item: null }

  const res = await db
    .collection("efforts")
    .where({ _openid: OPENID, dateKey })
    .limit(1)
    .get()

  const it = res.data && res.data[0]
  if (!it) return { item: null }
  return {
    item: {
      _id: it._id,
      dateKey: it.dateKey,
      workHours: it.workHours,
      overtimeHours: it.overtimeHours,
      tasksDone: it.tasksDone,
      extras: it.extras || [],
      createdAt: it.createdAt,
      updatedAt: it.updatedAt
    }
  }
}

