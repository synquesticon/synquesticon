import React, { useState, useEffect } from 'react'
import ShowTask from '../ShowTask'
import DisplayTaskHelper from '../../Views/DisplayTaskHelper'
import eventStore from '../../../../core/eventStore';
import store from '../../../../core/store';
import shuffle from '../../../../core/shuffle';
import * as dbObjects from '../../../../core/db_objects';
import * as dbObjectsUtilityFunctions from '../../../../core/db_objects_utility_functions';

const displayTaskHelper = (props) => {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);

  let progressCount = 0;
  let currentTask = null;

  useEffect(() => {    
    setCurrentTaskIndex(0);
    eventStore.addMultipleScreenListener(onMultipleScreenEvent);

    return () => { //clean up work after the component is unmounted
      eventStore.removeMultipleScreenListener(onMultipleScreenEvent);
    }
  }, []);

  const onMultipleScreenEvent = (payload) => {
    if (payload.type === 'nextTask') {
      const previousIndex = payload.parentSet.length - 2;
      if (payload.parentSet[previousIndex] === props.tasksFamilyTree[props.tasksFamilyTree.length -1]){
        startNextTask();
      }      
    }
  }

  const startNextTask = () => {
    store.dispatch({ type: 'RESET_AOIS' });      // reset aoi list
    props.saveGazeData(dbObjectsUtilityFunctions.getTaskContent(currentTask));
    progressCount += 1;
    setCurrentTaskIndex(prevCount => {
      console.log(prevCount+1);
      return prevCount+1;

    }); //good practice: set new state based on previous state
  }


  //This function is the anchor of recursion
  const isTheEndOfSet = () => {
    return (props.taskSet.data.length > 0 && currentTaskIndex >= props.taskSet.data.length)
  }

  if (!isTheEndOfSet()) {
    currentTask = props.taskSet.data[currentTaskIndex];
    let id = currentTask._id + "_" + progressCount;

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
      let id = currentTask._id + "_" + progressCount;
      return <DisplayTaskHelper key={id}
        tasksFamilyTree={trackingTaskSetNames}
        taskSet={updatedTaskSet}
        onFinished={startNextTask}
        saveGazeData={props.saveGazeData}
        progressCount={progressCount}
      />
    } else { //not a set
      return (
        <div className="page" key={id + currentTaskIndex}>
          <div className="mainDisplay">
            <ShowTask key={id}
              tasksFamilyTree={trackingTaskSetNames}
              task={currentTask}
              parentSet={parentSet}
              renderKey={id} />
          </div>
        </div>
      );
    }
  } else {
    props.onFinished();
    return null;
  }
}

export default displayTaskHelper