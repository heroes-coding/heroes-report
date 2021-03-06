import _ from 'lodash'

const statMults = {0: 1,
  1: 1,
  2: 1,
  3: 470,
  4: 1,
  5: 379,
  6: 1,
  7: 438,
  8: 1,
  9: 772,
  10: 1,
  11: 1,
  12: 1,
  13: 1,
  14: 1,
  15: 1,
  16: 391
}

const replayVals = [
  [['buildIndex',321,1], ['map',35,1], ['Length', 2520, 1], ['hero0',147,1]],
  [['MSL',4860000,1], ['mode',6,1], ['hero1',147,1]],
  [['hero2',147,1],['hero3',147,1],['hero4',147,1], ['hero5',147,1], ['FirstTo10',3,1], ['winners',2,1]],
  [['hero6',147,1],['hero7',147,1],['hero8',147,1], ['hero9',147,1], ['FirstTo20',3,1], ['FirstFort',3,1]],
  // 0
  [['Vengeances',23,1], ['Kills',57,1], ['mapStatID0',40,1], ['talent0',5,1], ['talent1',5,1], ['talent2',4,1], ['talent3',5,1], ['talent4',5,1], ['talent5',5,1], ['talent6',6,1]],
  // 1
  [['Siege Damage',307,1000],['Mercs Captured',34,1],['mapStatID1',40,1], ['Experience',50,1000], ['Assists',99,1]],
  // 2
  [['Root Time', 91,1], ['Dead Time',646,1], ['Self Healing',69,1000], ['Team0End',30,1], ['Team1End',30,1]],
  // 3
  [['Hero Damage',138,1000], ['Structure Damage',92,1000], ['Feeder',2,1], ['Teamfight Damage Taken',123,1000], ['Time on Fire',679,1], ['Big Talker',2,1]],
  // 5
  [['Globes',120,1],['Escapes',27,1], ['Healing',156,1000], ['Silence Time', 94, 1.5], ['Teamfight Hero Damage',82,1000]],
  // 6
  [['Award',40,1], ['Deaths',40,1], ['mapStatValues1',500,1], ['mapStatValues0',500,1], ['slot', 10, 1]],
  // 7
  [['Crowd Control Time',4950,1],['Stun Time',100,1], ['Protection Given',100,1000], ['Outnumbered Deaths',38,1], ['Pinger',2,1]],
  // 8
  [['Team Merc Captures',85,1], ['Votes Received',11,1],['Minion Damage',251,1000], ['Player Town Kills',6,1], ['Team Town Kills',12,1], ['WetNoodle',2,1], ['DangerousNurse',2,1], ['VotedFor',3,1]]
]

const menuStats = ["Vengeances", "Kills", "Siege Damage", "Mercs Captured", "Experience", "Assists", "Root Time", "Dead Time", "Self Healing", "Hero Damage", "Structure Damage", "Teamfight Damage Taken", "Time on Fire", "Globes", "Escapes", "Healing", "Silence Time", "Teamfight Hero Damage", "Deaths", "Crowd Control Time", "Stun Time", "Protection Given", "Outnumbered Deaths", "Team Merc Captures", "Votes Received", "Minion Damage", "Player Town Kills", "Team Town Kills"]
menuStats.sort((x,y) => x < y ? -1 : 1)

replayVals.map(x => x.reverse()) // returns reversed array but also reverses in place, needed for bit unpacking
// A flat array for C++ of the above
const replayDecoder = replayVals.map(r => r.map(c => c.slice(1,3)).reduce((prev,next) => [].concat(prev,next))).reduce((prev,next) => [].concat(prev,next))
// A count of parts per int for C++
const replayDecoderLengths = replayVals.map(r => r.length)
const indexes = replayVals.map((x,i) => x.map((y,j) => i === 0 ? j :
  replayDecoderLengths.slice(0,i).reduce((y,z) => y+z) + j))
const decoderList = []
replayVals.map((x,i) => x.map((y,j) => { decoderList.push(replayVals[i][j][0]) }))
const decoderDictionary = {
  0: 'Hero0',
  1: 'Hero1',
  2: 'Hero2',
  3: 'Hero3',
  4: 'Hero4',
  5: 'Hero5',
  6: 'Hero6',
  7: 'Hero7',
  8: 'Hero8',
  9: 'Hero9',
  10: 'You',
  11: 'Ally1',
  12: 'Ally2',
  13: 'Ally3',
  14: 'Ally4',
  15: 'Enemy1',
  16: 'Enemy2',
  17: 'Enemy3',
  18: 'Enemy4',
  19: 'Enemy5',
  20: 'AllyWarriors',
  21: 'AllySupports',
  22: 'AllySpecialists',
  23: 'AllyAssassins',
  24: 'EnemyWarriors',
  25: 'EnemySupports',
  26: 'EnemySpecialists',
  27: 'EnemyAssassins',
  28: 'Won',
  29: 'Winners',
  30: 'FirstTo10',
  31: 'FirstTo20',
  32: 'FirstFort',
  33: 'Talent0',
  34: 'Talent1',
  35: 'Talent2',
  36: 'Talent3',
  37: 'Talent4',
  38: 'Talent5',
  39: 'Talent6',
}

const talentSlots = [33,34,35,36,37,38,39]

// nPredefined is determined by the beginning of the decoder dictionary + 1 above!
let slotIndex, winners
const nPredefined = 40
// decoderIndex also serves as the count of things that your C parser will return
let decoderIndex = nPredefined - 1
let firsts = [null,null,null]
let heroIndexes = Array(10).fill(null)
let talentIndexes = Array(7).fill(null)
for (let d=0;d<decoderList.length;d++) {
  let val = decoderList[d]
  let prefix = val.slice(0,4)
  if (prefix==='hero') {
    heroIndexes[parseInt(val[4])] = d
  } else if (prefix==='slot') {
    slotIndex = d
  } else if (prefix==='Firs') {
    if (val==='FirstTo10') {
      firsts[0] = d
    } else if (val==='FirstTo20') {
      firsts[1] = d
    } else if (val==='FirstFort') {
      firsts[2] = d
    }
  } else if (prefix==='tale') {
    talentIndexes[parseInt(val[6])] = d
  } else if (prefix==='winn') {
    winners = d
  } else {
    decoderDictionary[++decoderIndex] = val
  }
}
decoderIndex += 1
window.decoderDic = decoderDictionary
window.nPredefined = nPredefined
const decoderNumbers = {}
Object.keys(decoderDictionary).filter(x => x >= nPredefined).map(x => { decoderNumbers[decoderDictionary[x]]=parseInt(x)-nPredefined })

// This has to match the order of unpacking in the binary unpacker (emscriptten decodeReplays)
window.decoderNumbers = decoderNumbers
const specialLocations = [].concat(replayDecoderLengths,replayDecoder,[slotIndex, winners],firsts,heroIndexes,talentIndexes)
export { replayVals, replayDecoder, indexes, replayDecoderLengths, slotIndex, heroIndexes, decoderDictionary, talentIndexes, firsts, decoderIndex, nPredefined, winners, specialLocations, decoderNumbers, talentSlots, menuStats, statMults }
