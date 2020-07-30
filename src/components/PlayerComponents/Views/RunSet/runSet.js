import React, { useState, useEffect } from 'react'
import mqtt from '../../../../core/mqtt'
import ShowTask from '../ShowTask'
import RunSet from './runSet'
import eventStore from '../../../../core/eventStore'
import store from '../../../../core/store'
import * as dbObjects from '../../../../core/db_objects'

const runSet = props => {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
  let currentTask = null

  useEffect(() => {    
    setCurrentTaskIndex(0)
    eventStore.addControlMsgListener(onControlMsg)
    return () => { //clean up when component gets unmounted
      eventStore.removeControlMsgListener(onControlMsg)
    }
  }, [])

  const nextPressed = setID => {
    mqtt.broadcastMultipleScreen(JSON.stringify({
      type: "nextTask",
      setID: setID,
      deviceID: window.localStorage.getItem('deviceID'),
      screenID: store.getState().screenID,
      randomSeed: Math.random(),
      nextIndex: currentTaskIndex + 1
    }))
  }

  const onControlMsg = payload => {
    if (payload.type === 'nextTask' && payload.setID === props.taskSet._id) { 
      startNextTask(payload.nextIndex)
    }      
  }

  const startNextTask = nextIndex => {
    setCurrentTaskIndex(prevCount => prevCount + 1) 
  }

  if (!(props.taskSet.data.length > 0 && currentTaskIndex >= props.taskSet.data.length)) {
    currentTask = props.taskSet.data[currentTaskIndex]

    let trackingTaskSetNames = props.familyTree.slice() //clone array, since javascript passes by reference, we need to keep the orginal familyTree untouched
    trackingTaskSetNames.push(currentTask.name)

    const parentSet = props.familyTree[props.familyTree.length - 1]

    if (currentTask.objType === dbObjects.ObjectTypes.SET) {
      return <RunSet key={currentTask._id + "_" + currentTaskIndex}
        familyTree={trackingTaskSetNames}
        taskSet={currentTask}
        onFinished={startNextTask}
      />
    } else { 
      return (
        <div className="page" key={currentTask._id + "_" + currentTaskIndex}>
          <div className="mainDisplay">
            <ShowTask key={currentTask._id + "_" + currentTaskIndex}
              setID={props.taskSet._id}
              familyTree={props.familyTree}
              task={currentTask}
              parentSet={parentSet}
              renderKey={currentTask._id + "_" + currentTaskIndex} 
              nextPressed = {nextPressed}/>
          </div>
        </div>
      )
    }
  } else {
    props.onFinished()
    return null
  }
}

export default runSet