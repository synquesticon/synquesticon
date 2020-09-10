import store from "./core/store"

const makeLogObject = (task = null, component = null, event = null) => {
    const session = {
        uid: store.getState().experimentInfo.participantId,
        name: store.getState().experimentInfo.mainTaskSetId,
        startTime: store.getState().experimentInfo.startTimestamp
    }

    const screen = {
        id: store.getState().screenID,
        uuid: store.getState().screen_uuid
    }

    const user = {
        name: window.localStorage.getItem("deviceID")
    }

    const set = {
        uid: store.getState().experimentInfo.taskSet._id,
        familyTree: null,
        tags: store.getState().experimentInfo.taskSet.tags
    }

    return JSON.stringify({ session, screen, user, set, task, component, event })
}

export default makeLogObject