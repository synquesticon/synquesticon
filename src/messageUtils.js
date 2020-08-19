import { SESSION_START, SESSION_END, BUTTON_CLICK } from './SynquesticonStateConstants';
import * as playerUtils from './core/player_utility_functions';
import store from "./core/store";


const loggingUtils = (eventType, args) => {    
    let loggingObject = null;
    let participantId = null;
    let mainTaskSetName = null;
    switch (eventType) {
        case SESSION_START:
            participantId = store.getState().experimentInfo.participantId;
            mainTaskSetName = store.getState().experimentInfo.mainTaskSetId;

            loggingObject = {
                eventType: SESSION_START,
                participantId: participantId,
                participantLabel: playerUtils.getDeviceName(),
                sessionName: mainTaskSetName,
                sessionStartTime: playerUtils.getFormattedCurrentTime(),
                isPaused: args.isPaused                
            }
            console.log('Message utils session start', loggingObject)
            break;
        
        case SESSION_END:
            participantId = store.getState().experimentInfo.participantId;
            mainTaskSetName = store.getState().experimentInfo.mainTaskSetId;
            loggingObject = {
                eventType: SESSION_END,
                participantId: participantId,
                sessionName: mainTaskSetName,
            }
            break;

        
        case BUTTON_CLICK:
            participantId = store.getState().experimentInfo.participantId;
            loggingObject = {
                eventType: BUTTON_CLICK,
                participantId: participantId,
                clickedContent: args.content,
                timeClicked: playerUtils.getFormattedCurrentTime()
            }
            break;
        

        default:
            break;
    }

    return JSON.stringify(loggingObject);
}

export default loggingUtils