import store from "./core/store";


const loggingUtils = (task = null, component =null, event = null) => {
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

    const globalVariables = {

    }

    const set = {
        uid: store.getState().experimentInfo.taskSet._id,
        familyTree: null,
        tags: store.getState().experimentInfo.taskSet.tags
    }



    const loggingObjects = {
        session,
        screen,
        user,
        // globalVariables,
        set,
        task,
        component,
        event
    }

    return JSON.stringify(loggingObjects);
    
}

export default loggingUtils