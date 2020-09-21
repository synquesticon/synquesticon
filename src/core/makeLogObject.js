import store from "./store"
import uuid from 'react-uuid'

const makeLogObject = (props = null, data = null, componentType = null) => {
    const logObj = {
        session: {
            uid: store.getState().experimentInfo.participantId,
            name: store.getState().experimentInfo.mainTaskSetId,
            startTime: store.getState().experimentInfo.startTimestamp
        },
        user: {
            name: window.localStorage.getItem("deviceID")
        },
        screen: {
            id: store.getState().screenID,
            uuid: store.getState().screen_uuid
        },
        set: {
            uid: store.getState().experimentInfo.taskSet._id,
            familyTree: null,
            tags: store.getState().experimentInfo.taskSet.tags
        },
        task: {
            uid: props.taskID,
            name: props.parentSet,
            tags: props.tags
        },
        component: {
            type: componentType, 
            text: props.displayText,
            correctResponses: props.correctResponses,
            responseOptions: props.task.responses
        },
        event: {
            eventTime: Date.now(),
            eventType: data.eventType,
            uid: uuid(),
            data: data
        },
        observerMessage: data.observerMessage 
    }

    return logObj
    }

    export default makeLogObject