import React, { useState, useEffect } from 'react'
import { Typography } from '@material-ui/core'
import { withTheme } from '@material-ui/styles'
import RunSet from './Views/RunSet/runSet'
import PauseDialog from './PauseDialog'
import mqtt from '../../core/mqtt'
import eventStore from '../../core/eventStore'
import store from '../../core/store'
import db_helper from '../../core/db_helper'
import * as dbObjects from '../../core/db_objects'
import * as playerUtils from '../../core/player_utility_functions'
import { SESSION_START, SESSION_END } from '../../SynquesticonStateConstants'
import queryString from 'query-string'
import './Play.css'
import '../../core/utility.css'

const play = props => {
  const [isPaused, setIsPaused] = useState(false)
  const [taskSet, setTaskSet] = useState(null)

  let gazeDataArray = []
  const frameDiv = React.createRef()
  const cursorRadius = 20
  let timer = null

  useEffect(() => {
    let layoutAction = {
      type: 'SET_SHOW_HEADER',
      showHeader: false,
      showFooter: false
    }

    store.dispatch(layoutAction)

    let parsed = queryString.parse(props.location.search)
    let participantID = parsed.pid
    let mainTaskSetId = parsed.id
    let tracker = parsed.tracker

    if (mainTaskSetId === undefined) {
      return
    }

    if (participantID) {
      let participantAction = {
        type: 'SET_PARTICIPANT_ID',
        participantId: participantID
      }
      store.dispatch(participantAction)
    }

    db_helper.getTasksOrTaskSetsWithIDs(mainTaskSetId, (dbQueryResult, count, mainTaskSetName) => {
      setTaskSet(dbQueryResult)
      //Force preload all images
      if (dbQueryResult.data) {
        playerUtils.getAllImagePaths(dbQueryResult.data).forEach((picture) => {
          const img = document.createElement('img')
          img.src = picture
        })
      }

      //If the participantID is undefined we create a participant and add it to the experiment
      if (store.getState().experimentInfo.participantId === undefined) {
        db_helper.addParticipantToDb(new dbObjects.ParticipantObject(dbQueryResult._id),
          (returnedIdFromDB) => {
            let action = {
              type: 'SET_EXPERIMENT_INFO',
              experimentInfo: {
                participantLabel: playerUtils.getDeviceName(),
                participantId: returnedIdFromDB,
                shouldSave: true,
                startTimestamp: playerUtils.getFormattedCurrentTime(),
                mainTaskSetId: mainTaskSetName,
                taskSet: dbQueryResult,
                taskSetCount: count,
                selectedTracker: tracker,
              }
            }
            store.dispatch(action)

            mqtt.broadcastEvents(JSON.stringify({
              eventType: SESSION_START,
              participantId: returnedIdFromDB,
              participantLabel: playerUtils.getDeviceName(),
              sessionName: mainTaskSetName,
              sessionStartTime: playerUtils.getFormattedCurrentTime(),
              isPaused: isPaused
            }))

            
          })
      } else {
        let action = {
          type: 'SET_EXPERIMENT_INFO',
          experimentInfo: {
            participantLabel: playerUtils.getDeviceName(),
            participantId: store.getState().experimentInfo.participantId,
            shouldSave: true,
            startTimestamp: playerUtils.getFormattedCurrentTime(),
            mainTaskSetId: mainTaskSetName,
            taskSet: dbQueryResult,
            taskSetCount: count,
            selectedTracker: tracker,
          }
        }
        store.dispatch(action)

        mqtt.broadcastEvents(JSON.stringify({
          eventType: SESSION_START,
          participantId: store.getState().experimentInfo.participantId,
          participantLabel: playerUtils.getDeviceName(),
          sessionName: mainTaskSetName,
          sessionStartTime: playerUtils.getFormattedCurrentTime(),
          isPaused: isPaused
        }))
      }
    })
    eventStore.addNewCommandListener(onNewCommandEvent)

    
  

    if (store.getState().experimentInfo && (store.getState().experimentInfo.selectedTracker !== "")) {
      gazeDataArray = []
      timer = setInterval(() => updateCursorLocation, 4) //Update the gaze cursor location every 4ms
    }

    return () => {
      if (store.getState().experimentInfo.selectedTracker !== "") {
        clearInterval(timer)
      }

      var layoutAction = {
        type: 'SET_SHOW_HEADER',
        showHeader: true,
        showFooter: true
      }

      store.dispatch(layoutAction)
      eventStore.removeNewCommandListener(onNewCommandEvent)

      var resetExperimentAction = {
        type: 'RESET_EXPERIMENT'
      }
      store.dispatch(resetExperimentAction)
    }
  }, [])

  const saveGazeData = task => {
    if (gazeDataArray.length > 0) {
      let copiedGazeData = gazeDataArray.slice()
      gazeDataArray = []
      db_helper.saveGazeData(store.getState().experimentInfo.participantId, task, copiedGazeData)
    }
  }

  //TODO currently this is updated using an interval timer.However it would be better to only update when
  // new events occur.
  //Updates the location of the Gaze Cursor. And checks if any of the AOIs were looked at
  const updateCursorLocation = () => {
    try {
      let gazeLoc = store.getState().gazeData[store.getState().experimentInfo.selectedTracker]
      if (frameDiv) {
        var cursorX = (gazeLoc.locX * frameDiv.current.offsetWidth - cursorRadius)
        var cursorY = (gazeLoc.locY * frameDiv.current.offsetHeight - cursorRadius)

        var aois = store.getState().aois

        for (var i = 0; i < aois.length; i++) {
          var a = aois[i]
          var imageDivRect = a.imageRef.current.getBoundingClientRect()
          var polygon = []

          if (a.boundingbox.length > 0) {
            for (let boundingbox of a.boundingbox) {
              var x = boundingbox[0] * imageDivRect.width / 100 + imageDivRect.x
              var y = boundingbox[1] * imageDivRect.height / 100 + imageDivRect.y
              polygon.push([x, y])
            }
          }
          else {
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

        //var timestamp = playerUtils.getCurrentTime()
        if (!gazeDataArray.includes(gazeLoc)) {
          gazeDataArray.push(gazeLoc)
        }
      }
    } catch (err) {
    }
  }


  const onNewCommandEvent = () => {
    var args = JSON.parse(eventStore.getCurrentCommand())
    var shouldProcess = false

    if (args.participantId === -1 || args.participantId === store.getState().experimentInfo.participantId) {
      shouldProcess = true
    }

    if (shouldProcess) {
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

  const onFinished = () => {
    let eventObject = {
      eventType: SESSION_END,
      participantId: store.getState().experimentInfo.participantId,
      sessionName: store.getState().experimentInfo.mainTaskSetId,
    }
    console.log(eventObject)
    mqtt.broadcastEvents(JSON.stringify(eventObject))
    props.history.goBack()
  }

  if (taskSet !== null) {
    let theme = props.theme
    let rightBG = theme.palette.type === "light" ? theme.palette.primary.main : theme.palette.primary.dark
    var renderObj =
      <RunSet
        familyTree={[store.getState().experimentInfo.mainTaskSetId]}
        set={taskSet}
        onFinished={onFinished}
        saveGazeData={saveGazeData}
      />
    return <div style={{ backgroundColor: rightBG }} className="page" ref={frameDiv}>
      {renderObj}
      <PauseDialog openDialog={isPaused} pauseMessage="Task paused." />
    </div>
  }
  return <Typography variant="h2" color="textPrimary" style={{ position: 'absolute', left: '50%', top: '50%' }}>Loading...</Typography>
}

export default withTheme(play)