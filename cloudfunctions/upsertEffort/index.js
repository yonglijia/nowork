const cloud = require("wx-server-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

const MEDALS = {
  workaholic: {
    key: "workaholic",
    name: "嘴硬心软劳模",
    desc: "连续7天记录实干，且每日工作时长≥8小时"
  },
  monthOvertime: {
    key: "monthOvertime",
    name: "当代优秀扛事人",
    desc: "单月加班时长≥30小时"
  },
  familyHero: {
    key: "familyHero",
    name: "家庭&职场双扛选手",
    desc: "连续5天记录“顾家/带娃”+每日工作时长≥6小时"
  },
  emotionMaster: {
    key: "emotionMaster",
    name: "情绪稳定大师",
    desc: "连续7天情绪标签未选“炸”，且每日记录“忍了情绪”"
  }
}

function clampInt(v, min, max, fallback) {
  const n = parseInt(v, 10)
  if (Number.isNaN(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

function isValidDateKey(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""))
}

function addDays(dateKey, delta) {
  const [y, m, d] = dateKey.split("-").map((x) => parseInt(x, 10))
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + delta)
  const yy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, "0")
  const dd = String(dt.getDate()).padStart(2, "0")
  return `${yy}-${mm}-${dd}`
}

function monthRange(dateKey) {
  const [y, m] = dateKey.split("-").slice(0, 2).map((x) => parseInt(x, 10))
  const start = `${y}-${String(m).padStart(2, "0")}-01`
  const next = new Date(y, m, 1)
  const ny = next.getFullYear()
  const nm = String(next.getMonth() + 1).padStart(2, "0")
  const end = `${ny}-${nm}-01`
  return { start, end }
}

async function upsertEffort(openid, payload) {
  const col = db.collection("efforts")
  const existing = await col.where({ _openid: openid, dateKey: payload.dateKey }).limit(1).get()
  const now = Date.now()
  if (existing.data && existing.data[0]) {
    const id = existing.data[0]._id
    await col.doc(id).update({
      data: {
        ...payload,
        updatedAt: now
      }
    })
    const updated = await col.doc(id).get()
    return updated.data
  }
  const res = await col.add({
    data: {
      ...payload,
      createdAt: now,
      updatedAt: now
    }
  })
  const created = await col.doc(res._id).get()
  return created.data
}

async function getExistingMedalKeys(openid) {
  const res = await db.collection("medals").where({ _openid: openid }).get()
  return new Set((res.data || []).map((m) => m.key))
}

async function grantMedal(openid, medal) {
  const now = Date.now()
  await db.collection("medals").add({
    data: {
      key: medal.key,
      name: medal.name,
      desc: medal.desc,
      unlockedAt: now
    }
  })
  return { key: medal.key, name: medal.name, desc: medal.desc, unlockedAt: now }
}

async function evalWorkaholic(openid, dateKey) {
  const keys = Array.from({ length: 7 }).map((_, i) => addDays(dateKey, -6 + i))
  const res = await db
    .collection("efforts")
    .where({ _openid: openid, dateKey: _.in(keys) })
    .get()
  const map = new Map((res.data || []).map((it) => [it.dateKey, it]))
  if (keys.some((k) => !map.has(k))) return false
  return keys.every((k) => (map.get(k).workHours || 0) >= 8)
}

async function evalFamilyHero(openid, dateKey) {
  const keys = Array.from({ length: 5 }).map((_, i) => addDays(dateKey, -4 + i))
  const res = await db
    .collection("efforts")
    .where({ _openid: openid, dateKey: _.in(keys) })
    .get()
  const map = new Map((res.data || []).map((it) => [it.dateKey, it]))
  if (keys.some((k) => !map.has(k))) return false
  return keys.every((k) => {
    const it = map.get(k)
    const extras = it.extras || []
    return (it.workHours || 0) >= 6 && Array.isArray(extras) && extras.includes("顾家/带娃")
  })
}

async function evalMonthOvertime(openid, dateKey) {
  const { start, end } = monthRange(dateKey)
  const res = await db
    .collection("efforts")
    .where({ _openid: openid, dateKey: _.gte(start).and(_.lt(end)) })
    .get()
  const sum = (res.data || []).reduce((acc, it) => acc + (parseInt(it.overtimeHours || 0, 10) || 0), 0)
  return sum >= 30
}

async function evalEmotionMaster(openid, dateKey) {
  const keys = Array.from({ length: 7 }).map((_, i) => addDays(dateKey, -6 + i))

  const effortRes = await db
    .collection("efforts")
    .where({ _openid: openid, dateKey: _.in(keys) })
    .get()
  const effortMap = new Map((effortRes.data || []).map((it) => [it.dateKey, it]))
  if (keys.some((k) => !effortMap.has(k))) return false

  const moodRes = await db
    .collection("moods")
    .where({ _openid: openid, dateKey: _.in(keys) })
    .get()
  const moodMap = new Map((moodRes.data || []).map((it) => [it.dateKey, it.tag]))
  if (keys.some((k) => !moodMap.has(k))) return false

  return keys.every((k) => {
    const mood = moodMap.get(k)
    const it = effortMap.get(k)
    const extras = it.extras || []
    return mood !== "炸" && Array.isArray(extras) && extras.includes("忍了情绪")
  })
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const openid = OPENID

  const dateKey = String(event.dateKey || "").trim()
  if (!isValidDateKey(dateKey)) return { ok: false, error: "bad_date" }

  const payload = {
    dateKey,
    workHours: clampInt(event.workHours, 1, 12, 8),
    overtimeHours: clampInt(event.overtimeHours, 0, 8, 0),
    tasksDone: clampInt(event.tasksDone, 1, 10, 3),
    extras: Array.isArray(event.extras) ? event.extras.slice(0, 6) : []
  }

  const effort = await upsertEffort(openid, payload)

  const existingKeys = await getExistingMedalKeys(openid)
  const unlockedMedals = []

  if (!existingKeys.has(MEDALS.workaholic.key)) {
    if (await evalWorkaholic(openid, dateKey)) {
      unlockedMedals.push(await grantMedal(openid, MEDALS.workaholic))
    }
  }

  if (!existingKeys.has(MEDALS.monthOvertime.key)) {
    if (await evalMonthOvertime(openid, dateKey)) {
      unlockedMedals.push(await grantMedal(openid, MEDALS.monthOvertime))
    }
  }

  if (!existingKeys.has(MEDALS.familyHero.key)) {
    if (await evalFamilyHero(openid, dateKey)) {
      unlockedMedals.push(await grantMedal(openid, MEDALS.familyHero))
    }
  }

  if (!existingKeys.has(MEDALS.emotionMaster.key)) {
    if (await evalEmotionMaster(openid, dateKey)) {
      unlockedMedals.push(await grantMedal(openid, MEDALS.emotionMaster))
    }
  }

  return { ok: true, effort: sanitizeEffort(effort), unlockedMedals }
}

function sanitizeEffort(e) {
  if (!e) return null
  return {
    _id: e._id,
    dateKey: e.dateKey,
    workHours: e.workHours,
    overtimeHours: e.overtimeHours,
    tasksDone: e.tasksDone,
    extras: e.extras || [],
    createdAt: e.createdAt,
    updatedAt: e.updatedAt
  }
}

