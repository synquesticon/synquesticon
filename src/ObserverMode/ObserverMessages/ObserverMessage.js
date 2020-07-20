import React from 'react';

import Button from '@material-ui/core/Button';
import CommentIcon from '@material-ui/icons/ModeCommentOutlined';
import { Typography } from '@material-ui/core';
import { withTheme } from '@material-ui/styles';

import * as playerUtils from '../../core/player_utility_functions';

import './ObserverMessage.css';

class ObserverMessage extends React.Component {
  constructor(props) {
    super(props);
    this.showCommentButton = true;
    this.marginTop = false;
  }

  convertHMS(milliseconds) {
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

  parseMessage(args) {
    var redColor = "#E94B3C";
    var greenColor = "#006B38";
    this.marginTop = false;

    var displayText = null;
    var timeToCompletion = 0;

    switch (args.eventType) {
      case "NEW EXPERIMENT":
        /*
        ["NEW EXPERIMENT",
                    store.getState().experimentInfo.participantId,
                    store.getState().experimentInfo.startTimestamp,
                    store.getState().experimentInfo.selectedTracker,
                    store.getState().experimentInfo.mainTaskSetId,
                    timestamp]
        */

        displayText = <Typography display="inline" variant="body1" color="textPrimary">
                        <b>New experiment - Task set: </b>
                        <i>{args.mainTaskSetId} </i>
                        started at {playerUtils.getFormattedTime(args.startTimestamp)}
                      </Typography>
        this.showCommentButton = false;
        break;
      case "START":
        displayText = <Typography display="inline" variant="body1" color="textPrimary">
                          <b>{args.taskIndex}. </b>
                          <b>{args.lineOfData.taskContent} </b>
                      </Typography>
        this.marginTop = true;
        this.showCommentButton = true;
        break;
      case "ANSWERED":
       /*
       ["ANSWERED",
                   store.getState().experimentInfo.participantId,
                   store.getState().experimentInfo.startTimestamp,
                   store.getState().experimentInfo.selectedTracker,
                   obj.firstResponseTimestamp,
                   obj.timeToFirstAnswer,
                   obj.timeToCompletion,
                   obj.responses,
                   obj.correctlyAnswered,
                   obj.aoiCheckedList];
       */
        var responses = args.lineOfData.responses.join(', ');
        timeToCompletion = args.lineOfData.timeToCompletion < 0 ? 0 : this.convertHMS(args.lineOfData.timeToCompletion);
        var timeToFirstAnswer = args.lineOfData.timeToFirstAnswer < 0 ? 0 : this.convertHMS(args.lineOfData.timeToFirstAnswer);
        var color = this.props.theme.palette.textPrimary;
        if (args.lineOfData.correctlyAnswered === "correct") {
          color = greenColor;
        }
        else if (args.lineOfData.correctlyAnswered === "incorrect") {
          color = redColor;
        }
        displayText = <Typography display="inline" variant="body1" color="textPrimary">
                      <font color={color}>"{responses}"</font> ({timeToFirstAnswer} /{timeToCompletion})
                      </Typography>;

        /*var aoisList = "";
        args.lineOfData.aoiCheckedList.map((item, index) => {
          aoisList += "\t" + item["name"] + ":" + (item["checked"] !== undefined ? "checked" : "unchecked");
        });
        //displayText += aoisList;*/
        //
        this.showCommentButton = false;
        break;
      
      case "RESETANSWER":
        var timeToCompletion = this.convertHMS(args.lineOfData.timeToCompletion);
        var responses = args.lineOfData.responses.join(', ');
        displayText = <Typography display="inline" variant="body1" color="textPrimary">
                      <font color={color}>"{responses}"</font> {timeToCompletion}
                      </Typography>;
        this.showCommentButton = false;
        break;
      
      case "SKIPPED":
      /*
      "SKIPPED",
                  store.getState().experimentInfo.participantId,
                  store.getState().experimentInfo.startTimestamp,
                  store.getState().experimentInfo.selectedTracker,
                  obj.timeToCompletion
      */
        timeToCompletion = args.lineOfData.timeToCompletion < 0 ? 0 : this.convertHMS(args.lineOfData.timeToCompletion);
        displayText = <Typography variant="body1" color="textPrimary">
                        <font color={redColor}>Skipped </font> (NA / {timeToCompletion}s)
                      </Typography>;
        this.showCommentButton = false;
        break;
      case "FINISHED":
      /*
      "FINISHED",
                  store.getState().experimentInfo.participantId,
                  store.getState().experimentInfo.startTimestamp,
                  store.getState().experimentInfo.selectedTracker,
                  store.getState().experimentInfo.mainTaskSetId,
                  timestamp
      */
        displayText = <Typography display="inline" variant="body1" color="textPrimary">
                        <b>Experiment finished! </b>
                      </Typography>;
        this.showCommentButton = false;
        this.marginTop = true;
        break;
      case "COMMENT":
        //var commentTime = new Date(args.timestamp);
        displayText = <Typography display="inline" variant="body1" color="textPrimary">
                        <b>Comment from {args.observerName}: </b>
                        {args.comment}
                      </Typography>;
        this.showCommentButton = false;
        break;
      default:
        break;
    }
    return displayText;
  }

  onCommentButtonClicked() {
    this.props.commentCallback(this.props.message);
  }

  render() {
    var message = this.parseMessage(this.props.message);

    var commentButton = this.showCommentButton ? <Button style={{display:'flex', position: 'relative', flexGrow: 0, flexShrink:0, height:25, width:25, maxWidth:25}}
                                                onClick={this.onCommentButtonClicked.bind(this)} >
                                                <CommentIcon className="flippedCommentIcon" style={{display:'flex', position: 'absolute', height: '100%', width: '100%'}} />
                                               </Button> : null;
    return (
      <div style={{display:'flex', position: 'relative', flexDirection:'row', flexGrow: 1, flexShrink:1, minWidth:10, marginTop:this.marginTop?20:0}}>
        <div style={{display:'flex', position: 'relative', flexGrow: 1, flexShrink:1, minWidth:10, height:'100%'}}>
          {message}
        </div>
        {commentButton}
      </div>
      );
  }
}

export default withTheme(ObserverMessage);
