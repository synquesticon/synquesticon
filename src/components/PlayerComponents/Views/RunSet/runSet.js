import React, { useState, useEffect } from 'react'
import mqtt from '../../../../core/mqtt'
import ShowTask from '../ShowTask'
import RunSet from './runSet'
import eventStore from '../../../../core/eventStore'
import store from '../../../../core/store'
import * as dbObjects from '../../../../core/db_objects'
import uuid from 'react-uuid'

const runSet = props => {
  const getTask = taskSet => {   
    let selectedTask = taskSet.splice(0,1)
    return([selectedTask[0], taskSet])
  }

  const [taskIndex, setTaskIndex] = useState(() => getTask(props.taskSet.data))

  useEffect(() => {
    eventStore.addControlMsgListener(onControlMsg)
    return () => { 
      eventStore.removeControlMsgListener(onControlMsg)
    }
  }, [])

  const nextPressed = setID => {
    mqtt.broadcastMultipleScreen(JSON.stringify({
      type: "nextTask",
      setID: setID,
      deviceID: window.localStorage.getItem('deviceID'),
      screenID: store.getState().screenID,
      index: taskIndex
    }))
  }

  const onControlMsg = payload => {
    if (payload.type === 'nextTask' && payload.setID === props.taskSet._id) { 
      startNextTask()
    }      
  }

  const startNextTask = () => {
    if (taskIndex[1].length > 0) {
      let currentArray = taskIndex[1]
      let currentTask = currentArray.splice(0,1)
      setTaskIndex([currentTask[0], currentArray])
    } else {
      props.onFinished()
      return null
    }
  }
  
  if ( taskIndex[1].length >= 0) {
    console.log("taskSet LENGTH " + props.taskSet.data.length)
    let task = taskIndex[0]

    let familyTree = props.familyTree.slice() 
    familyTree.push(task.name)

    if (task.objType === dbObjects.ObjectTypes.SET) {
      console.log("RENDER SET")
      return <RunSet
        key={uuid()}
        familyTree={familyTree}
        taskSet={task}
        parentID={props.taskSet._id}
        onFinished={startNextTask}
      />
    } else { 
      console.log("RENDER TASK")
      return (
        <div className="page" key={uuid()}>
          <div className="mainDisplay">
            <ShowTask key={uuid()}
              setID={props.taskSet._id}
              familyTree={props.familyTree}
              task={task}
              parentSet={props.familyTree[props.familyTree.length - 1]}
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