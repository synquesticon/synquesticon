import React, { useEffect, Suspense } from 'react';
import Button from '@material-ui/core/Button';
import store from '../../../../core/store';
import mqtt from '../../../../core/mqtt'
import * as dbObjects from '../../../../core/db_objects';

import './showTask.css';

const InstructionViewComponent = React.lazy(() => import('../InstructionViewComponent'));
const TextEntryComponent = React.lazy(() => import('../TextEntryComponent'));
const NumpadComponent = React.lazy(() => import('../NumpadComponent'));
const ButtonComponent = React.lazy(() => import('../ButtonComponent'));
const ImageViewComponent = React.lazy(() => import('../ImageViewComponent'));

const ShowTask = (props) => {
  //console.log("Props from showTask" + JSON.stringify(props.task))

  const nextPressed = () => {
    mqtt.broadcastMultipleScreen(JSON.stringify({
      type: "nextTask",
      parentSet: props.tasksFamilyTree,
      deviceID: window.localStorage.getItem('deviceID'),
      screenID: store.getState().screenID
    }));
  }
  const getDisplayedContent = (taskList, _id, mapIndex) => {
    if (!taskList) {
      return null;
    }

    let hideNext = false;
    let components = taskList.map((item, i) => {
      if ((store.getState().multipleScreens && (item.screenIDS.includes(store.getState().screenID)
        || item.screenIDS.length === 0)) || !store.getState().multipleScreens) {

        if (store.getState().multipleScreens && item.hideNext) {
          hideNext = true;
        }

        mapIndex = i;

        var key = props.renderKey + dbObjects.ObjectTypes.TASK + i;

        if (item.objType === dbObjects.TaskTypes.INSTRUCTION.type) {
          return <Suspense fallback={<div>Loading...</div>}><InstructionViewComponent className="itemContainer" key={key} task={item} mapID={mapIndex} parentSet={props.task.name} /></Suspense>;
        }
        else if (item.objType === dbObjects.TaskTypes.TEXTENTRY.type) {
          return <Suspense fallback={<div>Loading...</div>}><TextEntryComponent className="itemContainer" key={key} task={item} mapID={mapIndex} parentSet={props.task.name} /></Suspense>;
        }
        else if (item.objType === dbObjects.TaskTypes.MCHOICE.type) {
          return <Suspense fallback={<div>Loading...</div>}><ButtonComponent className="itemContainer" key={key} task={item} mapID={mapIndex} parentSet={props.task.name} taskID={props.task._id} familyTree={props.tasksFamilyTree} objType={item.objType} correctResponses={item.correctResponses} image={item.image} displayText={item.displayText} taskObj={props.task} /></Suspense>;
        }
        else if (item.objType === dbObjects.TaskTypes.IMAGE.type) {
          return <Suspense fallback={<div>Loading...</div>}><ImageViewComponent className="itemContainer" key={key} task={item} mapID={mapIndex} parentSet={props.task.name} /></Suspense>;
        }
        else if (item.objType === dbObjects.TaskTypes.NUMPAD.type) {
          return <Suspense fallback={<div>Loading...</div>}><NumpadComponent className="itemContainer" key={key} task={item} mapID={mapIndex} parentSet={props.task.name} /></Suspense>;
        }
        else {
          return null;
        }
      }
      return null;
    });
    return { components: components, hideNext: hideNext };
  }

  const contentObject = getDisplayedContent(props.task.childObj, props.task._id, 0);

  let nextButton = null;
  if (!contentObject.hideNext) {
    nextButton = <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 99 }}>
      <Button className="nextButton" variant="contained" onClick={() => nextPressed(props.tasksFamilyTree)}>
        Next
      </Button>
    </div>;
  }

  return (
    <div key={props.renderKey} className="multiItemContent">
      {contentObject.components}
      {nextButton}
    </div>
  );
}

export default ShowTask;