const axios = require('axios')
const request = require('request')
const fs = require('fs')
const { asleep } = require('./asleep')
const { ipcMain } = require('electron')
const APIStatus = {failedAttempts: 0, APIFailed: false}
const uploadQueue = []
const { parserPopup, updateParsingMenu } =require('../containers/parsingLogger/parseAndUpdateManager.js')
const { options } = require('../containers/optionsMenu/optionsManager.js')

let xRateLimitRemaining = 300
let currentUploads = 0
let uploading = false

ipcMain.on('option:update',(e,args) => {
  const { key, value } = args
  if (key === 'uploads' && value) resetAPI()
})

const uploadOne = async function(fileToUpload,fileID) {
  try {
    let newAPIID = await postReplay(fileToUpload,fileID)
    console.log('new API ID: ',newAPIID)
  } catch (e) {
    console.log("ERROR CAUGHT?", e, "ERROR CAUGHT?")
  }
}

const uploadLoop = async function() {
  uploading = true
  while (uploadQueue.length) {
    while (currentUploads > options.prefs.simUploads.value) await asleep(100)
    const { fileName, fileID, hash } = uploadQueue.shift()
    let status
    try {
      const exists = await checkAPIHash(hash)
      if (exists) status = 1
      else status = 2
    } catch (e) {
      status = 3
    }
    if (status === 3) {
      uploadQueue.push({ fileName, fileID, hash })
      updateFileStatus(fileID,5)
      continue
    } else if (status === 1) continue
    uploadOne(fileName,fileID)
    if (!APIOkay()) break
  }
  uploading = false
}

const enqueueReplayForUpload = function(fileName,fileID,hash) {
  uploadQueue.push({fileName,fileID,hash})
  if (!options.prefs.uploads.value) {
    APIStatus.APIFailed = true
    return
  }
  if (!uploading && APIOkay()) uploadLoop()
}

const resetAPI = function() {
  APIStatus.APIFailed = false
  if (uploadQueue.length && !uploading) uploadLoop()
}

const APIOkay = function() {
  if (APIStatus.failedAttempts < 3 || !APIStatus.APIFailed) return true
  else if (APIStatus.failedAttempts > 2) {
    APIStatus.failedAttempts = 0
    APIStatus.APIFailed = true
    setTimeout(resetAPI, 60000)
  }
  return false
}

function updateFileStatus(fileID,status) {
  parserPopup.saveInfo.files[fileID].uploaded = status
  updateParsingMenu({[fileID]:parserPopup.saveInfo.files[fileID]})
}

const postReplay = function(filePath,fileID) {
  updateFileStatus(fileID,4)
  // Takes in a file path, posts to HOTSApi, and either rejects with error or resolves with ID
  let promise = new Promise(async function(resolve, reject) {
    if (!APIOkay()) return reject(new Error('API Down'))
    if (xRateLimitRemaining < 100) await asleep(60000)
    currentUploads++
    const req = request.post('http://hotsapi.net/api/v1/replays', function(err, resp, body) {
      currentUploads--
      if (!resp || !resp.headers) {
        APIStatus.failedAttempts += 1
        updateFileStatus(fileID,5)
        return reject(new Error('No response'))
      }
      xRateLimitRemaining = resp.headers['x-ratelimit-remaining']
      if (err) {
        APIStatus.failedAttempts += 1
        updateFileStatus(fileID,5)
        return reject(err)
      } else if (resp.statusCode !== 200) {
        APIStatus.failedAttempts += 1
        updateFileStatus(fileID,5)
        return reject(new Error(resp.statusCode))
      } else {
        console.log(body)
        const { id, status, success } = JSON.parse(body)
        if (status==='Duplicate') updateFileStatus(fileID,2)
        else if (status==="UploadError") updateFileStatus(fileID,5)
        else if (success===true) updateFileStatus(fileID,1)
        else updateFileStatus(fileID,5)
        return resolve(id)
      }
    })
    const form = req.form()
    form.append('file', fs.createReadStream(filePath))
  })
  return promise
}

function checkAPIHash(hash) {
  let promise = new Promise(async function(resolve, reject) {
    if (!APIOkay()) return reject(new Error('API Down'))
    let result
    try {
      result = await axios.get(`http://hotsapi.net/api/v1/replays/fingerprints/v3/${hash}`)
    } catch (e) {
      APIStatus.failedAttempts += 1
      return reject(e)
    }
    if (result.status === 200) resolve(result.data.exists)
    else {
      APIStatus.failedAttempts += 1
      reject(new Error(result.status))
    }
  })
  return promise
}

process.on("massUpload", async uploadInfoQueue => {
  const toCheck = Object.keys(uploadInfoQueue)
  if (toCheck.length===0) return
  for (let k=0;k<toCheck.length;k++) {
    const hash = toCheck[k]
    const {filePath, fileID} = uploadInfoQueue[hash]
    enqueueReplayForUpload(filePath, fileID,hash)
  }
})

function checkAPIHashes(hashList) {
  let promise = new Promise(async function(resolve, reject) {
    if (!APIOkay()) return reject(new Error('API Down'))
    let result
    try {
      result = await axios.post('http://hotsapi.net/api/v1/replays/fingerprints', hashList.join("\n"), {headers: {'Content-Type': 'text/plain'}})
    } catch (e) {
      APIStatus.failedAttempts += 1
      reject(e)
    }
    if (result.status === 200) resolve(result.data)
    else {
      APIStatus.failedAttempts += 1
      reject(new Error(result.status))
    }
  })
  return promise
}

exports.checkAPIHash = checkAPIHash
exports.enqueueReplayForUpload = enqueueReplayForUpload
exports.APIStatus = APIStatus
exports.checkAPIHashes = checkAPIHashes
