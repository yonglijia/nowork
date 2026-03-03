const cloud = require("wx-server-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

function monthToRange(monthKey) {
  const [y, m] = String(monthKey || "").split("-").map((x) => parseInt(x, 10))
  if (!y || !m) return null
  const start = `${y}-${String(m).padStart(2, "0")}-01`
  const next = new Date(y, m, 1)
  const ny = next.getFullYear()
  const nm = String(next.getMonth() + 1).padStart(2, "0")
  const end = `${ny}-${nm}-01`
  return { start, end }
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const monthKey = String(event.monthKey || "").trim()
  const range = monthToRange(monthKey)
  if (!range) return { dates: [], items: [] }

  const res = await db
    .collection("efforts")
    .where({ _openid: OPENID, dateKey: _.gte(range.start).and(_.lt(range.end)) })
    .get()

  const dates = Array.from(new Set((res.data || []).map((it) => it.dateKey))).sort()
  return { dates }
}

