function canUseCloud() {
  return !!(wx.cloud && wx.cloud.callFunction)
}

async function upsertEffort({ dateKey, workHours, overtimeHours, tasksDone, extras }) {
  if (!canUseCloud()) {
    const err = new Error("cloud_not_enabled")
    err.code = "cloud_not_enabled"
    throw err
  }
  const res = await wx.cloud.callFunction({
    name: "upsertEffort",
    data: { dateKey, workHours, overtimeHours, tasksDone, extras }
  })
  return (res && res.result) || null
}

async function getEffort({ dateKey }) {
  if (!canUseCloud()) return null
  const res = await wx.cloud.callFunction({
    name: "getEffort",
    data: { dateKey }
  })
  return (res && res.result && res.result.item) || null
}

async function listEffortMonth({ monthKey }) {
  if (!canUseCloud()) return { dates: [], items: [] }
  const res = await wx.cloud.callFunction({
    name: "listEffortMonth",
    data: { monthKey }
  })
  return (res && res.result) || { dates: [], items: [] }
}

async function getReports() {
  if (!canUseCloud()) return null
  const res = await wx.cloud.callFunction({ name: "getReports" })
  return (res && res.result) || null
}

async function listMedals() {
  if (!canUseCloud()) return []
  const res = await wx.cloud.callFunction({ name: "listMedals" })
  return (res && res.result && res.result.items) || []
}

module.exports = {
  upsertEffort,
  getEffort,
  listEffortMonth,
  getReports,
  listMedals
}

