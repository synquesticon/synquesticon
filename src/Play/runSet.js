import React, { useState, useEffect } from 'react'
import mqtt from '../core/mqtt'
import ShowTask from './ShowTask'
import RunSet from './runSet'
import eventStore from '../core/eventStore'
import store from '../core/store'
import * as dbObjects from '../core/db_objects'
import uuid from 'react-uuid'

const runSet = props => {
  const getTask = taskSet => {
    let selectedTask = taskSet.splice(0, 1)
    return ([selectedTask[0], taskSet])
  }

  const [task, setTask] = useState(() => getTask(props.set.data))

  useEffect(() => {
    eventStore.addControlMsgListener(onControlMsg)
    return () => eventStore.removeControlMsgListener(onControlMsg)
  }, [])

  const onControlMsg = payload => {
    if (payload.type === 'nextTask' && payload.setID === props.set._id) 
      startNextTask(payload.set)
  }

  const startNextTask = (taskSet = task[1]) => {
    if (taskSet.length > 0) 
      setTask(getTask(taskSet))
    else
      props.onFinished()
  }

  const nextPressed = (setID, set) => {
    console.log("mqtt nextTask")
    mqtt.broadcastMultipleScreen(JSON.stringify({
      type: "nextTask",
      setID: setID,
      set: set,
      deviceID: window.localStorage.getItem('deviceID'),
      screenID: store.getState().screenID
    }))
  }



  if (task[0].objType === dbObjects.ObjectTypes.SET) {
    let familyTree = props.familyTree.slice()
    familyTree.push(task[0].name)
    return <RunSet
      key={uuid()}
      familyTree={familyTree}
      set={task[0]}
      parentID={props.set._id}
      onFinished={startNextTask}
      commandCallback={ (commandObj) => props.commandCallback(commandObj)} 
    />
  } else {
    return <div className="page" key={uuid()}>
      <div className="mainDisplay">
        <ShowTask key={uuid()}
          setID={props.set._id}
          familyTree={props.familyTree}
          task={task[0]}
          set={task[1]}
          parentSet={props.familyTree[props.familyTree.length - 1]}
          renderKey={task._id + "_" + task}
          nextPressed={nextPressed}
          commandCallback={ (commandObj) => props.commandCallback(commandObj)} 
        />
      </div>
    </div>
  }
}

export default runSet