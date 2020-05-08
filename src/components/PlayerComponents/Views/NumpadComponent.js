import React, { useEffect, useState } from 'react';

import { Typography } from '@material-ui/core';
import Button from '@material-ui/core/Button';

import store from '../../../core/store';

import './TextEntryComponent.css';

const first_line_keyboard = [1, 2, 3]
const second_line_keyboard = [4, 5, 6]
const third_line_keyboard = [7, 8, 9]
const fourth_line_keyboard = [0, '.', "<"]

//var textRef = React.createRef();

const NumpadComponent = props => {
  const [numpadEntry, setNumpadEntry] = useState("");
  const [decimalWasPressed, setdecimalWasPressed] = useState(false);
  const [textRef] = useState(React.createRef());

  useEffect ( () => {
    const textAOIAction = {
      type: 'ADD_AOIS',
      aois: {
        name: props.parentSet + '_' + props.task.displayText,
        boundingbox: [],
        imageRef: textRef
      }
    }
    store.dispatch(textAOIAction);
  }, []);

  const onMyKeyboardPressed = key => {
    if (key === "<") {
      var lastChar = numpadEntry[numpadEntry.length -1];
      if (lastChar === '.') {
        setdecimalWasPressed(false);
      }
      setNumpadEntry(numpadEntry.substring(0, numpadEntry.length-1));
    }
    else if (key === '.') {
      if (!decimalWasPressed) {
        setNumpadEntry(numpadEntry+key)
        setdecimalWasPressed(true);
      }
    } else {
      setNumpadEntry(numpadEntry + "" + key);
    }
    onAnswer();
  }

  function checkAnswer() {
    if (props.task.correctResponses === undefined || props.task.correctResponses.length === 0) {
      return "notApplicable";
    }

    //If the response has two values then we treat the second as how much the answer can differ and still be valid
    if(props.task.correctResponses.length > 1){
      let answer = parseFloat(numpadEntry);
      let correctAnswer = parseFloat(props.task.correctResponses[0]);
      let threshold = parseFloat(props.task.correctResponses[1]);
      if(answer >= correctAnswer-threshold && answer <= correctAnswer+threshold){
        return "correct";
      }
    } //Otherwise we just check if it matches the correct response
    else if(props.task.correctResponses.length === 1){
      if(parseFloat(props.task.correctResponses[0]) === parseFloat(numpadEntry)) {
        return "correct";
      }
    }
    return "incorrect";
  }

  function onAnswer() {
    const answerObj = {
      responses: [parseFloat(numpadEntry)],
      correctlyAnswered: checkAnswer(),
      taskID: props.task._id,
      mapID: props.mapID,
    }
    props.answerCallback(answerObj);
  }

  const getKeyboardLine = (keyboard, css) => {
    return (<div className={css}>
            {keyboard.map((item, index) => {
                return <span className="inputButton" key={index}>
                          <Button key={index} variant="contained" onClick={() => onMyKeyboardPressed(item)}>
                            <Typography variant='body1' align='center'>{item}</Typography>
                          </Button>
                        </span>
                }
              )
            }
            </div>);
  }

  return (
    <div className={props.className} >
      <div>
        <Typography ref={textRef} variant="h3" align="center" style={{whiteSpace:"pre-line"}} color="textPrimary">{props.displayText}</Typography>
      </div>
      <div className="inputField">
        <Typography color="textPrimary">{numpadEntry}</Typography>
      </div>
      {getKeyboardLine(first_line_keyboard, "firstLine")}
      {getKeyboardLine(second_line_keyboard, "firstLine")}
      {getKeyboardLine(third_line_keyboard, "firstLine")}
      {getKeyboardLine(fourth_line_keyboard, "thirdLine")}
    </div>
  );
}

export default NumpadComponent;
