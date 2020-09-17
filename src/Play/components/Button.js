import React, { useState, useEffect } from 'react'
import { Typography } from '@material-ui/core'
import mqtt from '../../core/mqtt'
import Button from './ButtonElement'
import store from '../../core/store'
import * as playerUtils from '../../core/player_utility_functions'
import makeLogObject from '../../core/makeLogObject'
import uuid from 'react-uuid'

const buttonList = props => {
  const textRef = React.createRef()
  let [clickedButton, setClickedButton] = useState(null)
  let [responseCountArray, setResponseCountArray] = useState(new Array(props.task.responses.length).fill(0))
  let [responsesArray, setResponsesArray] = useState(new Array(props.task.responses.length).fill(null))

  let buttonVariant = null
  if (props.task.resetResponses)
    buttonVariant = "RESET_BUTTON"
  else if (props.task.singleChoice)
    buttonVariant = "SINGLE_CHOICE"
  else
    buttonVariant = "MULTIPLE_CHOICE"

  const taskObject = {
    uid: props.taskID,
    name: props.parentSet,
    tags: props.tags
  }

  const componentObject = {
    uid: uuid(),
    type: "BUTTON",
    variant: buttonVariant,
    text: props.displayText,
    correctResponses: props.correctResponses,
    responseOptions: props.task.responses
  }

  useEffect(() => {
    store.dispatch({
      type: 'ADD_AOIS',
      aois: {
        name: props.parentSet + '_' + props.task.displayText,
        boundingbox: [],
        imageRef: textRef
      }
    })

    return () => {
      if (props.tags.length > 0 && props.tags.includes("setScreenID")) {
        const screenIDs = responsesArray.filter(response => response !== null)
        if (screenIDs && screenIDs.length === 1)        //Update the local screenID
          store.dispatch({
            type: 'SET_MULTISCREEN',
            multipleScreens: true,
            screenID: screenIDs[0].toString()
          })
      }

      let observerMessage = ''
      componentObject.responseCountArray = responseCountArray

      if (!props.task.resetResponses) {
        componentObject.responsesArray = responsesArray
        componentObject.isCorrect =
          (props.task.correctResponses && props.task.correctResponses.length !== 0)
            ? arrayEquals(props.task.correctResponses, responsesArray) ? "correct" : "incorrect"
            : "notApplicable"

        observerMessage = (componentObject.isCorrect !== 'notApplicable')
          ? componentObject.isCorrect.toUpperCase() + ' Final answer: ' + responsesArray.filter(el => el !== null).toString() + ' (' + componentObject.text + 'Answer ' + props.task.correctResponses.toString() + ')'
          : 'Final answer: ' + responsesArray.filter(el => el !== null).toString() + ' (' + componentObject.text + ')'
      } else {
        componentObject.responsesArray = undefined
        componentObject.isCorrect = undefined
        observerMessage += 'Final answer '

        let stringObject = []
        componentObject.responseOptions.map((opt, i) => {
          if (!opt.includes('//') && !opt.includes('\\n'))
            stringObject.push(' ' + componentObject.responseOptions[i] + ' : ' + componentObject.responseCountArray[i])
        })
        observerMessage += stringObject.toString() + ' (' + componentObject.text + ')'
      }
      mqtt.sendMqttMessage(
        'taskEvent',
        makeLogObject(
          taskObject,
          componentObject,
          { observerMessage: observerMessage }
        )
      )
    }
  }, [])

  const logElementData = (id, isClicked, content) => {
    clickedButton = id
    responseCountArray[id] += 1
    if (props.task.singleChoice) {
      responsesArray.fill(null)
      isClicked ? setClickedButton(id) : setClickedButton(null)
    }

    const eventObject = {
      source: "BUTTON_CLICK",
      timestamp: playerUtils.getCurrentTime(),
      content: content,
      observerMessage: (responseCountArray[id] % 2 === 0 && !props.task.resetResponses) ? "Un-click " + content + " (" + componentObject.text + ")" : content + " (" + componentObject.text + ")"
    }

    mqtt.sendMqttMessage(
      'taskEvent',
      makeLogObject(
        taskObject,
        componentObject,
        eventObject
      )
    )
    isClicked ? responsesArray[id] = content : responsesArray[id] = null

    console.log(props.task.correctResponses + " " + responsesArray + " " + responseCountArray)
    console.log("Total responses: " + responseCountArray.reduce((a, b) => { return a + b }, 0))
  }

  const arrayEquals = (a, b) => {
    a = a.filter(item => item).sort()
    b = b.filter(item => item).sort()
    return Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((val, index) => val.toUpperCase() === b[index].toUpperCase())
  }

  return (
    <div className={props.className}>
      <div>
        <Typography ref={textRef} variant="h3" color="textPrimary" align="center" style={{ whiteSpace: "pre-line" }}>
          {props.task.displayText}
        </Typography>
      </div>

      <div className="responsesButtons" style={{ whiteSpace: "pre-wrap" }}>
        {
          props.task.responses.map((item, index) => {
            if (item.includes("//")) {
              item = item.replace(/\/\//g, "")  // Remove leading slashes
              item = item.replace(/\\n/g, "\n") // Insert new-line characters
              return (
                <Typography variant="h5" style={{ display: 'inline-block', padding: '5px', whiteSpace: 'pre-wrap' }} color="textPrimary" align="center"
                  ref={textRef} key={index}>
                  {item}
                </Typography>)
            } else if (item === "\\n") {        // Line break
              return (<br key={index}></br>)
            } else {                            // Render as buttons
              item = item.split("??")
              return (
                <span className="inputButton" key={index}>
                  <Button
                    content={item[0]}
                    command={item[1]}
                    commandCallback={commandObj => props.commandCallback(commandObj)}
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
  )
}

export default buttonList