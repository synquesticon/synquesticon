import React, { useState, useEffect } from 'react'
import { withTheme } from '@material-ui/styles'
import { Typography } from '@material-ui/core'
import store from '../core/store'
import db_helper from '../core/db_helper.js'
import eventStore from '../core/eventStore'
import mqtt from '../core/mqtt'
import * as db_objects from '../core/db_objects.js'
import { AppModes } from '../core/sharedObjects'
import './PlayMode.css'
import PlayableSet from './PlayableSet/PlayableSet'
import * as listUtils from '../core/db_objects_utility_functions'

const PlayMode = props => {
  const [taskSets, setTaskSets] = useState([])
  let selectedTaskSet = null

  useEffect(() => {
    //save data into DB before closing
    db_helper.queryTasksFromDb(db_objects.ObjectTypes.SET, ["experiment"], "OR", dbTaskSetCallback)
    eventStore.addControlMsgListener(onControlMsg)
    return () => {
      eventStore.removeControlMsgListener(onControlMsg)
    }
  }, [])

  //query all tasksets with experiment tag
  const dbTaskSetCallback = (queryTasks, data) => {
    setTaskSets(data.tasks)
  }

  const appendEyeTrackerInfo = url => {
    let storeState = store.getState()
    if (storeState.selectedEyeTracker !== "" && storeState.selectedEyeTracker !== undefined) {
      url = url + '&tracker=' + storeState.selectedEyeTracker
    }
    return url
  }

  const appendParticipantID = async (url) => {
    let result = await db_helper.addParticipantToDbSync(new db_objects.ParticipantObject(selectedTaskSet._id)).then(
      function (v) { return { v: v, status: "fulfilled" } },
      function (e) { return { e: e, status: "rejected" } }
    )

    if (result.status === "fulfilled") {
      url += '&pid=' + result.v.data._id
    } else {
      console.log("Unable to create participantID: ", result.e)
    }
    return url
  }

  const onEditButtonClick = taskSet => {
    const setEditSetAction = {
      type: 'SET_SHOULD_EDIT',
      shouldEdit: true,
      objectToEdit: taskSet,
      typeToEdit: 'set'
    }
    store.dispatch(setEditSetAction)
    props.history.push("/" + AppModes.EDIT)
  }

  const onPlayButtonClick = (taskSet, emitterTriggered) => {
    selectedTaskSet = taskSet

    if (emitterTriggered === undefined && store.getState().multipleScreens) {
      db_helper.addParticipantToDb(new db_objects.ParticipantObject(taskSet._id), (dbID) => {
        const idAction = {
          type: 'SET_PARTICIPANT_ID',
          participantId: dbID
        }
        store.dispatch(idAction)

        mqtt.broadcastMultipleScreen(JSON.stringify({
          type: "StartExperiment",
          taskSet: taskSet,
          deviceID: window.localStorage.getItem('deviceID'),
          screenID: store.getState().screenID,
          participantID: dbID
        }))

        let url = '/study?id=' + selectedTaskSet._id;
        url = appendEyeTrackerInfo(url)
        props.history.push(url)
      })
    } else {
      let url = '/study?id=' + selectedTaskSet._id
      url = appendEyeTrackerInfo(url)
      props.history.push(url)
    }
  }

  const onGetLinkCallback = (taskSet) => {
    selectedTaskSet = taskSet;
    copyToClipboard();
  }

  const copyToClipboard = async () => {
    let url = window.location.href + 'study?id='
    if (selectedTaskSet) {
      url += selectedTaskSet._id
      url = appendEyeTrackerInfo(url)
      url = await appendParticipantID(url)
    }
    navigator.clipboard.writeText(url)

    const snackbarAction = {
      type: 'TOAST_SNACKBAR_MESSAGE',
      snackbarOpen: true,
      snackbarMessage: "Link copied to clipboard"
    }
    store.dispatch(snackbarAction)
  }

  const onControlMsg = payload => {
    console.log(payload);
    //Was checking if multipe screen. With the new change we should just check for same device ID instead
    if (window.localStorage.getItem('deviceID') === payload.deviceID && payload.type === 'StartExperiment') {
      //if(store.getState().multipleScreens && payload.type === 'StartExperiment'){
      let idAction = {
        type: 'SET_PARTICIPANT_ID',
        participantId: payload.participantID
      }
      store.dispatch(idAction)
      onPlayButtonClick(payload.taskSet, true)
    }
  }

  let theme = props.theme
  let viewerBG = theme.palette.type === "light" ? theme.palette.primary.main : theme.palette.primary.dark

  let playableSetList = (
    taskSets.map((taskSet, index) => {
      const content = listUtils.getTaskContent(taskSet);
      return (
        <div key={index}>
          <PlayableSet
            task={taskSet}
            runSetCallback={onPlayButtonClick}
            getLinkCallback={onGetLinkCallback}
            editSetCallback={onEditButtonClick}
            content={content}
            showEditButton={true}>

          </PlayableSet>
        </div>
      )
    })
  )

  return (
    <div className="introductionScreenContainer">
      <div className="experimentsHeader" style={{ backgroundColor: viewerBG }}>
        <Typography style={{ marginLeft: 20, marginTop: 20 }} variant="h4" color="textPrimary">
          Experiments
        </Typography>
      </div>
      <div style={{ backgroundColor: viewerBG }} className="IntroViewer">
        <div className="PlayerViewerContent">
          <div className="TaskSetContainer">
            {playableSetList}
          </div>
        </div>
      </div>
    </div>
  )
}

export default withTheme(PlayMode)