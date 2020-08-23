import React, { useEffect } from 'react';

import { Typography, TextField } from '@material-ui/core';

import store from '../../../core/store';

import './Text.css'

import uuid from 'react-uuid'
import loggingUtils from '../../../makeLogObject'
import mqtt from '../../../core/mqtt'

const textEntryComponent = (props) => {
  const textRef = React.createRef();

  useEffect(() => {
    textRef.current = ""
    var textAOIAction = {
      type: 'ADD_AOIS',
      aois: {
        name: props.parentSet + '_' + props.task.displayText,
        boundingbox: [],
        imageRef: textRef
      }
    }
    store.dispatch(textAOIAction)

    return () => {
      const taskObject = {
        uid: props.taskID,
        name: props.parentSet,
        tags: props.tags
      }
    
      const componentObject = {
        uid: uuid(),
        type: "TEXT",
        text: props.task.displayText,
        correctResponses: props.task.correctResponses,
        responseOptions: textRef.value,
        isCorrect: checkAnswer(),
      }

      let observerMessageString = ''
      if(componentObject.isCorrect !== 'notApplicable') {
        observerMessageString = componentObject.isCorrect.toUpperCase() + ' Final answer: ' + textRef.current + ' (' + componentObject.text  + ' Answer ' + props.task.correctResponses[0] + ')'
      } else {
        observerMessageString = 'Final answer: ' + textRef.current + ' (' + componentObject.text  + ')'
      }
      const eventObject = {
        observerMessage: observerMessageString
      }

      const textComponentObject = loggingUtils(taskObject, componentObject, eventObject)
      console.log('Text component', JSON.parse(textComponentObject))
      
      mqtt.broadcastEvents(textComponentObject)
      
    }
  },[]);
    

  const checkAnswer = () => {
    if (props.task.correctResponses === undefined || props.task.correctResponses.length === 0) {
      return "notApplicable";
    }

    for (var i = 0; i < props.task.correctResponses.length; i++) {
      var item = props.task.correctResponses[i];
      if (textRef.current.toLowerCase() === item.toLowerCase()) {
        return "correct";
      }
    }
    return "incorrect";
  }

  const onChange = (e) => {
    textRef.current = e.target.value
  }

  return (
    <div className={props.className} style={{display:'flex', position:'relative',
      flexDirection:'column', width:'100%', flexGrow:0,flexShrink:0}}>
      <Typography ref={textRef} variant="h3" align="center" style={{whiteSpace:"pre-line", width:'100%'}} color="textPrimary">
        {props.task.displayText}
      </Typography>
      <TextField
        id="outlined-name"
        className="textField"
        inputProps={{style: { overflowX:'hidden'}}}
        variant="outlined"
        fullWidth
        margin='dense'
        multiline
        rows={3}
        rowsMax={10}
        onChange={(e) => onChange(e)}
      />
    </div>
  );
}

export default textEntryComponent;
