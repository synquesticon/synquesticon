import React, { useState, useEffect, useRef } from 'react'
import { Typography } from '@material-ui/core'
import Button from './ButtonElement'
import store from '../../core/store'
import makeLogObject from '../../core/makeLogObject'

const buttonList = props => {
  const textRef = useRef()
  let [clickedButton, setClickedButton] = useState(null)
  let [responseCountArray, setResponseCountArray] = useState(new Array(props.task.responses.length).fill(0))
  let [responsesArray, setResponsesArray] = useState(new Array(props.task.responses.length).fill(null))

  useEffect(() => {
    store.dispatch({
      type: 'ADD_AOIS',
      aois: {
        name: props.parentSet + '_' + props.task.displayText,
        boundingbox: [],
        imageRef: textRef.current
      }
    })

    return () => {
      props.logCallback(
        makeLogObject(
          props,
          getComponentData(),
          getComponentVariant()
        )
      )
      if (props.tags.length > 0 && props.tags.includes("setScreenID"))
        setScreenID()
    }
  }, [])

  const setScreenID = () => {
    const screenIDs = responsesArray.filter(response => response !== null)
    if (screenIDs && screenIDs.length === 1)        //Update the local screenID
      store.dispatch({
        type: 'SET_MULTISCREEN',
        multipleScreens: true,
        screenID: screenIDs[0].toString()
      })
  }

  const getComponentData = () => {
    const data = {}
    data.eventType = 'COMPONENT'
    data.responseCountArray = responseCountArray

    if (!props.task.resetResponses) {   //check if the button is an auto-resetting button
      data.responsesArray = responsesArray
      data.isCorrect =
        (props.task.correctResponses && props.task.correctResponses.length !== 0)
          ? arrayEquals(props.task.correctResponses, responsesArray)
            ? "correct"
            : "incorrect"
          : "notApplicable"

      data.observerMessage = (data.isCorrect !== 'notApplicable')
        ? data.isCorrect.toUpperCase()
          + ' Final answer: '
          + responsesArray.filter(el => el !== null).toString()
          + ' (' + props.displayText + 'Answer '
          + props.task.correctResponses.toString() + ')'
        : 'Final answer: '
          + responsesArray.filter(el => el !== null).toString()
          + ' (' + props.displayText + ')'
    } else {    // Button is an auto-reset button
      data.responsesArray = undefined
      data.isCorrect = undefined
      data.observerMessage = 'Final answer '

      let stringObject = []
      props.task.responses.map( (opt, i) => {
        if (!opt.includes('//') && !opt.includes('\\n'))
          stringObject.push(' ' + opt + ' : ' + data.responseCountArray[i])
      })
      data.observerMessage += stringObject.toString() + ' (' + props.displayText + ')'
    }
    return data
  }

  const clickCallback = (id, isClicked, content) => {
    clickedButton = id
    responseCountArray[id] += 1
    if (props.task.singleChoice) {
      responsesArray.fill(null)
      isClicked
        ? setClickedButton(id)
        : setClickedButton(null)
    }

    isClicked
    ? responsesArray[id] = content
    : responsesArray[id] = null

    const data = {}
    data.eventType = 'ELEMENT'
    data.buttonText = content
    data.observerMessage = (!isClicked && !props.task.resetResponses)
      ? "Un-click " + content + " (" + props.displayText + ")"
      : content + " (" + props.displayText + ")"

    props.logCallback( makeLogObject( props, data, getComponentVariant() ))

    console.log(props.task.correctResponses + " " + responsesArray + " " + responseCountArray)
    console.log("Total responses: " + responseCountArray.reduce((a, b) => { return a + b }, 0))
  }

  const getComponentVariant = () => {
    if (props.task.resetResponses)
      return "RESET_BUTTON"
    else if (props.task.singleChoice)
      return "SINGLE_CHOICE"
    else
      return "MULTIPLE_CHOICE"
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
                    clickCallback={clickCallback}
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