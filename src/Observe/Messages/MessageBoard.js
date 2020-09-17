import React, { useState } from 'react'
import CommentDialog from './CommentDialog'
import ObserverMessage from './ObserverMessage'
import mqtt from '../../core/mqtt'
import db_helper from '../../core/db_helper'
import * as dbObjects from '../../core/db_objects'
import * as playerUtils from '../../core/player_utility_functions'
import { Typography } from '@material-ui/core'
import { withTheme } from '@material-ui/styles'
import './MessageBoard.css'

const MessageBoard = props => {
  const [commentDialogOpen, setCommentDialogOpen] = useState(false)
  const [pickedEvent, setPickedEvent] = useState(false)

  const onCommentPressed = evt => {
    setPickedEvent(evt)
    setCommentDialogOpen(true)
  }

  const onCloseCommentDialog = comment => {
    setCommentDialogOpen(false)
    if (comment !== "") onCommentRecieved(comment)
  }

  const onCommentRecieved = comment => {
    db_helper.addNewObserverMessageToDb(new dbObjects.ObserverMessage(window.localStorage.getItem('deviceID'),
      window.localStorage.getItem('deviceRole'),
      pickedEvent.participantId,
      pickedEvent.lineOfData.taskId,
      pickedEvent.lineOfData.startTimestamp,
      comment))

    mqtt.sendMqttMessage(
      'taskEvent',
      JSON.stringify({
        eventType: "COMMENT",
        observerName: window.localStorage.getItem('deviceID'),
        observerRole: window.localStorage.getItem('deviceRole'),
        timestamp: playerUtils.getCurrentTime(),
        participantId: pickedEvent.participantId,
        participantLabel: pickedEvent.participantLabel,
        startTimestamp: pickedEvent.startTimestamp,
        lineOfData: pickedEvent.lineOfData,
        comment: comment
      })
    )
  }

  return (
    <div className="messageBoard">
      <div className="messageBoardtitle">
        <Typography color="textPrimary" variant="h6">Messaging Log</Typography>
      </div>
      <div className="messages">
        {[...props.messages].reverse().map((item, pindex) => {
          return <ObserverMessage message={item} key={pindex} onCommentButtonPressed={onCommentPressed} />
        })}
      </div>

      <CommentDialog isOpen={commentDialogOpen} closeCommentDialog={onCloseCommentDialog} />
    </div>
  )
}

export default withTheme(MessageBoard)