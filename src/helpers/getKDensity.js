export default function getKDensity(k, bins, values) {
  const nBins = bins.length
  const nVals = values.length
  let buf, error, kDensities
  try {
    buf = window.Module._malloc((nBins+nVals+1)*4,4)
    let data = [].concat(k,bins,values)
    data = new Float32Array(data)
    window.Module.HEAPF32.set(data,buf >> 2)
    const replaysPointer = window.Module._getKernelDensity(buf, nBins, nVals)
    let o = replaysPointer/4
    kDensities = window.Module.HEAPF32.slice(o,o+nBins)
  } catch (e) {
    error = e
  } finally {
    window.Module._free(buf)
  }
  if (error) throw error
  // window.Module._free((nBins+nVals+1)*4)
  return kDensities
}