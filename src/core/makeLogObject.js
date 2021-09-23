import store from "./store"
import uuid from "react-uuid"

const makeLogObject = (props = null, data = null, componentType = null) => {
  const logObj = {}
  logObj.session = {
    uid: store.getState().experimentInfo.participantId,
    name: store.getState().experimentInfo.mainTaskSetId,
    startTime: store.getState().experimentInfo.startTimestamp,
  }
  logObj.user = {
    name: window.localStorage.getItem("deviceID"),
  }
  logObj.screen = {
    id: store.getState().screenID,
    uuid: store.getState().screen_uuid,
  }
  logObj.set = {
    uid: store.getState().experimentInfo.taskSet._id,
    familyTree: null,
    tags: store.getState().experimentInfo.taskSet.tags,
  }
  logObj.task = {
    uid: props.taskID,
    name: props.parentSet,
    tags: props.tags,
  }
  logObj.component = {
    type: componentType,
    text: props.displayText,
    correctResponses: props.correctResponses,
    responseOptions: props.task.responses,
  }

  logObj.event = {
    eventTime: Date.now(),
    eventType: data.eventType,
    uid: uuid(),
    data: data,
  }
  logObj.observerMessage = data.observerMessage

  if (componentType === "Video") {
    logObj.component = {
      type: componentType,
      text: props.task.video,
      responseOptions: props.task.aois,
    }
  }

  return logObj
}

export default makeLogObject
