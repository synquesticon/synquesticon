import React, { Component, useEffect } from 'react';

import { Typography, TextField } from '@material-ui/core';

import store from '../../../core/store';

import './Text.css';

const textEntryComponent = (props) => {
  let textEntry = "";
  const textRef = React.createRef();

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
  },[]);
    

  const checkAnswer = () => {
    if (props.task.correctResponses === undefined || props.task.correctResponses.length === 0) {
      return "notApplicable";
    }

    for (var i = 0; i < props.task.correctResponses.length; i++) {
      var item = props.task.correctResponses[i];
      if (textEntry.toLowerCase() === item.toLowerCase()) {
        return "correct";
      }
    }
    return "incorrect";
  }

  const onAnswer = (e) => {
    textEntry = e.target.value.replace(/\s\s+/g, ' ');
    let answerObj = {
      responses: [textEntry],
      correctlyAnswered: checkAnswer(),
      //taskID: this.props.task._id,
      mapID: props.mapID,
    }
    //TODO: logging if possible
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
        onChange={(e) => onAnswer(e)}
      />
    </div>
  );
}

export default textEntryComponent;
