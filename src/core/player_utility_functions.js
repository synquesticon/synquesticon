import * as dbObjects from './db_objects'

export function getCurrentTime() {
  return new Date().getTime()
}

export function getFormattedCurrentTime() {
  return new Date().toUTCString()
}

export function getFormattedTime(dt) {
  const date = new Date(dt)
  const minutes = "0" + date.getMinutes()
  const seconds = "0" + date.getSeconds()
  return date.getHours() + ':' + minutes.substr(-2) + ':' + seconds.substr(-2) + '.' + date.getMilliseconds()
}

export function getDeviceName() {
  return window.localStorage.getItem('deviceID')
}

export function pointIsInPoly(p, polygon) {
  let isInside = false
  let minX = polygon[0][0], maxX = polygon[0][0]
  let minY = polygon[0][1], maxY = polygon[0][1]
  polygon.forEach(q => {
    minX = Math.min(q[0], minX)
    maxX = Math.max(q[0], maxX)
    minY = Math.min(q[1], minY)
    maxY = Math.max(q[1], maxY)
  })

  if (p[0] < minX || p[0] > maxX || p[1] < minY || p[1] > maxY) return false

  //copyright: https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html
  var i = 0, j = polygon.length - 1
  for (i, j; i < polygon.length; j = i++) {
    if ((polygon[i][1] > p[1]) !== (polygon[j][1] > p[1]) &&
      p[0] < (polygon[j][0] - polygon[i][0]) * (p[1] - polygon[i][1]) / (polygon[j][1] - polygon[i][1]) + polygon[i][0]) {
      isInside = !isInside
    }
  }
  return isInside
}

export function getAllImagePaths(taskList) {
  console.log("tasklist " + taskList)
  return getImagePath(taskList, [])
}

function getImagePath(dataList, imageFiles) {
  console.log("DataList " + dataList)
  dataList.forEach(function (data) {
    if (data.taskType === dbObjects.ObjectTypes.SET) 
      getImagePath(data.data, imageFiles)
    else if (data.taskType === "Image")
      imageFiles.push("/Images/" + data.image)
    else if (data.taskType === "Comparison") {
      data.subTasks.forEach(function (subTask) {
        if (subTask.subType === "Image")
          imageFiles.push("/Images/" + subTask.image)
      })
    }
  })
  return imageFiles
}

export function stringifyMessage(store, task, lineOfData, eventType, progressCount, taskIndex) {
  try {
    if (store.getState().experimentInfo.participantId === undefined) return null
    return JSON.stringify({
      eventType: eventType,
      participantId: store.getState().experimentInfo.participantId,
      participantLabel: store.getState().experimentInfo.participantLabel,
      startTimestamp: store.getState().experimentInfo.startTimestamp,
      selectedTracker: store.getState().experimentInfo.selectedTracker,
      task: task,
      lineOfData: lineOfData,
      taskSetCount: store.getState().experimentInfo.taskSetCount,
      progressCount: progressCount,
      taskIndex: taskIndex
    })
  } catch (err) {return null}
}