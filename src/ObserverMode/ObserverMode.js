import React, { useState, useEffect } from 'react'

import Button from '@material-ui/core/Button'
import PauseIcon from '@material-ui/icons/PauseCircleOutline'
import PlayIcon from '@material-ui/icons/PlayCircleOutline'


import * as constants from '../SynquesticonStateConstants'
import { withTheme } from '@material-ui/styles'

import mqtt from '../core/mqtt'
import eventStore from '../core/eventStore'
import store from '../core/store'
import ObserverTab from './ObserverMessages/ObserverTab'
import MessageBoard from './ObserverMessages/MessageBoard'


import './ObserverMode.css'
import { MqttClient } from 'mqtt'

const observerMode = (props) => {
    const [participants, setParticipants] = useState([])
    const [currentParticipant, setCurrentParticipant] = useState(0)
    const [allPaused, setAllPaused] = useState(false)
    
    const completedTasks = {};
    const totalTasks = {};

  useEffect(() => {
    eventStore.addEventListener(onNewEvent);

    return () => {
      eventStore.removeEventListener(onNewEvent);
    }

  }, []);

  
  const onPausePlayPressed = () => {
    mqtt.broadcastCommands(JSON.stringify({
                            commandType: allPaused ? "PAUSE" : "RESUME",
                            participantId: -1
                           }));

    setAllPaused(prevAllPaused => !prevAllPaused);
  }


  const onNewEvent = () => {
    const  mqttMessage = JSON.parse(eventStore.getCurrentMessage());
    console.log('Received event', mqttMessage)

    const checkExistedParticipant = participants.filter(participant => participant.participantId === mqttMessage.participantId)
    
    if (checkExistedParticipant.length !== 1) { //there must be no existing participant
      const newParticipant = {
        participantId: mqttMessage.participantId,
        participantLabel: mqttMessage.participantLabel,
        sessionStartTime: mqttMessage.sessionStartTime,
        isPaused: mqttMessage.isPaused,
        messagesQueue: [mqttMessage]
      }
      participants.push(newParticipant);
      const updatedParticipants = participants.slice();
      setParticipants(updatedParticipants);
    } else {
      console.log('There is at least one existed participant', checkExistedParticipant)
      const updatedParticipants = participants.slice()
      const participant = participants.find(participant => participant.participantId === mqttMessage.participantId)
      participant.messagesQueue.push(mqttMessage)
      setParticipants(updatedParticipants)

    }  

  }
const onClickedTab = (newValue) => {
   setCurrentParticipant(newValue)
}

const getPlayPauseButton = () => {
    let buttonIcon = null;
    let buttonLabel = "";
    if(allPaused){
      buttonIcon = <PauseIcon fontSize="large" />;
      buttonLabel = "Pause all participants";
    }
    else{
      buttonIcon = <PlayIcon fontSize="large" />;
      buttonLabel = "Resume all participants";
    }

    let playPauseButton = <Button style={{display:'flex', position: 'relative', width: '100%', height: '55px',
            borderRadius:10, borderColor:'#BDBDBD', borderWidth:'thin', borderRightStyle:'solid'}}
            onClick={onPausePlayPressed}>
      {buttonLabel}
      {buttonIcon}
    </Button>

    return playPauseButton;
  }

    let theme = props.theme;
    let observerBgColor = theme.palette.type === "light" ? theme.palette.primary.main : theme.palette.primary.dark;

    


    const playPauseButton = getPlayPauseButton()
    
    let messagesQueue = []
    if (participants.length > 0){
      messagesQueue = participants[currentParticipant].messagesQueue
    }
    

    return (
      <div className="ObserverViewerContent" style={{backgroundColor:observerBgColor}}>
        <div className="ObserverHeader">
          <div className="ObserverPlayPauseContainer">
            {playPauseButton}
          </div>
          <div className="ObserverTabsWrapper">
            <div className={"ObserverTabContainer"}>
              {
                participants.map((mqttMessage, index) => {
                  return <ObserverTab 
                  key={index} 
                  index={index}
                  participantObject={mqttMessage}
                  tabPressedCallback={onClickedTab} 
                  allPaused={allPaused}
                  />
                })
              }
            </div>
          </div>
        </div>
        <div className="ObserverMessageLog">
          <MessageBoard messages={messagesQueue}/>
        </div>
      </div>
      );
}

export default withTheme(observerMode);