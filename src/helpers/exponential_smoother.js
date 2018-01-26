import { mean, deviation } from 'd3'

const ALPHA = 0.01
const ALPHAcutoff = Math.round(Math.log(0.01)/(Math.log(1-ALPHA)))
const expDen = [1]
const expVals = [1]
for (let i=1;i<=ALPHAcutoff;i++) {
  const newWeight = expVals[i-1]*(1-ALPHA)
  expVals.push(newWeight)
  expDen.push(expDen[i-1]+newWeight)
}

export function exponentialSmoothing(timedData) {
  const nTime = timedData.length
  timedData.sort((x,y) => x[0] < y[0] ? -1 : 1)
  if (nTime>500) {
    let minTime = timedData[0][0]
    let maxTime = timedData[nTime-1][0]
    let inc = (maxTime-minTime)/500
    const newData = []
    let bin = minTime + inc
    let count = 0
    let wins = 0
    let totalMSL = 0
    for (let t=0;t<nTime;t++) {
      const [ time, won ] = timedData[t]
      while (time > bin) {
        bin += inc
        if (count !== 0) {
          newData.push([totalMSL/count,wins/count])
          count = 0
          wins = 0
          totalMSL = 0
        }
        wins += won
        count += 1
        totalMSL += time
      }
    }
    if (count > 0) {
      newData.push([totalMSL/count,wins/count])
    }
    timedData = newData
  }
  // timed data should be [date,value]. needs to be time sorted first
  var timedPoints = []
  const ys = []
  for (var x=1;x<timedData.length;x++) {
    let num = timedData[x][1]
    const den = expDen[Math.min(ALPHAcutoff,x)]
    let exp = 1
    for (var y=x-1;y>-1;y--) {
      num += timedData[y][1]*expVals[exp] // (1-A)**exp
      exp += 1
      if (exp >= ALPHAcutoff) {
        break
      }
    }
    if (x===1) {
      continue
    }
    timedPoints.push([timedData[x][0],num/den])
    ys.push(num/den)
  }
  let mu = mean(ys)
  let sigma = deviation(ys)
  let newTimedPoints = []
  let nP = timedPoints.length
  for (let t=0;t<nP;t++) {
    if (Math.abs(timedPoints[t][1] - mu) < 2*sigma) {
      newTimedPoints.push(timedPoints[t])
    }
  }
  return newTimedPoints

}