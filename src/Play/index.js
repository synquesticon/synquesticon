import React, { useState, useEffect } from 'react'
import { Typography } from '@material-ui/core'
import { withTheme } from '@material-ui/styles'
import eventStore from '../core/eventStore'
import store from '../core/store'
import db_helper from '../core/db_helper'
import * as dbObjects from '../core/db_objects'
import * as playerUtils from '../core/player_utility_functions'
import queryString from 'query-string'
import RunSet from './runSet'
import PauseDialog from './PauseDialog'
import '../core/utility.css'
import './css/Play.css'

const Play = props => {
  const [isPaused, setIsPaused] = useState(false)
  const [taskSet, setTaskSet] = useState(null)

  let gazeDataArray = []
  const frameDiv = React.createRef()
  const cursorRadius = 20
  let timer = null

  useEffect(() => {
    store.dispatch({
      type: 'SET_SHOW_HEADER',
      showHeader: false,
      showFooter: false
    })

    let parsed = queryString.parse(props.location.search)
    let participantID = parsed.pid
    let mainTaskSetId = parsed.id
    let tracker = parsed.tracker

    if (mainTaskSetId === undefined) return

    if (participantID)
      store.dispatch({
        type: 'SET_PARTICIPANT_ID',
        participantId: participantID
      })

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
                selectedTracker: tracker,
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
            selectedTracker: tracker,
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
    let shouldProcess = false

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

  if (taskSet !== null) {
    eventStore.addNewCommandListener(onNewCommandEvent)
    let rightBG = props.theme.palette.type === "light" ? props.theme.palette.primary.main : props.theme.palette.primary.dark

    return <div style={{ backgroundColor: rightBG }} className="page" ref={frameDiv}>
      {<RunSet
        familyTree={[store.getState().experimentInfo.mainTaskSetId]}
        set={taskSet}
        onFinished={props.history.goBack}
        saveGazeData={saveGazeData}
      />}
      <PauseDialog openDialog={isPaused} pauseMessage="Task paused." />
    </div>
  }
  return <Typography variant="h2" color="textPrimary" style={{ position: 'absolute', left: '50%', top: '50%' }}>Loading...</Typography>
}

export default withTheme(Play)