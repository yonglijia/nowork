const cloud = require("wx-server-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

function dateKeyOf(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function fmtRange(a, b) {
  const ma = a.slice(5).replace("-", ".")
  const mb = b.slice(5).replace("-", ".")
  return `${ma}-${mb}`
}

function monthRangeOf(now) {
  const y = now.getFullYear()
  const m = now.getMonth() + 1
  const start = `${y}-${String(m).padStart(2, "0")}-01`
  const next = new Date(y, m, 1)
  const end = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`
  return { start, end }
}

function weekRangeOf(now) {
  const d = new Date(now)
  const day = (d.getDay() + 6) % 7 // monday=0
  d.setDate(d.getDate() - day)
  const start = dateKeyOf(d)
  const e = new Date(d)
  e.setDate(e.getDate() + 7)
  const end = dateKeyOf(e)
  return { start, end }
}

function sumStats(items) {
  return (items || []).reduce(
    (acc, it) => {
      acc.workHours += parseInt(it.workHours || 0, 10) || 0
      acc.overtimeHours += parseInt(it.overtimeHours || 0, 10) || 0
      acc.tasksDone += parseInt(it.tasksDone || 0, 10) || 0
      return acc
    },
    { workHours: 0, overtimeHours: 0, tasksDone: 0 }
  )
}

exports.main = async () => {
  const { OPENID } = cloud.getWXContext()
  const now = new Date()

  const week = weekRangeOf(now)
  const month = monthRangeOf(now)

  const weekRes = await db
    .collection("efforts")
    .where({ _openid: OPENID, dateKey: _.gte(week.start).and(_.lt(week.end)) })
    .get()
  const monthRes = await db
    .collection("efforts")
    .where({ _openid: OPENID, dateKey: _.gte(month.start).and(_.lt(month.end)) })
    .get()

  const weekStats = sumStats(weekRes.data || [])
  const monthStats = sumStats(monthRes.data || [])

  // for display, week end is inclusive (end-1 day)
  const weekEndIncl = dateKeyOf(new Date(new Date(week.end).getTime() - 24 * 3600 * 1000))
  const monthText = `${month.start.slice(0, 4)}.${month.start.slice(5, 7)}`

  return {
    week: {
      rangeText: fmtRange(week.start, weekEndIncl),
      ...weekStats
    },
    month: {
      rangeText: monthText,
      ...monthStats
    }
  }
}

