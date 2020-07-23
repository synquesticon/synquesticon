import React, { useState, useEffect } from 'react';

import Button from '@material-ui/core/Button';
import { Typography } from '@material-ui/core';
import { withTheme } from '@material-ui/styles';

import mqtt from '../../../core/mqtt'
import db_helper from '../../../core/db_helper';
import * as playerUtils from '../../../core/player_utility_functions';

import store from '../../../core/store';

import './ButtonViewComponent.css';
import { pick } from 'lodash';

const buttonComponent = (props) => {
    const [pickedItems, setPickedItems] = useState([]);
    const textRef = React.createRef();

    //we grant button with reset feature the permission to log data
    const delegate = props.delegate;

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
    }, 
    []
  ); 

  useEffect(
    () => {
      if (pickedItems.length > 0 && props.task.resetResponses) {
        setTimeout(reset.bind(this), 1000);
      }
    }
  );

  const reset = () => {
    setPickedItems([]);
  }

  const checkAnswer = () => {
    if (props.task.correctResponses === undefined || props.task.correctResponses.length === 0) {
      return "notApplicable";
    }

    for (var i = 0; i < props.task.correctResponses.length; i++) {
        if (!pickedItems.includes(props.task.correctResponses[i])) {
          return "incorrect";
        }
    }
    return "correct";
  }

  const onButtonPressed = (response, event) => {
    event.targett
    if (props.task.singleChoice) { //single choice
      if (pickedItems.length === 1) {
        if(pickedItems[0] === response){
          setPickedItems([]);
        } else{
          setPickedItems([response]);
        }
      } else{
        setPickedItems([response]);
      }
    }    
    else { //multiple choice
      if(pickedItems.includes(response)){
        const temp = pickedItems.filter(answer => answer!=response);
        setPickedItems(temp);
      } else{
        const temp = pickedItems.concat(response);
        setPickedItems(temp);
      }   
      
    }

    if (props.task.resetResponses) { //buttons with this feature are authorized to log their own data
      var lineOfData = JSON.parse(JSON.stringify(delegate));
      lineOfData.timeToCompletion = playerUtils.getCurrentTime() - lineOfData.startTimestamp;
      lineOfData.responses = [response]; //Was wrapped in []
      lineOfData.correctlyAnswered = checkAnswer();
      lineOfData.componentType = props.task.objType;

      db_helper.addNewLineToParticipantDB(store.getState().experimentInfo.participantId, JSON.stringify(lineOfData));
      mqtt.broadcastEvents(playerUtils.stringifyMessage(store,
                                                        {_id:lineOfData.taskId},
                                                        lineOfData,
                                                        "RESETANSWER",
                                                        progressCount, -1));
      // forceUpdate();
    }
    else { //normal buttons behaviour
      var answerObj = {
        responses: pickedItems,  //Was wrapped in []
        correctlyAnswered: checkAnswer(),
        //taskID: props.task._id, //TODO This is undefined, might be legacy from earlier version where we did not have task components. Remove after confirming
        mapID: props.mapID,
        //componentType: props.task.objType
      }
      props.answerCallback(answerObj);
    }
  }

//  <span style={{display:'flex', justifyContent: 'space-between'}}>
//  <span>left</span>test<span>right thisiasidiasjdasjdajsdjsad ja</span>
//  </span>
//whiteSpace:"pre-wrap"
    let theme=props.theme;
      return (
      <div className={props.className}>
        <div>
          <Typography ref={textRef} variant="h3" color="textPrimary" align="center" style={{whiteSpace:"pre-line"}}>{props.task.displayText}</Typography>
        </div>

        <div className="responsesButtons" style={{whiteSpace:"pre-wrap"}}>
          {
            props.task.responses.map((item, index)=>{
              if (item.includes("//")){ 
                item = item.replace(/\/\//g, "");  // Remove leading slashes
                item = item.replace(/\\n/g, "\n"); // insert new-line characters
                return(<Typography variant="h5" style={{display: 'inline-block', padding: '5px', whiteSpace: 'pre-wrap'}} ref={textRef} color="textPrimary" align="center">{item}</Typography>)
              } else if (item === "\\n") { //line break
                return(<br></br>);                
              } else { //render as buttons
                let buttonStyle = null //styling for the items in/out of pickedItems
                if (pickedItems.includes(item)) { // if this item has been chosen
                  buttonStyle = {backgroundColor: '#33ccff'};
                }                
                return (
                  <span className="inputButton" key={index}>
                  <Button  
                  variant="contained" 
                  onClick={(event) => onButtonPressed(item, event)}
                  style={buttonStyle}>
                    {item}                  
                  </Button>
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

export default withTheme(buttonComponent);
