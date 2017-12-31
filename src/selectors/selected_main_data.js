import { createSelector } from 'reselect'
import _ from 'lodash'
import asleep from '../helpers/asleep'

const mainDataSelector = state => state.main
const categoriesSelector = state => state.statCat
const selectedHeroesSelector = state => state.selectedHeroes
const mainOrderSelector = state => state.mainOrder
const DEFAULT_N_HEROES = 75

const getMainData = (main, statCat, selectedHeroes, order) => {
  // This also receives the right data
  console.log('entered get main data')
  const statCatStats = statCat.stats
  let heroes = _.values(selectedHeroes)
  let nHeroes
  if (heroes[0] === 'l') {
    nHeroes = DEFAULT_N_HEROES
    heroes = []
    for (let h = 0; h < nHeroes; h++) {
      heroes.push({name: '', id: h})
    }
  } else {
    nHeroes = heroes.length
  }
  const gotAll = Object.keys(main).length > 0 && heroes !== 'loading' && heroes[0].id !== 666

  let visibleCount = 0
  if (gotAll) {
    const newHeroes = []
    for (let h = 0; h < nHeroes; h++) {
      const heroID = heroes[h].id
      if (!main.hasOwnProperty(heroID)) {
        continue
      }
      const heroDic = heroes[h]
      if (!heroDic.hasOwnProperty('visible')) {
        heroDic.visible = true
      }
      if (heroDic.visible) {
        visibleCount += 1
      }
      heroDic.stats = []
      for (let s = 0;s<statCatStats.length;s++) {
        const stat = statCatStats[s]
        const value = main[heroID][stat]
        heroDic.stats.push(value)
        heroDic[stat] = value.value
      }

      // THIS IS MY HACKY SOLUTION TO NOT BEING ABLE TO RECONCILE THE UPDATE TIMES OF GET MAIN DATA AND GET HOTS DATA
      heroDic.prefsID = main[heroID].prefsID
      heroDic.name = main[heroID].name
      heroDic.color = main[heroID].color
      newHeroes.push(heroDic)
    }
    heroes = newHeroes
    nHeroes = heroes.length
  }
  if (order.id==='names') {
    heroes.sort((a,b) => a.name < b.name ? -1 : 1)
    if (!order.desc) {
      heroes.reverse()
    }
  } else {
    heroes.sort((a,b) => a[order.id] < b[order.id] ? -1 : 1)
    if (order.desc) {
      heroes.reverse()
    }
  }
  /*
  while (!window.hasOwnProperty('HOTS')) {
    console.log('sleeping...')
    await asleep(50)
  } */

  if (visibleCount === 0) {
    heroes.push({name: 'Mr. Bigglesworth', id: 666, visible:true})
  }
  const selectedStuff = {rows: heroes, headers: statCat.headers, cat:statCat.cat, order}
  return selectedStuff
}

export default createSelector(
  mainDataSelector,
  categoriesSelector,
  selectedHeroesSelector,
  mainOrderSelector,
  getMainData
)
