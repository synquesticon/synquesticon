import React, { Component } from 'react'

import ShowTask from '../ShowTask'
import mqtt from '../../../../core/mqtt'

import eventStore from '../../../../core/eventStore';
import store from '../../../../core/store';
import shuffle from '../../../../core/shuffle';
import db_helper from '../../../../core/db_helper'
import * as dbObjects from '../../../../core/db_objects';
import * as dbObjectsUtilityFunctions from '../../../../core/db_objects_utility_functions';
import * as playerUtils from '../../../../core/player_utility_functions';

class DisplayTaskHelper extends Component { //for the sake of recursion
    constructor() {
      super();
      this.state = {
        currentTaskIndex: 0,
        hasBeenAnswered: false
      };
  
      this.handleMultipleScreenEvent = this.onMultipleScreenEvent.bind(this);
      this.handleOnNextClicked = this.onClickNext.bind(this);
    }
  
    /*
     ██████  ██████  ███    ███ ██████   ██████  ███    ██ ███████ ███    ██ ████████     ███████ ██    ██ ███    ██  ██████ ████████ ██  ██████  ███    ██ ███████
    ██      ██    ██ ████  ████ ██   ██ ██    ██ ████   ██ ██      ████   ██    ██        ██      ██    ██ ████   ██ ██         ██    ██ ██    ██ ████   ██ ██
    ██      ██    ██ ██ ████ ██ ██████  ██    ██ ██ ██  ██ █████   ██ ██  ██    ██        █████   ██    ██ ██ ██  ██ ██         ██    ██ ██    ██ ██ ██  ██ ███████
    ██      ██    ██ ██  ██  ██ ██      ██    ██ ██  ██ ██ ██      ██  ██ ██    ██        ██      ██    ██ ██  ██ ██ ██         ██    ██ ██    ██ ██  ██ ██      ██
     ██████  ██████  ██      ██ ██       ██████  ██   ████ ███████ ██   ████    ██        ██       ██████  ██   ████  ██████    ██    ██  ██████  ██   ████ ███████
    */
  
    componentWillMount() {
      this.progressCount = 0;
      this.numCorrectAnswers = 0;
      this.currentTask = null;
      this.currentLineOfData = null;
      this.hasBeenInitiated = false;
      this.hasFinished = false;
  
      this.progressCount = 0;//this.props.progressCount;
      eventStore.addMultipleScreenListener(this.handleMultipleScreenEvent);
  
      this.savedObjects = [];
  
      this.setState({
        currentTaskIndex: 0,
        hasBeenAnswered: false
      });
    }
  
    componentWillUnmount(){
      eventStore.removeMultipleScreenListener(this.handleMultipleScreenEvent);
    }
  
    /*
     ██████  █████  ██      ██      ██████   █████   ██████ ██   ██ ███████
    ██      ██   ██ ██      ██      ██   ██ ██   ██ ██      ██  ██  ██
    ██      ███████ ██      ██      ██████  ███████ ██      █████   ███████
    ██      ██   ██ ██      ██      ██   ██ ██   ██ ██      ██  ██       ██
     ██████ ██   ██ ███████ ███████ ██████  ██   ██  ██████ ██   ██ ███████
    */
  
    onMultipleScreenEvent(payload) {
      if(store.getState().multipleScreens && payload.type === 'nextTask'){
        this.onClickNext(null, true);
      }
    }
  
    saveGlobalVariable(participantId, label, value) {
      var globalVariableObj = {
        label: label,
        value: value
      };
      if (store.getState().experimentInfo.shouldSave) {
        db_helper.addNewGlobalVariableToParticipantDB(participantId, JSON.stringify(globalVariableObj));
      }
    }
  
    resetAOIs() {
      var aoiAction = {
        type: 'RESET_AOIS'
      }
  
      store.dispatch(aoiAction);
    }
  
    onClickNext(e, fromEmitter) {
      //===========reset aoi list===========
      this.resetAOIs();
  
      //===========save gazedata===========
      this.props.saveGazeData(dbObjectsUtilityFunctions.getTaskContent(this.currentTask));
  
      //Get the current screenID
      let screenID=store.getState().screenID;
      let doNotBroadcastNext = false;
  
  
      //===========save logging data===========
      if(this.currentLineOfData){
        for (const [key, line] of this.currentLineOfData.entries()) {
          //Only save to the database once
          if(!this.savedObjects.includes(key)){
            this.savedObjects.push(key);
  
            //If there is a global var we save it
            if (line.isGlobalVariable !== undefined) {
              this.saveGlobalVariable(store.getState().experimentInfo.participantId,
                                      line.label, line.responses);
            } //Check if the task has the setScreenID tag and if the line is of the MChoice type
            else if(this.currentTask.tags.includes("setScreenID") && line.objType===dbObjects.TaskTypes.MCHOICE.type){
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
                                                      this.progressCount, -1);
            mqtt.broadcastEvents(stringifiedMessage);
          }
        }
      }
  
      this.progressCount += 1;
  
  
      //Broadcast a status update to any observers listening
      let eventObject = {eventType: "PROGRESSCOUNT",
                         participantId: store.getState().experimentInfo.participantId,
                         progressCount: this.progressCount};
  
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
      this.currentLineOfData = null;
      this.hasBeenInitiated = false;
      //reset state
      this.setState({
        hasBeenAnswered: false,
        answerItem: null,
        currentTaskIndex: (this.state.currentTaskIndex + 1)
      });
    }
  
    onAnswer(answer) {
      if(!(store.getState().experimentInfo.participantId === "TESTING")) {
        this.currentLineOfData = answer.linesOfData;
  
        if (answer.correctlyAnswered === "correct") {
          this.currentTask.numCorrectAnswers += 1;
        }
      }
      this.setState({
        hasBeenAnswered: true
      });
    }
  
    onFinishedRecursion() {
      this.progressCount += this.currentTask.data.length;
      this.onClickNext(false);
    }
  
    /*
    ██████  ███████ ███    ██ ██████  ███████ ██████
    ██   ██ ██      ████   ██ ██   ██ ██      ██   ██
    ██████  █████   ██ ██  ██ ██   ██ █████   ██████
    ██   ██ ██      ██  ██ ██ ██   ██ ██      ██   ██
    ██   ██ ███████ ██   ████ ██████  ███████ ██   ██
    */
    //This function is the anchor of recursion
    isTheEndOfSet() {
      return (this.props.taskSet.data.length > 0 && this.state.currentTaskIndex >= this.props.taskSet.data.length)
    }
  
    render() {
      if(!this.isTheEndOfSet()) {
        this.currentTask = this.props.taskSet.data[this.state.currentTaskIndex];
        //check if there is screen ID for this screen
        //if there is a screen ID, continue
        //if not, get currentTaskIndex-1 ....
        //not as simple as Michael thought it would be
        var id = this.currentTask._id + "_" + this.progressCount;
  
        let trackingTaskSetNames = this.props.tasksFamilyTree.slice(); //clone array, since javascript passes by reference, we need to keep the orginal familyTree untouched
        trackingTaskSetNames.push(this.currentTask.name);
  
        var parentSet = this.props.tasksFamilyTree[this.props.tasksFamilyTree.length - 1];
  
        if (this.currentTask.objType === dbObjects.ObjectTypes.SET) {
          //shuffle set if set was marked as "Random"
          var runThisTaskSet = this.currentTask.data;
          if (this.currentTask.setTaskOrder === "Random") {
            runThisTaskSet = shuffle(runThisTaskSet);
          }
  
          let updatedTaskSet = this.currentTask;
          updatedTaskSet.data = runThisTaskSet;
  
          //recursion
          //let id = this.currentTask._id + "_" + this.progressCount;
          return <DisplayTaskHelper key={id}
                                    tasksFamilyTree={trackingTaskSetNames}
                                    taskSet={updatedTaskSet}
                                    onFinished={this.onFinishedRecursion.bind(this)}
                                    saveGazeData={this.props.saveGazeData}
                                    progressCount={this.progressCount}
                                    repeatSetThreshold={updatedTaskSet.repeatSetThreshold}/>
        }
        else { //not a set
          return (
            <div className="page" key={id+this.currentTaskIndex}>
              <div className="mainDisplay">
                <ShowTask key={id}
                                            tasksFamilyTree={trackingTaskSetNames}
                                            task={this.currentTask}
                                            answerCallback={this.onAnswer.bind(this)}
                                            nextCallback={this.handleOnNextClicked}
                                            isAnswered={this.state.hasBeenAnswered}
                                            answerItem={this.state.answerItem}
                                            newTask={!this.state.hasBeenAnswered}
                                            hasBeenInitiated={this.hasBeenInitiated}
                                            parentSet={parentSet}
                                            initCallback={(taskResponses) => {
                                              this.currentLineOfData = taskResponses;
                                            }}
                                            logTheStartOfTask={(task, log, ind) => {
                                              let eventObject = playerUtils.stringifyMessage(store, task, log, "START", this.progressCount, this.progressCount+1);
                                              mqtt.broadcastEvents(eventObject);
                                              this.hasBeenInitiated = true;
                                            }}
                                            renderKey={id}/>
  
              </div>
            </div>
            );
        }
      }
      else {
        if(!this.hasFinished){
          this.props.onFinished();
          this.hasFinished = true;
        }
        return (null);
      }
    }
}

export default DisplayTaskHelper