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
    let selectedTask = taskSet.splice(0, 1)
    return ([selectedTask[0], taskSet])
  }

  const [task, setTask] = useState(() => getTask(props.taskSet.data))

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
      screenID: store.getState().screenID
    }))
  }

  const onControlMsg = payload => {
    if (payload.type === 'nextTask' && payload.setID === props.taskSet._id) {
      startNextTask()
    }
  }

  const startNextTask = () => {
    if (task[1].length > 0) {
      let currentArray = task[1]
      let currentTask = currentArray.splice(0, 1)
      setTask([currentTask[0], currentArray])
    } else {
      props.onFinished()
      return null
    }
  }

  let familyTree = props.familyTree.slice()
  familyTree.push(task[0].name)

  if (task[0].objType === dbObjects.ObjectTypes.SET) {
    return <RunSet
      key={uuid()}
      familyTree={familyTree}
      taskSet={task[0]}
      parentID={props.taskSet._id}
      onFinished={startNextTask}
    />
  } else {
    return (
      <div className="page" key={uuid()}>
        <div className="mainDisplay">
          <ShowTask key={uuid()}
            setID={props.taskSet._id}
            familyTree={props.familyTree}
            task={task[0]}
            parentSet={props.familyTree[props.familyTree.length - 1]}
            renderKey={task._id + "_" + task}
            nextPressed={nextPressed} />
        </div>
      </div>
    )
  }
}

export default runSet