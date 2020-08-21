import React, { useState, useEffect } from 'react'
import { Typography } from '@material-ui/core';
import mqtt from '../../../../core/mqtt'
import Button from './buttonElement'
import store from '../../../../core/store'
import * as dbObjects from '../../../../core/db_objects'
import * as playerUtils from '../../../../core/player_utility_functions'
import loggingUtils from '../../../../makeLogObject';

const buttonList = (props) => {
  //console.log("Props from ButtonComponent" + JSON.stringify(props))
  const textRef = React.createRef();
  let [clickedButton, setClickedButton] = useState(null)
  let [responseCountArray, setResponseCountArray] = useState(new Array(props.task.responses.length).fill(0))
  let [responsesArray, setResponsesArray] = useState(new Array(props.task.responses.length).fill(null))

  let buttonVariant = null;
  if (props.task.resetResponses){
    buttonVariant = "RESET_BUTTON"
  } else if(props.task.singleChoice){
    buttonVariant = "SINGLE_CHOICE"
  } else {
    buttonVariant = "MULTIPLE_CHOICE"
  }

  const taskObject = {
    uid: props.taskID,
    name: props.parentSet,
    tags: props.tags
  }

  const componentObject = {
    uid: props.key,
    type: "BUTTON",
    variant: buttonVariant,
    text: props.displayText,
    correctResponses: props.correctResponses,
    responseOptions: props.task.responses
  }

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
    return () => {      

      // allow user to set screens ID based on button component
      if (props.tags.length > 0 && props.tags.includes("setScreenID")) {
        // If the answer has a response we set multiple screens to true and set the
        // screenID for this screen to the response
        const screenIDs = responsesArray.filter(response => response !== null);
        if (screenIDs && screenIDs.length === 1) {
          //Update the local screenID
          let screenID = screenIDs[0].toString();
          let multipleScreensAction = {
            type: 'SET_MULTISCREEN',
            multipleScreens: true,
            screenID: screenID
          }
          store.dispatch(multipleScreensAction);
        }
          
      }

      const buttonComponentObject = loggingUtils(taskObject, componentObject)

      console.log('Happen when button component is unmounted', buttonComponentObject)



    }
  }, [])

  useEffect(() => {
    let newLine = new dbObjects.LineOfData(playerUtils.getCurrentTime(),
      props.taskID,
      props.familyTree,
      props.objType === dbObjects.TaskTypes.IMAGE.type ? props.image : props.displayText,
      props.correctResponses,
      props.objType);
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

    const taskObject = {
      uid: props.taskID,
      name: props.parentSet,
      tags: props.tags
    }

    const componentObject = {
      uid: props.key,
      type: "BUTTON",
      variant: buttonVariant,
      text: props.displayText,
      correctResponses: props.correctResponses

    }

    const eventObject = {
      source: "BUTTON_CLICK",
      timestamp: playerUtils.getFormattedCurrentTime(),
      content: content,
      observerMessage: content+" ("+componentObject.text+")"
      
    }

    
    const buttonClickEventObject = loggingUtils(taskObject, componentObject, eventObject)

    console.log('Button clicked logging objects', buttonClickEventObject)

    mqtt.broadcastEvents(buttonClickEventObject)

    

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