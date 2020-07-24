import React, { useState, useEffect } from 'react'

import ShowTask from '../ShowTask'
import mqtt from '../../../../core/mqtt'
import DisplayTaskHelper from '../../Views/DisplayTaskHelper'

import eventStore from '../../../../core/eventStore';
import store from '../../../../core/store';
import shuffle from '../../../../core/shuffle';
import db_helper from '../../../../core/db_helper'
import * as dbObjects from '../../../../core/db_objects';
import * as dbObjectsUtilityFunctions from '../../../../core/db_objects_utility_functions';
import * as playerUtils from '../../../../core/player_utility_functions';

const displayTaskHelper = (props) => { //for the sake of recursion


  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [hasBeenAnswered, setHasBeenAnswered] = useState(false);

  var currentLineOfData = null;
  var progressCount = 0;
  var numCorrectAnswers = 0;
  var currentTask = null;
  var hasBeenInitiated = false;
  var hasFinished = false;

  const savedObjects = [];


    /*
     ██████  ██████  ███    ███ ██████   ██████  ███    ██ ███████ ███    ██ ████████     ███████ ██    ██ ███    ██  ██████ ████████ ██  ██████  ███    ██ ███████
    ██      ██    ██ ████  ████ ██   ██ ██    ██ ████   ██ ██      ████   ██    ██        ██      ██    ██ ████   ██ ██         ██    ██ ██    ██ ████   ██ ██
    ██      ██    ██ ██ ████ ██ ██████  ██    ██ ██ ██  ██ █████   ██ ██  ██    ██        █████   ██    ██ ██ ██  ██ ██         ██    ██ ██    ██ ██ ██  ██ ███████
    ██      ██    ██ ██  ██  ██ ██      ██    ██ ██  ██ ██ ██      ██  ██ ██    ██        ██      ██    ██ ██  ██ ██ ██         ██    ██ ██    ██ ██  ██ ██      ██
     ██████  ██████  ██      ██ ██       ██████  ██   ████ ███████ ██   ████    ██        ██       ██████  ██   ████  ██████    ██    ██  ██████  ██   ████ ███████
    */
  
  useEffect(() => {
    setCurrentTaskIndex(0);
    setHasBeenAnswered(false);    
    eventStore.addMultipleScreenListener(onMultipleScreenEvent);

    return () => { //clean up work after the component is unmounted, equals to componentWillUnmount
      eventStore.removeMultipleScreenListener(onMultipleScreenEvent);
    }
  }, []);

  
    /*
     ██████  █████  ██      ██      ██████   █████   ██████ ██   ██ ███████
    ██      ██   ██ ██      ██      ██   ██ ██   ██ ██      ██  ██  ██
    ██      ███████ ██      ██      ██████  ███████ ██      █████   ███████
    ██      ██   ██ ██      ██      ██   ██ ██   ██ ██      ██  ██       ██
     ██████ ██   ██ ███████ ███████ ██████  ██   ██  ██████ ██   ██ ███████
    */
  
    const onMultipleScreenEvent = (payload) => {
      if(store.getState().multipleScreens && payload.type === 'nextTask'){
        onClickNext(null, true);
      }
    }
  
    const saveGlobalVariable = (participantId, label, value) => {
      var globalVariableObj = {
        label: label,
        value: value
      };
      if (store.getState().experimentInfo.shouldSave) {
        db_helper.addNewGlobalVariableToParticipantDB(participantId, JSON.stringify(globalVariableObj));
      }
    }
  
    const resetAOIs = () => {
      var aoiAction = {
        type: 'RESET_AOIS'
      }
  
      store.dispatch(aoiAction);
    }
  
    const onClickNext = (e, fromEmitter) => {
      //===========reset aoi list===========
      resetAOIs();
  
      //===========save gazedata===========
      props.saveGazeData(dbObjectsUtilityFunctions.getTaskContent(currentTask));
  
      //Get the current screenID
      let screenID=store.getState().screenID;
      let doNotBroadcastNext = false;
  
  
      //===========save logging data===========
      if(currentLineOfData){
        for (const [key, line] of currentLineOfData.entries()) {
          //Only save to the database once
          if(!savedObjects.includes(key)){
            savedObjects.push(key);
  
            //If there is a global var we save it
            if (line.isGlobalVariable !== undefined) {
              saveGlobalVariable(store.getState().experimentInfo.participantId,
                                      line.label, line.responses);
            } //Check if the task has the setScreenID tag and if the line is of the MChoice type
            else if(currentTask.tags.includes("setScreenID") && line.objType===dbObjects.TaskTypes.MCHOICE.type){
              // If the answer has a response we set multiple screens to true and set the
              // screenID for this screen to the response
              if(line.responses && line.responses.length > 0){
                doNotBroadcastNext = true;
                //Update the local screenID
                screenID=line.responses[0].toString();
                let multipleScreensAction = {
                  type: 'SET_MULTISCREEN',
                  multipleScreens: true,
                  screenID: screenID
                }
                store.dispatch(multipleScreensAction);
              }
            }
            else { //Otherwise we log the answer to the participant database object
              line.timeToCompletion = playerUtils.getCurrentTime() - line.startTimestamp;
              if (store.getState().experimentInfo.shouldSave) {
                db_helper.addNewLineToParticipantDB(store.getState().experimentInfo.participantId, JSON.stringify(line));
              }
            }
  
            //Broadcast a status update to any observers listening
            let stringifiedMessage = playerUtils.stringifyMessage(store, {_id:line.taskId}, line,
                                                      (line.firstResponseTimestamp !== -1) ? "ANSWERED" : "SKIPPED",
                                                      progressCount, -1);
            mqtt.broadcastEvents(stringifiedMessage);
          }
        }
      }
  
      progressCount += 1;
  
  
      //Broadcast a status update to any observers listening
      let eventObject = {eventType: "PROGRESSCOUNT",
                         participantId: store.getState().experimentInfo.participantId,
                         progressCount: progressCount};
  
      mqtt.broadcastEvents(JSON.stringify(eventObject));
  
      //To prevent the receiving components from broadcasting a new click event
      if(!fromEmitter && !doNotBroadcastNext){
        mqtt.broadcastMultipleScreen(JSON.stringify({
                               type: "nextTask",
                               deviceID: window.localStorage.getItem('deviceID'),
                               screenID: screenID
                              }));
      }
  
      //===========reset===========
      currentLineOfData = null;
      hasBeenInitiated = false;

      //reset state
      setHasBeenAnswered(false);
      setCurrentTaskIndex(prevCount => prevCount + 1); //good practice: set new state based on previous state
    }
  
    const onAnswer = (answer) => {
      if(!(store.getState().experimentInfo.participantId === "TESTING")) {
        currentLineOfData = answer.linesOfData;
  
        if (answer.correctlyAnswered === "correct") {
          currentTask.numCorrectAnswers += 1;
        }
      }
      setHasBeenAnswered(true);
    }
  
    const onFinishedRecursion = () => {
      progressCount += currentTask.data.length;
      onClickNext(false);
    }
  
    /*
    ██████  ███████ ███    ██ ██████  ███████ ██████
    ██   ██ ██      ████   ██ ██   ██ ██      ██   ██
    ██████  █████   ██ ██  ██ ██   ██ █████   ██████
    ██   ██ ██      ██  ██ ██ ██   ██ ██      ██   ██
    ██   ██ ███████ ██   ████ ██████  ███████ ██   ██
    */
    //This function is the anchor of recursion
    const isTheEndOfSet = () => {
      return (props.taskSet.data.length > 0 && currentTaskIndex >= props.taskSet.data.length)
    }
  

    if(!isTheEndOfSet()) {
      currentTask = props.taskSet.data[currentTaskIndex];
      //check if there is screen ID for this screen
      //if there is a screen ID, continue
      //if not, get currentTaskIndex-1 ....
      //not as simple as Michael thought it would be
      var id = currentTask._id + "_" + progressCount;

      let trackingTaskSetNames = props.tasksFamilyTree.slice(); //clone array, since javascript passes by reference, we need to keep the orginal familyTree untouched
      trackingTaskSetNames.push(currentTask.name);

      var parentSet = props.tasksFamilyTree[props.tasksFamilyTree.length - 1];

      if (currentTask.objType === dbObjects.ObjectTypes.SET) {
        //shuffle set if set was marked as "Random"
        var runThisTaskSet = currentTask.data;
        if (currentTask.setTaskOrder === "Random") {
          runThisTaskSet = shuffle(runThisTaskSet);
        }

        let updatedTaskSet = currentTask;
        updatedTaskSet.data = runThisTaskSet;

        //recursion
        //let id = this.currentTask._id + "_" + this.progressCount;
        return <DisplayTaskHelper key={id}
                                  tasksFamilyTree={trackingTaskSetNames}
                                  taskSet={updatedTaskSet}
                                  onFinished={onFinishedRecursion}
                                  saveGazeData={props.saveGazeData}
                                  progressCount={progressCount}
                                  repeatSetThreshold={updatedTaskSet.repeatSetThreshold}/>
      }
      else { //not a set
        return (
          <div className="page" key={id+currentTaskIndex}>
            <div className="mainDisplay">
              <ShowTask key={id}
                                          tasksFamilyTree={trackingTaskSetNames}
                                          task={currentTask}
                                          answerCallback={onAnswer}
                                          nextCallback={onClickNext}
                                          isAnswered={hasBeenAnswered}
                                          newTask={!hasBeenAnswered}
                                          hasBeenInitiated={hasBeenInitiated}
                                          parentSet={parentSet}
                                          initCallback={(taskResponses) => {
                                            currentLineOfData = taskResponses;
                                          }}
                                          logTheStartOfTask={(task, log, ind) => {
                                            let eventObject = playerUtils.stringifyMessage(store, task, log, "START", progressCount, progressCount+1);
                                            mqtt.broadcastEvents(eventObject);
                                            hasBeenInitiated = true;
                                          }}
                                          renderKey={id}/>

            </div>
          </div>
          );
      }
    } else {
      if(!hasFinished){
        props.onFinished();
        hasFinished = true;
      }
      return (null);
    }

}

export default displayTaskHelper