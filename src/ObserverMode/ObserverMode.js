import React, { useState, useEffect } from 'react';

import GazeCursor from './GazeCursor';

import Button from '@material-ui/core/Button';
import PauseIcon from '@material-ui/icons/PauseCircleOutline';
import PlayIcon from '@material-ui/icons/PlayCircleOutline';

import { withTheme } from '@material-ui/styles';

import mqtt from '../core/mqtt';
import eventStore from '../core/eventStore';
import store from '../core/store';

import './ObserverMode.css';

const observerMode = (props) => {
    const [participants, setParticipants] = useState([])
    const [currentParticipant, setCurrentParticipant] = useState(-1)
    const [isParticipantsPaused, setIsParticipantsPaused] = useState(false)
    
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
                            commandType: !isParticipantsPaused ? "PAUSE" : "RESUME",
                            participantId: -1
                           }));

    setIsParticipantsPaused(prevIsPaused => !prevIsPaused);
  }

  const isSameIdentifier = (pair, msg) => {
    if(pair.lineOfData){
      return (pair.lineOfData.startTimestamp === msg.lineOfData.startTimestamp
              && pair.lineOfData.taskContent === msg.lineOfData.taskContent);
    }
    else{
      console.log("missing data line", msg);
      return false;
    }
  }

  const pairMessage = (msgArray, msg) => {
    for (let i = 0; i < msgArray.length; i++) {
      let pair = msgArray[i];
      if (msg.eventType === "ANSWERED" || msg.eventType === "SKIPPED") {
        if (pair.length < 2 //if hasn't had matched message
            && isSameIdentifier(pair[0], msg)) { //match id with first message
              //pair them together
              pair.push(msg);
              return msgArray;
        }
      }
      else if (msg.eventType === "RESETANSWER") {
        if (isSameIdentifier(pair[0], msg)) {
          // msg.eventType = "ANSWERED"; //we cheat so we don't have to handle new case
          pair.push(msg);
          return msgArray;
        }
      }
    }
    if (msg.eventType !== "PROGRESSCOUNT") {
      msgArray.push([msg]);
    }

    return msgArray;
  }

  // Called when a new mqtt event has been received
  // Updates the information displayed in the observer
  const onNewEvent = () => {
    let args = JSON.parse(eventStore.getCurrentMessage());

    //set up a new participant
    if (store.getState().participants[args.participantId] === undefined) {
      let action = {
        type: 'ADD_PARTICIPANT',
        participant: args.participantId,
        tracker: args.selectedTracker
      }
      store.dispatch(action);
    }

    if (args.taskSetCount) {
      totalTasks[args.participantId] = args.taskSetCount;
    }
 

    let exists = false;

    let tmpParticipants = [...participants]

    participants.forEach((participant, participantIndex) => {
      if (participant.id === args.participantId) {

        if(args.eventType==="FINISHED" && !participant.hasReceivedFinish){
          
          tmpParticipant[participantIndex].hasReceivedFinish = true

          pairMessage(participant.messages, args);
          exists = true;
        } else if(args.eventType!=="FINISHED"){
          pairMessage(participant.messages, args);
          exists = true;
          break;
        } else{
          //The id did exist so we do not want to create a new participant
          exists = true;
          break;
        }
      }
    })

    setParticipants(tmpParticipants)
    
    //If the participant id did not exist we create a new participant
    if (!exists) {
      let label = (!args.participantLabel || args.participantLabel === "") ? "" : args.participantLabel;
      
      const tmpParticipants = participants.concat({
        id: args.participantId,
        name: label,
        timestamp: args.startTimestamp,
        tracker: args.selectedTracker,
        messages: [[args]]
      });

      setIsParticipantsPaused(tmpParticipants);

      return {
        participants,
      };

    }

    if (currentParticipant < 0) {
      setCurrentParticipant(0);
    }
    // this.forceUpdate();
  }

const onClickedTab = (newValue) => {
   setCurrentParticipant(newValue)
}

const getPlayPauseButton = () => {
    let buttonIcon = null;
    let buttonLabel = "";
    if(!isParticipantsPaused){
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

    let messages = [];
    if (currentParticipant >= 0) {
      messages = participants[currentParticipant].messages;
    }

    return (
      <div className="ObserverViewerContent" style={{backgroundColor:observerBgColor}}>
        <div className="ObserverHeader">
          <div className="ObserverPlayPauseContainer">
            {getPlayPauseButton}
          </div>
          <div className="ObserverTabsWrapper">
            <div className={"ObserverTabContainer"}>
              {
                participants.map((p, index) => {
                  return <ObserverTab key={index} label={p.name} startTimestamp={p.timestamp} index={index} tabPressedCallback={onClickedTab} participantId={p.id}
                          isActive={currentParticipant===index} completedTasks={completedTasks[p.id]} totalTasks={totalTasks[p.id]} shouldPause={isParticipantsPaused}/>
                })
              }
            </div>
          </div>
        </div>
        <div className="ObserverMessageLog">
          <MessageBoard messages={messages}/>
        </div>
      </div>
      );
}

export default withTheme(observerMode);