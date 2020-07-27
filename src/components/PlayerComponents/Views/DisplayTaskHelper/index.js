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

const displayTaskHelper = (props) => {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);

  var currentLineOfData = null;
  var progressCount = 0;
  var currentTask = null;
  var hasFinished = false;

  const savedObjects = [];

  useEffect(() => {
    setCurrentTaskIndex(0);
    eventStore.addMultipleScreenListener(onMultipleScreenEvent);

    return () => { //clean up work after the component is unmounted, equals to componentWillUnmount
      eventStore.removeMultipleScreenListener(onMultipleScreenEvent);
    }
  }, []);

  const onMultipleScreenEvent = (payload) => {
    if (store.getState().multipleScreens && payload.type === 'nextTask') {
      onClickNext(null, true);
    }
  }

  const onClickNext = (e, fromEmitter) => {
    store.dispatch({ type: 'RESET_AOIS' });      // reset aoi list

    //===========save gazedata===========
    props.saveGazeData(dbObjectsUtilityFunctions.getTaskContent(currentTask));

    //Get the current screenID
    let screenID = store.getState().screenID;
    let doNotBroadcastNext = false;

    //==save logging data==  !!!!  MOVE TO COMPONENT LEVEL   !!!!
    if (currentLineOfData) {
      for (const [key, line] of currentLineOfData.entries()) {
        //Only save to the database once
        if (!savedObjects.includes(key)) {
          savedObjects.push(key);

          line.timeToCompletion = playerUtils.getCurrentTime() - line.startTimestamp;
          if (store.getState().experimentInfo.shouldSave) {
            db_helper.addNewLineToParticipantDB(store.getState().experimentInfo.participantId, JSON.stringify(line));
          }

          //Broadcast a status update to any observers listening
          let stringifiedMessage = playerUtils.stringifyMessage(store, { _id: line.taskId }, line,
            (line.firstResponseTimestamp !== -1) ? "ANSWERED" : "SKIPPED",
            progressCount, -1);
          mqtt.broadcastEvents(stringifiedMessage);
        }
      }
    }

    progressCount += 1;

    //Broadcast a status update to any observers listening
    let eventObject = {
      eventType: "PROGRESSCOUNT",
      participantId: store.getState().experimentInfo.participantId,
      progressCount: progressCount
    };

    mqtt.broadcastEvents(JSON.stringify(eventObject));

    //To prevent the receiving components from broadcasting a new click event
    if (!fromEmitter && !doNotBroadcastNext) {
      mqtt.broadcastMultipleScreen(JSON.stringify({
        type: "nextTask",
        deviceID: window.localStorage.getItem('deviceID'),
        screenID: screenID
      }));
    }

    //===========reset===========
    currentLineOfData = null;

    //reset state
    setCurrentTaskIndex(prevCount => prevCount + 1); //good practice: set new state based on previous state
  }

  //        currentLineOfData = answer.linesOfData;

  const onFinishedRecursion = () => {
    progressCount += currentTask.data.length;
    onClickNext(false);
  }

  //This function is the anchor of recursion
  const isTheEndOfSet = () => {
    return (props.taskSet.data.length > 0 && currentTaskIndex >= props.taskSet.data.length)
  }

  if (!isTheEndOfSet()) {
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
        progressCount={progressCount} />
    } else { //not a set
      return (
        <div className="page" key={id + currentTaskIndex}>
          <div className="mainDisplay">
            <ShowTask key={id}
              tasksFamilyTree={trackingTaskSetNames}
              task={currentTask}
              nextCallback={onClickNext}
              parentSet={parentSet}
              renderKey={id} />
          </div>
        </div>
      );
    }
  } else {
    if (!hasFinished) {
      props.onFinished();
      hasFinished = true;
    }
    return (null);
  }
}

export default displayTaskHelper