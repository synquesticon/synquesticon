import React, { useState, useEffect } from 'react'
import { Typography } from '@material-ui/core'
import { withTheme } from '@material-ui/styles'
import eventStore from '../core/eventStore'
import store from '../core/store'
import mqtt from '../core/mqtt'
import db_helper from '../core/db_helper'
import * as dbObjects from '../core/db_objects'
import * as playerUtils from '../core/player_utility_functions'
import queryString from 'query-string'
import RunSet from './runSet'
import PauseDialog from './PauseDialog'
import uuid from 'react-uuid'
import '../core/utility.css'
import './css/Play.css'

const Play = props => {
  const [isPaused, setIsPaused] = useState(false)
  const [taskSet, setTaskSet] = useState(null)

  const frameDiv = React.createRef()
  const cursorRadius = 20
  let gazeDataArray = []
  let timer = null

  useEffect(() => {
    store.dispatch({
      type: 'SET_SHOW_HEADER',
      showHeader: false,
      showFooter: false
    })

    let parsed = queryString.parse(props.location.search)

    if (parsed.id === undefined) return

    if (parsed.pid)
      store.dispatch({
        type: 'SET_PARTICIPANT_ID',
        participantId: parsed.pid
      })

    db_helper.getTasksOrTaskSetsWithIDs(parsed.id, (dbQueryResult, count, mainTaskSetName) => {
      setTaskSet(dbQueryResult)
      if (dbQueryResult.data)      //Force preload all images
        playerUtils.getAllImagePaths(dbQueryResult.data).forEach(picture => {
          const img = document.createElement('img')
          img.src = picture
        })

      if (store.getState().experimentInfo.participantId === undefined) {         //If the participantID is undefined we create a participant and add it to the experiment
        db_helper.addParticipantToDb(new dbObjects.ParticipantObject(dbQueryResult._id),
          returnedIdFromDB => {
            store.dispatch({
              type: 'SET_EXPERIMENT_INFO',
              experimentInfo: {
                participantLabel: playerUtils.getDeviceName(),
                participantId: returnedIdFromDB,
                shouldSave: true,
                startTimestamp: playerUtils.getCurrentTime(),
                mainTaskSetId: mainTaskSetName,
                taskSet: dbQueryResult,
                taskSetCount: count,
                selectedTracker: parsed.tracker,
              }
            })
          })
      } else {
        store.dispatch({
          type: 'SET_EXPERIMENT_INFO',
          experimentInfo: {
            participantLabel: playerUtils.getDeviceName(),
            participantId: store.getState().experimentInfo.participantId,
            shouldSave: true,
            startTimestamp: playerUtils.getCurrentTime(),
            mainTaskSetId: mainTaskSetName,
            taskSet: dbQueryResult,
            taskSetCount: count,
            selectedTracker: parsed.tracker,
          }
        })
      }
    })

    if (store.getState().experimentInfo && (store.getState().experimentInfo.selectedTracker !== "")) {
      gazeDataArray = []
      timer = setInterval(() => updateCursorLocation, 4) //Update the gaze cursor location every 4ms
    }

    return () => {
      if (store.getState().experimentInfo.selectedTracker !== "")
        clearInterval(timer)

      store.dispatch({
        type: 'SET_SHOW_HEADER',
        showHeader: true,
        showFooter: true
      })
      eventStore.removeNewCommandListener(onNewCommandEvent)
      window.removeEventListener('devicemotion', handleDeviceMotionEvent)
    }
  }, [])

  const saveGazeData = task => {
    if (gazeDataArray.length > 0) {
      let copiedGazeData = gazeDataArray.slice()
      gazeDataArray = []
      db_helper.saveGazeData(store.getState().experimentInfo.participantId, task, copiedGazeData)
    }
  }

  //TODO currently this is updated using an interval timer.However it would be better to only update when new events occur.
  //Updates the location of the Gaze Cursor. And checks if any of the AOIs were looked at
  const updateCursorLocation = () => {
    try {
      let gazeLoc = store.getState().gazeData[store.getState().experimentInfo.selectedTracker]
      if (frameDiv) {
        const cursorX = (gazeLoc.locX * frameDiv.current.offsetWidth - cursorRadius)
        const cursorY = (gazeLoc.locY * frameDiv.current.offsetHeight - cursorRadius)
        const aois = store.getState().aois

        for (var i = 0; i < aois.length; i++) {
          const a = aois[i]
          const imageDivRect = a.imageRef.current.getBoundingClientRect()
          let polygon = []

          if (a.boundingbox.length > 0) {
            for (let boundingbox of a.boundingbox) {
              var x = boundingbox[0] * imageDivRect.width / 100 + imageDivRect.x
              var y = boundingbox[1] * imageDivRect.height / 100 + imageDivRect.y
              polygon.push([x, y])
            }
          } else {
            polygon.push([imageDivRect.x, imageDivRect.y])
            polygon.push([imageDivRect.x + imageDivRect.width, imageDivRect.y])
            polygon.push([imageDivRect.x + imageDivRect.width, imageDivRect.y + imageDivRect.height])
            polygon.push([imageDivRect.x, imageDivRect.y + imageDivRect.height])
          }
          if (playerUtils.pointIsInPoly([cursorX, cursorY], polygon)) {
            gazeLoc.target = a
            break
          }
        }

        if (!gazeDataArray.includes(gazeLoc)) gazeDataArray.push(gazeLoc)
      }
    } catch (err) {
    }
  }

  const onNewCommandEvent = () => {
    let args = JSON.parse(eventStore.getCurrentCommand())
    if (args.participantId === -1 || args.participantId === store.getState().experimentInfo.participantId) {
      switch (args.commandType) {
        case "PAUSE":
          setIsPaused(true)
          break
        case "RESUME":
          setIsPaused(false)
          break
        default:
          break
      }
    }
  }

  let count = 0
  const motionObj = {
    user: { uid: uuid() },
    timestamp: 0,
    count: count,
    position: {},
    rotation: {},
    tag: ''
  }

  const commandCallback = commandObj => {
    commandObj.command.forEach(command => {
      command = command.split('=')
      command[1] = command[1] ? command[1] : commandObj.content
      switch (command[0]) {
        case "recordMotion":
          commandObj.isClicked
            ? window.addEventListener('devicemotion', handleDeviceMotionEvent)
            : window.removeEventListener('devicemotion', handleDeviceMotionEvent)
          break
          case "tag":
            motionObj.tag = commandObj.isClicked ? command[1] : null
            break
        case "mqtt":
          if (commandObj.isClicked) {
            const msgArray = command[1].split(';;')
            msgArray.forEach( msg => {
              msg = msg.split('@')
              mqtt.broadcastMessage(msg[0], msg[1])  // broadcastMessage(message, topic)
            })
          }
          break
        default:
      }
    })
  }

  const handleDeviceMotionEvent = e => {
    motionObj.count = count++
    motionObj.position = {
      x: e.acceleration.x,
      y: e.acceleration.y,
      z: e.acceleration.z
    }
    motionObj.rotation = {
      a: e.rotationRate.alpha,
      b: e.rotationRate.beta,
      c: e.rotationRate.gamma
    }
    motionObj.timestamp = Date.now()
    mqtt.broadcastDeviceMotion(JSON.stringify(motionObj))
  }

  if (taskSet !== null) {
    eventStore.addNewCommandListener(onNewCommandEvent)

    return <div style={{ backgroundColor: props.theme.palette.type === "light" ? props.theme.palette.primary.main : props.theme.palette.primary.dark }} className="page" ref={frameDiv}>
      {<RunSet
        familyTree={[store.getState().experimentInfo.mainTaskSetId]}
        set={taskSet}
        onFinished={props.history.goBack}
        saveGazeData={saveGazeData}
        commandCallback={(commandObj) => commandCallback(commandObj)}
      />}
      <PauseDialog openDialog={isPaused} pauseMessage="Task paused." />
    </div>
  }
  return <Typography variant="h2" color="textPrimary" style={{ position: 'absolute', left: '50%', top: '50%' }}>Loading...</Typography>
}

export default withTheme(Play)