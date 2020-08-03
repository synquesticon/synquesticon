import React, { useState, useEffect } from 'react'
import mqtt from '../../../../core/mqtt'
import ShowTask from '../ShowTask'
import RunSet from './runSet'
import eventStore from '../../../../core/eventStore'
import store from '../../../../core/store'
import * as dbObjects from '../../../../core/db_objects'
import uuid from 'react-uuid'

const runSet = props => {
  const [taskIndex, setTaskIndex] = useState(0)
  let task = null

  useEffect(() => {    
    setTaskIndex(0)
    eventStore.addControlMsgListener(onControlMsg)
    return () => { 
      eventStore.removeControlMsgListener(onControlMsg)
    }
  }, [])

  const nextPressed = setID => {
    console.log("next please")
    mqtt.broadcastMultipleScreen(JSON.stringify({
      type: "nextTask",
      setID: setID,
      deviceID: window.localStorage.getItem('deviceID'),
      screenID: store.getState().screenID,
      nextIndex: taskIndex + 1
    }))
  }

  const onControlMsg = payload => {
    if (payload.type === 'nextTask' && payload.setID === props.taskSet._id) { 
      startNextTask(payload.nextIndex, "MQTT")
    }      
  }

  const startNextTask = (nextIndex, from) => {
    setTaskIndex(nextIndex) 
    console.log("nextIndex " + nextIndex + " -- from " + from)
  }

  if (!(props.taskSet.data.length > 0 && taskIndex >= props.taskSet.data.length)) {
    task = props.taskSet.data[taskIndex]

    let familyTree = props.familyTree.slice() //clone array, since javascript passes by reference, we need to keep the orginal familyTree untouched
    familyTree.push(task.name)

    const parentSet = props.familyTree[props.familyTree.length - 1]

    if (task.objType === dbObjects.ObjectTypes.SET) {
      return <RunSet key={task._id + "_" + taskIndex}
        familyTree={familyTree}
        taskSet={task}
        parentID={props.taskSet._id}
        lastIndex={taskIndex}
        onFinished={() => startNextTask(taskIndex+1, "SET")}
      />
    } else { 
      return (
        <div className="page" key={task._id + "_" + taskIndex}>
          <div className="mainDisplay">
            <ShowTask key={task._id + "_" + taskIndex}
              setID={props.taskSet._id}
              familyTree={props.familyTree}
              task={task}
              parentSet={parentSet}
              renderKey={task._id + "_" + taskIndex} 
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