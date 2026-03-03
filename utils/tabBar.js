function setTabBarIndex(index) {
  if (typeof index !== "number") return
  const tabBar = getApp().globalData.tabBar
  if (tabBar && tabBar.setData) {
    tabBar.setData({ selected: index })
  }
}

module.exports = {
  setTabBarIndex
}

