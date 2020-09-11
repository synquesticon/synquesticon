import React, { useEffect, useState } from 'react'
import { Typography } from '@material-ui/core'
import Button from '@material-ui/core/Button'
import store from '../../core/store'
import mqtt from '../../core/mqtt'
import makeLogObject from '../../core/makeLogObject'
import uuid from 'react-uuid'
import './css/Number.css'

const first_line_keyboard = [1, 2, 3]
const second_line_keyboard = [4, 5, 6]
const third_line_keyboard = [7, 8, 9]
const fourth_line_keyboard = [0, '.', "<"]

const Number = props => {
  const numpadRef = React.useRef()
  const [numpadEntry, setNumpadEntry] = useState('')
  const [decimalWasPressed, setdecimalWasPressed] = useState(false)
  const [textRef] = useState(React.createRef())

  useEffect(() => {
    numpadRef.current = numpadEntry
  }, [numpadEntry])

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
      const taskObject = {
        uid: props.taskID,
        name: props.parentSet,
        tags: props.tags
      }

      const componentObject = {
        uid: uuid(),
        type: "NUMBER",
        text: props.task.displayText,
        correctResponses: props.task.correctResponses,
        responseOptions: numpadRef.current,
        isCorrect: checkAnswer(),
      }

      let observerMessageString = ''
      if (componentObject.isCorrect !== 'notApplicable')
        observerMessageString = componentObject.isCorrect.toUpperCase() + ' Final answer: ' + numpadRef.current + ' (' + componentObject.text + ' Answer ' + props.task.correctResponses[0] + '+-' + props.task.correctResponses[1] + ')'
      else
        observerMessageString = 'Final answer: ' + numpadRef.current + ' (' + componentObject.text + ')'
      mqtt.broadcastEvents(makeLogObject(taskObject, componentObject, { observerMessage: observerMessageString }))
    }
  }, [])

  const onMyKeyboardPressed = key => {
    if (key === "<") {
      let lastChar = numpadEntry[numpadEntry.length - 1]
      if (lastChar === '.') setdecimalWasPressed(false)
      setNumpadEntry(prevNumpadEntry => prevNumpadEntry.substring(0, prevNumpadEntry.length - 1))
    } else if (key === '.') {
      if (!decimalWasPressed) {
        setNumpadEntry(numpadEntry.concat(key))
        setdecimalWasPressed(true)
      }
    } else setNumpadEntry(numpadEntry.concat(key))
  }

  const checkAnswer = () => {
    if (props.task.correctResponses === undefined || props.task.correctResponses.length === 0)
      return "notApplicable"

    //If the response has two values then we treat the second as how much the answer can differ and still be valid
    if (props.task.correctResponses.length > 1) {
      let answer = parseFloat(numpadRef.current)
      let correctAnswer = parseFloat(props.task.correctResponses[0])
      let threshold = parseFloat(props.task.correctResponses[1])
      if (answer >= correctAnswer - threshold && answer <= correctAnswer + threshold)
        return "correct"
    } else if (props.task.correctResponses.length === 1) {  //Otherwise we just check if it matches the correct response
      if (parseFloat(props.task.correctResponses[0]) === parseFloat(numpadEntry))
        return "correct"
    }
    return "incorrect"
  }

  const getKeyboardLine = (keyboard, css) => {
    return (<div className={css}>
      {keyboard.map((item, index) => {
        return <span className="inputButton" key={index}>
          <Button key={index} variant="contained" onClick={() => onMyKeyboardPressed(item)}>
            <Typography variant='body1' align='center'>{item}</Typography>
          </Button>
        </span>
      })}
    </div>)
  }

  return (
    <div className={props.className} >
      <div>
        <Typography ref={textRef} variant="h3" align="center" style={{ whiteSpace: "pre-line" }} color="textPrimary">{props.task.displayText}</Typography>
      </div>
      <div className="inputField">
        <Typography color="textPrimary">{numpadEntry}</Typography>
      </div>
      {getKeyboardLine(first_line_keyboard, "firstLine")}
      {getKeyboardLine(second_line_keyboard, "firstLine")}
      {getKeyboardLine(third_line_keyboard, "firstLine")}
      {getKeyboardLine(fourth_line_keyboard, "thirdLine")}
    </div>
  )
}

export default Number