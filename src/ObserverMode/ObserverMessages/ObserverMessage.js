import React from 'react';

import Button from '@material-ui/core/Button';
import CommentIcon from '@material-ui/icons/ModeCommentOutlined';
import { Typography } from '@material-ui/core';
import { withTheme } from '@material-ui/styles';

import * as playerUtils from '../../core/player_utility_functions';

import './ObserverMessage.css';

const observerMessage = (props) => {

  let showCommentButton = true;
  let marginTop = false;

  const convertHMS = (milliseconds) => {
    var sec = milliseconds/1000;
    if (sec < 60){
      return sec+' secs';
    }
    var hours   = Math.floor(sec / 3600); // get hours
    var minutes = Math.floor((sec - (hours * 3600)) / 60); // get minutes
    var seconds = sec - (hours * 3600) - (minutes * 60); //  get seconds
    // add 0 if value < 10
    if (hours === 0){
      return minutes+' mins: '+seconds+' secs'; // Return is MM : SS
    }
    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}

    return hours+' hours: '+minutes+' mins: '+seconds+' secs' // Return is HH : MM : SS
  }

  const parseMessage = (message) => {
    var redColor = "#E94B3C";
    var greenColor = "#006B38";
    marginTop = false;

    var displayText = message;
    var timeToCompletion = 0;

    // switch (message.eventType) {
    //   case constants.SESSION_START:
    //     displayText = <Typography display="inline" variant="body1" color="textPrimary">
    //                     <b>New experiment - Task set: </b>
    //                     <i>{message.sessionName} </i>
    //                     started at {playerUtils.getFormattedTime(message.sessionStartTime)}
    //                   </Typography>
    //     showCommentButton = false;
    //     break;

    //   case constants.SESSION_END:
    //     displayText = <Typography display="inline" variant="body1" color="textPrimary">
    //                     <b>Experiment {message.sessionName} finished! </b>
    //                   </Typography>;
    //     showCommentButton = false;
    //     marginTop = true;
    //     break;
      
    //   case constants.TASK_START:

    //   case constants.BUTTON_CLICK:
    //     displayText = <Typography display="inline" variant="body1" color="textPrimary">
    //                     {message.clickedContent} clicked at
    //                     <i>{message.timeClicked}</i>
    //                   </Typography>;
    //     showCommentButton = false;
    //     marginTop = true;
    //     break;

    //   // case "COMMENT":
    //   //   //var commentTime = new Date(args.timestamp);
    //   //   displayText = <Typography display="inline" variant="body1" color="textPrimary">
    //   //                   <b>Comment from {args.observerName}: </b>
    //   //                   {args.comment}
    //   //                 </Typography>;
    //   //   showCommentButton = false;
    //   //   break;
    //   default:
    //     break;
    // }
    return displayText;
  }

  var message = parseMessage(props.message);

  var commentButton = showCommentButton ? <Button style={{display:'flex', position: 'relative', flexGrow: 0, flexShrink:0, height:25, width:25, maxWidth:25}}
                                              onClick={() => props.onCommentButtonPressed(props.message)} >
                                              <CommentIcon className="flippedCommentIcon" style={{display:'flex', position: 'absolute', height: '100%', width: '100%'}} />
                                              </Button> : null;
  return (
    <div style={{display:'flex', position: 'relative', flexDirection:'row', flexGrow: 1, flexShrink:1, minWidth:10, marginTop:marginTop?20:0}}>
      <div style={{display:'flex', position: 'relative', flexGrow: 1, flexShrink:1, minWidth:10, height:'100%'}}>
        {message}
      </div>
      {commentButton}
    </div>
  );
}

export default withTheme(observerMessage);
