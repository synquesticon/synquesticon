import React, { Component } from 'react';
import Button from '@material-ui/core/Button';

import InstructionViewComponent from '../InstructionViewComponent';
import TextEntryComponent from '../TextEntryComponent';
import NumpadComponent from '../NumpadComponent';
import ButtonComponent from '../ButtonComponent'
import ImageViewComponent from '../ImageViewComponent';

import store from '../../../../core/store';
import * as dbObjects from '../../../../core/db_objects';
import * as playerUtils from '../../../../core/player_utility_functions';

import './SynquestiTaskItem.css';

const synquestiTaskViewComponent = (props) => {

    //Map to hold all the answers from the questions
    //in key = questionID, value = [AnswerList]}
  const taskResponses = new Map();

  //Callback from the task components when the user has provided an answer
  const onAnswer = (answerObj) => {
    //Update the map with the resonse to the task, overwriting any existing answer for that task
    var lineOfData = taskResponses.get(props.task._id+answerObj.mapID);

    if (lineOfData.firstResponseTimestamp === -1) { //log the timeToFirstAnswer
      lineOfData.firstResponseTimestamp = playerUtils.getCurrentTime();
      lineOfData.timeToFirstAnswer = lineOfData.firstResponseTimestamp - lineOfData.startTimestamp;
    }

    //update answer
    lineOfData.clickedPoints = answerObj.clickedPoints;
    lineOfData.responses = Array.isArray(answerObj.responses)?answerObj.responses:[];
    lineOfData.correctlyAnswered = answerObj.correctlyAnswered;


    if (props.task._id+answerObj.mapID) {
      taskResponses.set(props.task._id+answerObj.mapID, lineOfData);
    }

    props.answerCallback({linesOfData: taskResponses, correctlyAnswered: answerObj.correctlyAnswered});
  }

  const logTheStartOfTask = (task, _id, mapIndex) => {
    if (!props.hasBeenInitiated) {
      var newLine = new dbObjects.LineOfData(playerUtils.getCurrentTime(),
                                             _id,
                                             props.tasksFamilyTree,
                                             task.objType===dbObjects.TaskTypes.IMAGE.type?task.image:task.displayText,
                                             task.correctResponses,
                                             task.objType);
      if(task.globalVariable) {
        newLine.isGlobalVariable = true;
        newLine.label = task.displayText;
      }
      if (!task.resetResponses) { //this item is authorized to log its own data, remove the logging from parent task
        taskResponses.set(_id + mapIndex, newLine);
      }

      props.logTheStartOfTask(props.task, newLine, mapIndex);
      return newLine;
    }
    return null;
  }

  const getDisplayedContent = (taskList, _id, mapIndex) => {
    if(!taskList){
      return null;
    }

    let hideNext = false;
    let components = taskList.map((item, i) => {
      if((store.getState().multipleScreens && (item.screenIDS.includes(store.getState().screenID)
      || item.screenIDS.length===0)) || !store.getState().multipleScreens){

        if(store.getState().multipleScreens && item.hideNext){
          hideNext = true;
        }

        mapIndex = i;
        var newLine = null;
        if(props.newTask /*&& item.objType !== "Instruction"*/) {
          newLine = logTheStartOfTask(item, _id, mapIndex);
        }
        var key = props.renderKey+dbObjects.ObjectTypes.TASK+i;

        if(item.objType === dbObjects.TaskTypes.INSTRUCTION.type){
            return <InstructionViewComponent className="itemContainer" key={key} task={item} mapID={mapIndex} parentSet={props.task.name}/>;
        }
        else if(item.objType === dbObjects.TaskTypes.TEXTENTRY.type){
            return <TextEntryComponent className="itemContainer" key={key} task={item} answerCallback={onAnswer} mapID={mapIndex} parentSet={props.task.name}/>;
        }
        else if(item.objType === dbObjects.TaskTypes.MCHOICE.type){
            // return <ButtonViewComponent className="itemContainer" key={key} task={item} answerCallback={onAnswer} mapID={mapIndex} parentSet={props.task.name} delegate={newLine}/>;
            return <ButtonComponent className="itemContainer" key={key} task={item} answerCallback={onAnswer} mapID={mapIndex} parentSet={props.task.name} delegate={newLine}/>;
        }
        else if(item.objType === dbObjects.TaskTypes.IMAGE.type) {
            return <ImageViewComponent className="itemContainer" key={key} task={item} answerCallback={onAnswer} mapID={mapIndex} parentSet={props.task.name}/>;
        }
        else if(item.objType === dbObjects.TaskTypes.NUMPAD.type) {
            return <NumpadComponent className="itemContainer" key={key} task={item} answerCallback={onAnswer} mapID={mapIndex} parentSet={props.task.name}/>;
        }

        else{
          return null;
        }
      }
      return null;
    });
    return {components:components, hideNext:hideNext};
  }

  
  var runThisTaskSet = props.task.childObj;

  var contentObject = getDisplayedContent(runThisTaskSet, props.task._id ,0);
  props.initCallback(taskResponses);

  let nextButton = null;
  if(!contentObject.hideNext){
    let nextButtonText = props.isAnswered ? "Next" : "Skip";
    nextButton = <div style={{position:'fixed', bottom:20, right:20, zIndex:99}}>
                    <Button className="nextButton" variant="contained" onClick={props.nextCallback}>
                      {nextButtonText}
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

export default synquestiTaskViewComponent;
