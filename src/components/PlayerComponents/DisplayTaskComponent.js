import React, { Component } from 'react';

import { Typography } from '@material-ui/core';
import { withTheme } from '@material-ui/styles';

import ShowTask from './Views/ShowTask';

import PauseDialog from './PauseDialog';

import mqtt from '../../core/mqtt'

import eventStore from '../../core/eventStore';
import store from '../../core/store';
import shuffle from '../../core/shuffle';
import db_helper from '../../core/db_helper';
import * as dbObjects from '../../core/db_objects';
import * as dbObjectsUtilityFunctions from '../../core/db_objects_utility_functions';
import * as playerUtils from '../../core/player_utility_functions';
import queryString from 'query-string';

import './DisplayTaskComponent.css';
import '../../core/utility.css';


/*
██████  ███████  ██████ ██    ██ ██████  ███████ ██  ██████  ███    ██      ██████  ██████  ███    ███ ██████   ██████  ███    ██ ███████ ███    ██ ████████
██   ██ ██      ██      ██    ██ ██   ██ ██      ██ ██    ██ ████   ██     ██      ██    ██ ████  ████ ██   ██ ██    ██ ████   ██ ██      ████   ██    ██
██████  █████   ██      ██    ██ ██████  ███████ ██ ██    ██ ██ ██  ██     ██      ██    ██ ██ ████ ██ ██████  ██    ██ ██ ██  ██ █████   ██ ██  ██    ██
██   ██ ██      ██      ██    ██ ██   ██      ██ ██ ██    ██ ██  ██ ██     ██      ██    ██ ██  ██  ██ ██      ██    ██ ██  ██ ██ ██      ██  ██ ██    ██
██   ██ ███████  ██████  ██████  ██   ██ ███████ ██  ██████  ██   ████      ██████  ██████  ██      ██ ██       ██████  ██   ████ ███████ ██   ████    ██
*/
//This component is used to do recursion
class DisplayTaskHelper extends React.Component { //for the sake of recursion
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

/*
██     ██ ██████   █████  ██████  ██████  ███████ ██████       ██████  ██████  ███    ███ ██████   ██████  ███    ██ ███████ ███    ██ ████████
██     ██ ██   ██ ██   ██ ██   ██ ██   ██ ██      ██   ██     ██      ██    ██ ████  ████ ██   ██ ██    ██ ████   ██ ██      ████   ██    ██
██  █  ██ ██████  ███████ ██████  ██████  █████   ██████      ██      ██    ██ ██ ████ ██ ██████  ██    ██ ██ ██  ██ █████   ██ ██  ██    ██
██ ███ ██ ██   ██ ██   ██ ██      ██      ██      ██   ██     ██      ██    ██ ██  ██  ██ ██      ██    ██ ██  ██ ██ ██      ██  ██ ██    ██
 ███ ███  ██   ██ ██   ██ ██      ██      ███████ ██   ██      ██████  ██████  ██      ██ ██       ██████  ██   ████ ███████ ██   ████    ██
*/

//The wrapper handles global measurement that does not need to be reinitiated every recursion
//For example: gaze events
class DisplayTaskComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isPaused : false
    };
    this.handleNewCommandEvent = this.onNewCommandEvent.bind(this);

    //this.gazeDataArray = [];
    //this.frameDiv = React.createRef();
    //this.cursorRadius = 20;
  }

  componentWillMount() {
    this.setState({
      isPaused : false
    });

    this.gazeDataArray = [];
    this.frameDiv = React.createRef();
    this.cursorRadius = 20;

    var layoutAction = {
      type: 'SET_SHOW_HEADER',
      showHeader: false,
      showFooter: false
    }

    store.dispatch(layoutAction);

    var parsed = queryString.parse(this.props.location.search);
    let participantID = parsed.pid;
    var mainTaskSetId = parsed.id;
    var tracker = parsed.tracker;

    if (mainTaskSetId === undefined) {
      return;
    }

    if(participantID){
      let participantAction = {
        type: 'SET_PARTICIPANT_ID',
        participantId: participantID
      }
      store.dispatch(participantAction);
    }

    db_helper.getTasksOrTaskSetsWithIDs(mainTaskSetId, (dbQueryResult, count, mainTaskSetName) => {
      //Force preload all images
      if(dbQueryResult.data){
        playerUtils.getAllImagePaths(dbQueryResult.data).forEach((picture) => {
            const img = document.createElement('img');
            img.src = picture;
        });
      }

      //If the participantID is undefined we create a participant and add it to he experiment
      if(store.getState().experimentInfo.participantId===undefined){
        db_helper.addParticipantToDb(new dbObjects.ParticipantObject(dbQueryResult._id),
          (returnedIdFromDB)=> {
            let action = {
              type: 'SET_EXPERIMENT_INFO',
              experimentInfo: {
                participantLabel: playerUtils.getDeviceName(),
                participantId: returnedIdFromDB,
                shouldSave: true,
                startTimestamp: playerUtils.getFormattedCurrentTime(),
                mainTaskSetId: mainTaskSetName,
                taskSet: dbQueryResult,
                taskSetCount: count,
                selectedTracker: tracker,
              }
            }
            store.dispatch(action);
            this.forceUpdate();
        });
      }
      else{
        let action = {
          type: 'SET_EXPERIMENT_INFO',
          experimentInfo: {
            participantLabel: playerUtils.getDeviceName(),
            participantId: store.getState().experimentInfo.participantId,
            shouldSave: true,
            startTimestamp: playerUtils.getFormattedCurrentTime(),
            mainTaskSetId: mainTaskSetName,
            taskSet: dbQueryResult,
            taskSetCount: count,
            selectedTracker: tracker,
          }
        };

        store.dispatch(action);
        this.forceUpdate();
      }
    });
    eventStore.addNewCommandListener(this.handleNewCommandEvent);
  }

  componentDidMount() {
    if (store.getState().experimentInfo && store.getState().experimentInfo.participantId !== "TESTING" && (store.getState().experimentInfo.selectedTracker !== "")) {

      this.gazeDataArray = [];
      this.timer = setInterval(this.updateCursorLocation.bind(this), 4); //Update the gaze cursor location every 4ms

      //Force preload all images
      /*if(store.getState().experimentInfo.taskSet){
        playerUtils.getAllImagePaths(store.getState().experimentInfo.taskSet).forEach((picture) => {
            const img = new Image();
            img.src = picture.fileName;
        });
      }*/
    }
    //checkShouldSave = true;
  }

  componentWillUnmount() {
    if (store.getState().experimentInfo.participantId !== "TESTING"
      && (store.getState().experimentInfo.selectedTracker !== "")) {

      clearInterval(this.timer);
    }
    var layoutAction = {
      type: 'SET_SHOW_HEADER',
      showHeader: true,
      showFooter: true
    }

    store.dispatch(layoutAction);
    eventStore.removeNewCommandListener(this.handleNewCommandEvent);

    var resetExperimentAction = {
      type: 'RESET_EXPERIMENT'
    }
    store.dispatch(resetExperimentAction);
  }

  /*
   ██████   █████  ███████ ███████
  ██       ██   ██    ███  ██
  ██   ███ ███████   ███   █████
  ██    ██ ██   ██  ███    ██
   ██████  ██   ██ ███████ ███████
  */


  saveGazeData(task) {

    if (this.gazeDataArray.length > 0) {
      var copiedGazeData = this.gazeDataArray.slice();
      this.gazeDataArray = [];
      db_helper.saveGazeData(store.getState().experimentInfo.participantId, task, copiedGazeData);
    }
  }

  //TODO currently this is updated using an interval timer.However it would be better to only update when
  // new events occur.
  //Updates the location of the Gaze Cursor. And checks if any of the AOIs were looked at
  updateCursorLocation(){
    try {
      let gazeLoc = store.getState().gazeData[store.getState().experimentInfo.selectedTracker];
      if(this.frameDiv){
        var cursorX = (gazeLoc.locX*this.frameDiv.current.offsetWidth-this.cursorRadius);
        var cursorY = (gazeLoc.locY*this.frameDiv.current.offsetHeight-this.cursorRadius);

        var aois = store.getState().aois;

        for (var i = 0; i < aois.length; i++) {
          var a = aois[i];
          var imageDivRect = a.imageRef.current.getBoundingClientRect();
          var polygon = [];

          if (a.boundingbox.length > 0) {
            for(let boundingbox of a.boundingbox){
              var x = boundingbox[0]*imageDivRect.width/100 + imageDivRect.x;
              var y = boundingbox[1]*imageDivRect.height/100 + imageDivRect.y;
              polygon.push([x, y]);
            }
          }
          else {
            polygon.push([imageDivRect.x, imageDivRect.y]);
            polygon.push([imageDivRect.x + imageDivRect.width, imageDivRect.y]);
            polygon.push([imageDivRect.x + imageDivRect.width, imageDivRect.y + imageDivRect.height]);
            polygon.push([imageDivRect.x, imageDivRect.y + imageDivRect.height]);
          }
          if (playerUtils.pointIsInPoly([cursorX, cursorY], polygon)){
            gazeLoc.target = a;
            break;
          }
        }

        //var timestamp = playerUtils.getCurrentTime();
        if (!this.gazeDataArray.includes(gazeLoc)) {
          this.gazeDataArray.push(gazeLoc);
        }
      }
    } catch (err) {
    }
  }

  broadcastEndEvent() {
    var dt = new Date();
    var timestamp = dt.toUTCString();

    let eventObject = {
      eventType: "FINISHED",
      participantId: store.getState().experimentInfo.participantId,
      participantLabel: store.getState().experimentInfo.participantLabel,
      startTimestamp: store.getState().experimentInfo.startTimestamp,
      selectedTracker: store.getState().experimentInfo.selectedTracker,
      mainTaskSetId: store.getState().experimentInfo.mainTaskSetId,
      lineOfData: {
        startTaskTime: timestamp
      },
      timestamp: timestamp
    };

    var info = JSON.stringify(eventObject);
    mqtt.broadcastEvents(info);
  }

  /*
 ██████  ██████  ███    ███ ███    ███  █████  ███    ██ ██████  ███████
██      ██    ██ ████  ████ ████  ████ ██   ██ ████   ██ ██   ██ ██
██      ██    ██ ██ ████ ██ ██ ████ ██ ███████ ██ ██  ██ ██   ██ ███████
██      ██    ██ ██  ██  ██ ██  ██  ██ ██   ██ ██  ██ ██ ██   ██      ██
 ██████  ██████  ██      ██ ██      ██ ██   ██ ██   ████ ██████  ███████
*/
  onNewCommandEvent() {
    var args = JSON.parse(eventStore.getCurrentCommand());
    var shouldProcess = false;

    if (args.participantId === -1 || args.participantId === store.getState().experimentInfo.participantId) {
      shouldProcess = true;
    }

    if (shouldProcess) {
      switch (args.commandType) {
        case "PAUSE":
          this.setState({
            isPaused: true
          });
          break;
        case "RESUME":
          this.setState({
            isPaused: false
          });
          break;
        default:
          break;
      }
    }
  }

  onFinished() {
    if (!(store.getState().experimentInfo.participantId === "TESTING")) {
      this.broadcastEndEvent();
    }

    this.props.history.goBack();

    let snackbarAction = {
      type: 'TOAST_SNACKBAR_MESSAGE',
      snackbarOpen: true,
      snackbarMessage: "Finished"
    };
    store.dispatch(snackbarAction);
  }

  render() {
    if (store.getState().experimentInfo) {
      let theme = this.props.theme;
      let rightBG = theme.palette.type === "light" ? theme.palette.primary.main : theme.palette.primary.dark;
      var taskSet = null;
      try {
        if (store.getState().experimentInfo.taskSet.displayOnePage) {
          taskSet = {
            objType: dbObjects.ObjectTypes.SET,
            displayOnePage: true,
            data: [store.getState().experimentInfo.taskSet]
          };
        }
        else {
          taskSet = store.getState().experimentInfo.taskSet;
        }
        var renderObj = <DisplayTaskHelper tasksFamilyTree={[store.getState().experimentInfo.mainTaskSetId]}
                                           taskSet={taskSet}
                                           displayOnePage={store.getState().experimentInfo.taskSet.displayOnePage}
                                           onFinished={this.onFinished.bind(this)}
                                           saveGazeData={this.saveGazeData.bind(this)}
                                           progressCount={0}
                                           repeatSetThreshold={store.getState().experimentInfo.taskSet.repeatSetThreshold}/>;
        return (
            <div style={{backgroundColor:rightBG}} className="page" ref={this.frameDiv}>
              {renderObj}
              <PauseDialog openDialog={this.state.isPaused} pauseMessage="Task paused."/>
            </div>
        );
      }
      catch(err) {
        return <div style={{backgroundColor:rightBG}}/>;
      }
    }
    return <Typography variant="h2" color="textPrimary" style={{position:'absolute', left:'50%', top:'50%'}}>Loading...</Typography>;
  }
}

export default withTheme(DisplayTaskComponent);
