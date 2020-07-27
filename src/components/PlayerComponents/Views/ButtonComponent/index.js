import React, { useState, useEffect } from 'react'
import { Typography } from '@material-ui/core';
import mqtt from '../../../../core/mqtt'
import Button from './buttonElement'
import store from '../../../../core/store'
import * as dbObjects from '../../../../core/db_objects'
import * as playerUtils from '../../../../core/player_utility_functions'

const buttonList = (props) => {
  console.log("Props from ButtonComponent" + JSON.stringify(props))
  const textRef = React.createRef();
  let [clickedButton, setClickedButton] = useState(null)
  let [responseCountArray, setResponseCountArray] = useState(new Array(props.task.responses.length).fill(0))
  let [responsesArray, setResponsesArray] = useState(new Array(props.task.responses.length).fill(null))

  useEffect(() => {
    var textAOIAction = {
      type: 'ADD_AOIS',
      aois: {
        name: props.parentSet + '_' + props.task.displayText,
        boundingbox: [],
        imageRef: textRef
      }
    }
    store.dispatch(textAOIAction);
    return () => {      // log data when component unmounts
      console.log("Final answer: " + responsesArray.filter(item => item).sort())
      console.log("Final count: " + responseCountArray.reduce((a, b) => { return a + b }, 0))
      if (props.task.correctResponses.length > 0) {
        console.log("Overall correct: " + arrayEquals(responsesArray, props.task.correctResponses))
      } else {
        console.log("No correct answers defined.")
      }
      //CODE comes from DisplayTaskHelper, must be updated
      // if (currentTask.tags.includes("setScreenID")) {
      //   // If the answer has a response we set multiple screens to true and set the
      //   // screenID for this screen to the response
      //   if (line.responses && line.responses.length > 0) {
      //     doNotBroadcastNext = true;
      //     //Update the local screenID
      //     screenID = line.responses[0].toString();
      //     let multipleScreensAction = {
      //       type: 'SET_MULTISCREEN',
      //       multipleScreens: true,
      //       screenID: screenID
      //     }
      //     store.dispatch(multipleScreensAction);
      //   }
      // }
      //If there is a global var we save it
      // if (line.isGlobalVariable !== undefined) {
      //   saveGlobalVariable(store.getState().experimentInfo.participantId,
      //     line.label, line.responses);
      // }
      // const saveGlobalVariable = (participantId, label, value) => {
      //   var globalVariableObj = {
      //     label: label,
      //     value: value
      //   };
      //   if (store.getState().experimentInfo.shouldSave) {
      //     db_helper.addNewGlobalVariableToParticipantDB(participantId, JSON.stringify(globalVariableObj));
      //   }
      // }
    }
  }, [])

  useEffect(() => {
    let newLine = new dbObjects.LineOfData(playerUtils.getCurrentTime(),
      props.taskID,
      props.familyTree,
      props.objType === dbObjects.TaskTypes.IMAGE.type ? props.image : props.displayText,
      props.correctResponses,
      props.objType);
    console.log("newLine" + JSON.stringify(newLine))
    // if (task.globalVariable) {
    //   newLine.isGlobalVariable = true;
    //   newLine.label = task.displayText;
    // }

    let eventObject = playerUtils.stringifyMessage(store, props.taskObj, newLine, "START", 0, 1); //last two params are "progressCount /progressCount+1"
    mqtt.broadcastEvents(eventObject)
  }, [])

  const logElementData = (id, isClicked, content) => {
    clickedButton = id
    responseCountArray[id]++
    if (props.task.singleChoice) {
      responsesArray.fill(null)
      if (isClicked) {
        console.log("single")
        setClickedButton(id)
      } else {
        setClickedButton(null)
      }
    }

    if (isClicked) {
      responsesArray[id] = content
    } else {
      responsesArray[id] = null
    }
    console.log("correct: " + props.task.correctResponses)
    console.log(responsesArray)
    console.log(responseCountArray)
    console.log("Total responses: " + responseCountArray.reduce((a, b) => { return a + b }, 0))
  }

  const arrayEquals = (a, b) => {
    a = a.filter(item => item).sort()
    b = b.filter(item => item).sort()
    return Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((val, index) => val.toUpperCase() === b[index].toUpperCase());
  }

  return (
    <div className={props.className}>
      <div>
        <Typography ref={textRef} variant="h3" color="textPrimary" align="center" style={{ whiteSpace: "pre-line" }}>{props.task.displayText}</Typography>
      </div>

      <div className="responsesButtons" style={{ whiteSpace: "pre-wrap" }}>
        {
          props.task.responses.map((item, index) => {
            if (item.includes("//")) {
              item = item.replace(/\/\//g, "");  // Remove leading slashes
              item = item.replace(/\\n/g, "\n"); // insert new-line characters
              return (
                <Typography
                  variant="h5"
                  style={{ display: 'inline-block', padding: '5px', whiteSpace: 'pre-wrap' }}
                  ref={textRef}
                  key={index}
                  color="textPrimary"
                  align="center">{item}
                </Typography>)
            } else if (item === "\\n") { //line break
              return (<br></br>);
            } else { //render as buttons
              return (
                <span className="inputButton" key={index}>
                  <Button
                    content={item}
                    reset={props.task.resetResponses}
                    isSingleChoice={props.task.singleChoice}
                    id={index}
                    key={index}
                    clickedButton={clickedButton}
                    logElementData={logElementData}
                  />
                </span>
              )
            }
          }
          )
        }
      </div>
    </div>
  );
}

export default buttonList;