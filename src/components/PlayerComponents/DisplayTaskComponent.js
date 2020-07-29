import React, { Component } from 'react';

import { Typography } from '@material-ui/core';
import { withTheme } from '@material-ui/styles';

import DisplayTaskHelper from './Views/DisplayTaskHelper/runSet'

import PauseDialog from './PauseDialog';

import mqtt from '../../core/mqtt'

import eventStore from '../../core/eventStore';
import store from '../../core/store';
import db_helper from '../../core/db_helper';
import * as dbObjects from '../../core/db_objects';
import * as playerUtils from '../../core/player_utility_functions';
import queryString from 'query-string';

import './DisplayTaskComponent.css';
import '../../core/utility.css';


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
      isPaused: false
    };
    this.handleNewCommandEvent = this.onNewCommandEvent.bind(this);

    //this.gazeDataArray = [];
    //this.frameDiv = React.createRef();
    //this.cursorRadius = 20;
  }

  componentWillMount() {
    this.setState({
      isPaused: false
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

    if (participantID) {
      let participantAction = {
        type: 'SET_PARTICIPANT_ID',
        participantId: participantID
      }
      store.dispatch(participantAction);
    }

    db_helper.getTasksOrTaskSetsWithIDs(mainTaskSetId, (dbQueryResult, count, mainTaskSetName) => {
      //Force preload all images
      if (dbQueryResult.data) {
        playerUtils.getAllImagePaths(dbQueryResult.data).forEach((picture) => {
          const img = document.createElement('img');
          img.src = picture;
        });
      }

      //If the participantID is undefined we create a participant and add it to he experiment
      if (store.getState().experimentInfo.participantId === undefined) {
        db_helper.addParticipantToDb(new dbObjects.ParticipantObject(dbQueryResult._id),
          (returnedIdFromDB) => {
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
      else {
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
  updateCursorLocation() {
    try {
      let gazeLoc = store.getState().gazeData[store.getState().experimentInfo.selectedTracker];
      if (this.frameDiv) {
        var cursorX = (gazeLoc.locX * this.frameDiv.current.offsetWidth - this.cursorRadius);
        var cursorY = (gazeLoc.locY * this.frameDiv.current.offsetHeight - this.cursorRadius);

        var aois = store.getState().aois;

        for (var i = 0; i < aois.length; i++) {
          var a = aois[i];
          var imageDivRect = a.imageRef.current.getBoundingClientRect();
          var polygon = [];

          if (a.boundingbox.length > 0) {
            for (let boundingbox of a.boundingbox) {
              var x = boundingbox[0] * imageDivRect.width / 100 + imageDivRect.x;
              var y = boundingbox[1] * imageDivRect.height / 100 + imageDivRect.y;
              polygon.push([x, y]);
            }
          }
          else {
            polygon.push([imageDivRect.x, imageDivRect.y]);
            polygon.push([imageDivRect.x + imageDivRect.width, imageDivRect.y]);
            polygon.push([imageDivRect.x + imageDivRect.width, imageDivRect.y + imageDivRect.height]);
            polygon.push([imageDivRect.x, imageDivRect.y + imageDivRect.height]);
          }
          if (playerUtils.pointIsInPoly([cursorX, cursorY], polygon)) {
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
    const timestamp = new Date().toUTCString();

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

    mqtt.broadcastEvents(JSON.stringify(eventObject));

    console.log("FINISHED")
        this.props.history.goBack();
// We want the following code back eventually, but it caused a strange error whereby the onFinished function would be called again anad again, causing it to go back repeatedly, eventually out of the application
    // let snackbarAction = {     
    //   type: 'TOAST_SNACKBAR_MESSAGE',
    //   snackbarOpen: true,
    //   snackbarMessage: "Finished"
    // };
    // store.dispatch(snackbarAction);
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
          progressCount={0} />;
        return (
          <div style={{ backgroundColor: rightBG }} className="page" ref={this.frameDiv}>
            {renderObj}
            <PauseDialog openDialog={this.state.isPaused} pauseMessage="Task paused." />
          </div>
        );
      }
      catch (err) {
        return <div style={{ backgroundColor: rightBG }} />;
      }
    }
    return <Typography variant="h2" color="textPrimary" style={{ position: 'absolute', left: '50%', top: '50%' }}>Loading...</Typography>;
  }
}

export default withTheme(DisplayTaskComponent);