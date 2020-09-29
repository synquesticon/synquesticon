import React, { useState, useEffect, useRef } from 'react'
import db_helper from '../../core/db_helper'
import * as db_utils from '../../core/db_objects_utility_functions'
import * as dbObjects from '../../core/db_objects'
import store from '../../core/store'
import eventStore from '../../core/eventStore'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import Checkbox from '@material-ui/core/Checkbox'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import EditSetList from './SetList'
import { Droppable } from 'react-beautiful-dnd'
import './Set.css'

const EditSet = props => {
  //If we got a taskObject passed as a prop we use it, otherwise we init with a default constructed object
  //Clone the array via JSON. Otherwise we would operate directly on the original objects which we do not want
  const set = useRef( props.isEditing
    ? JSON.parse(JSON.stringify(props.setObject))
    : new dbObjects.SetObject()
  )

  const destinationIndex = useRef(0)           //The index where a new task will be placed

  const [taskList, setTaskList] = useState(set.current.childIds ? set.current.childIds : [])
  const [taskListObjects, setTaskListObjects] = useState([])
  const [randomizeSet, setRandomizeSet] = useState(set.current.setTaskOrder === "Random" ? true : false)

  //In a callback from outside this file we do not have access to state values. That is what this.function.bind(this)
  // was used for earlier. To retain the state context. This is a work around. This reference will have up to date state information when accessed.
  const taskListObjectRef = useRef()
  taskListObjectRef.current = taskListObjects;

  let shouldCloseAsset = false       //Used to determine if the object should be closed
  let shouldReopen = false

  useEffect(() => {
    eventStore.setTaskListener("on", addTask.bind(this));
    (taskList && taskList.length > 0)
      ? db_helper.getTasksOrSetsWithIDs(set.current._id, onRetrievedSetChildTasks)
      : setTaskListObjects([])

    return () => {eventStore.setTaskListener("off", addTask)}
  }, []);

  const onRetrievedSetChildTasks = retrievedObjects => {
    setTaskListObjects(retrievedObjects.data)
  }

  const onDBCallback = setDBID => {
    if (shouldReopen) {
      shouldReopen = false
      store.dispatch({
        type: 'SET_SHOULD_EDIT',
        shouldEdit: true,
        typeToEdit: 'set',
        objectToEdit: { ...set.current, ...{ _id: setDBID } }
      })
    }
    closeSetComponent(true, shouldCloseAsset)
  }

  const onResponsesChanged = (e, response, target) => {
    response = response.replace(/\s+/g, " ")
    response = response.trim()
    response = response.split(",")
    response = response.map((value) => { return value.trim() })
    response = response.filter(Boolean) //Remove empty values

    if (target === "Tags")
      set.current.tags = response
    else if (target === "Repeat" && response[0]) {
      response = response[0].replace(/\D/g, '')
      response = response === "" ? "0" : response
    }
  }

  const onSetTaskOrderChanged = (e, checked) => {                   //Callback from checkbox pressed
    set.current.setTaskOrder = checked
      ? "Random"
      : "InOrder"
    setRandomizeSet(checked)
  }

  const addTask = () => {           //Add a task to the list of tasks in the set
    let addObj = eventStore.getTaskData()
    let task = addObj[0]
    let destinationIdx = addObj[1]
    if (set.current._id === task._id) {
      store.dispatch({
        type: 'TOAST_SNACKBAR_MESSAGE',
        snackbarOpen: true,
        snackbarMessage: "Cannot add the same set to itself"
      })
    } else {
      destinationIndex.current = destinationIdx
      willCauseCircularReference(task)   //perform a deeper check for circular references. This will in turn add the task if it is ok to do so.
    }
  }

  const willCauseCircularReference = task => {                    //Returns true if adding the task will result in a circular reference
    if (task.objType === dbObjects.ObjectTypes.SET) {   //We only need to check if the task we are adding is a TaskSet
      let queryList = []                                //Try to get the data contained in the task set we are trying to add as we need this information to check for a circular reference
      queryList.push({ id: task._id, objType: task.objType })

      db_helper.getTasksOrSetsWithIDsPromise(task).then(data => {
        if (data) {                                     //If the query was successful, extract the child set ids of the set we are trying to add as well as the set id
          if (getChildSetIDs(data, [data._id]).includes(set.current._id)) {    //Check that we are not adding a set containing the set we are editing now. If we are it would cause a circular reference
            handleAddTaskAllowed(false, task, "The set you are trying to add already includes this set and would cause a circular reference")
            return
          }
          const result_message = task.objType === dbObjects.ObjectTypes.SET
            ? "Set successfully added"
            : "Task successfully added"            //No circular reference detected
          handleAddTaskAllowed(true, task, result_message)
        } else handleAddTaskAllowed(false, task, "Unable to query the database, did not add " + task.objType === dbObjects.ObjectTypes.SET ? "set" : "task")  //Otherwise we do not add as we don't know if it will be ok
      })
    } else handleAddTaskAllowed(true, task, "Task successfully added")
  }

  const handleAddTaskAllowed = (allowed, task, message) => {
    if (allowed) {

      let taskListObjectsCopy = taskListObjectRef.current.slice()
      taskListObjectsCopy.splice( //Add a dummy object so the user gets some feedback while the server is processing
        destinationIndex.current,
        0,
        { _id: task._id, name:"Adding...",objType:"Tasks" }
      )

      taskList.splice( //Add a dummy object so the user gets some feedback while the server is processing
        destinationIndex.current,
        0,
        { id: task._id, objType: task.objType }
      )
      set.current.childIds = taskList

      shouldCloseAsset = false
      if (task.objType === dbObjects.ObjectTypes.SET)
        db_helper.getTasksOrSetsWithIDs(task._id, onRetrievedSetChildTasksAddToSet)
      else if (task.objType === dbObjects.ObjectTypes.TASK)
        db_helper.getTaskWithID(task._id, onRetrievedSetChildTasksAddToSet)

      store.dispatch({
        type: 'TOAST_SNACKBAR_MESSAGE',
        snackbarOpen: true,
        snackbarMessage: message
      })

      setTaskListObjects(taskListObjectsCopy)
      setTaskList(taskList)
    } else {
      store.dispatch({
        type: 'TOAST_SNACKBAR_MESSAGE',
        snackbarOpen: true,
        snackbarMessage: message
      })
    }
  }

  const onRetrievedSetChildTasksAddToSet = retrievedObject => {
    let taskListObjectsCopy = taskListObjectRef.current.slice()
    taskListObjectsCopy[destinationIndex.current]=retrievedObject //Replace the dummy object with the actual object
    setTaskListObjects(taskListObjectsCopy)
    taskList[destinationIndex.current] = { id: retrievedObject._id, objType: retrievedObject.objType } //Replace the dummy object with the actual object
    setTaskList(taskList)
    set.current.childIds = taskList
  }

  const onChangeSetSettings = () => {
    if (props.isEditing) {
      shouldCloseAsset = false
      db_helper.updateTaskSetFromDb(set.current._id, set.current, onDBCallback)

      store.dispatch({
        type: 'TOAST_SNACKBAR_MESSAGE',
        snackbarOpen: true,
        snackbarMessage: "Set saved"
      })
    } else {
      shouldCloseAsset = true
      shouldReopen = true
      db_helper.addTaskSetToDb(set.current, onDBCallback)
      store.dispatch({
        type: 'TOAST_SNACKBAR_MESSAGE',
        snackbarOpen: true,
        snackbarMessage: "Set created"
      })
    }
  }

  const getChildSetIDs = (setObject, childSets) => {
    childSets.push(setObject._id)             //Add the object to the list
    setObject.data.forEach(obj => {          //Iterate over the sets children
      if (obj.objType === dbObjects.ObjectTypes.SET)
        getChildSetIDs(obj, childSets)
    })
    return childSets
  }

  const removeTask = taskId => {   //Remove a task from the list of tasks in the set
    let newList = [...taskList]
    for (let i = 0; i < newList.length; i++) {
      if (newList[i].id === taskId) {
        newList.splice(i, 1)
        break
      }
    }
    let newObjectList = [...taskListObjects]
    for (let i = 0; i < newObjectList.length; i++) {
      if (newObjectList[i]._id === taskId) {
        newObjectList.splice(i, 1)
        break
      }
    }

    set.current.childIds = newList

    store.dispatch({
      type: 'TOAST_SNACKBAR_MESSAGE',
      snackbarOpen: true,
      snackbarMessage: "Set removed"
    })

    setTaskList(newList)
    setTaskListObjects(newObjectList)
  }

  const moveTask = (dragIndex, hoverIndex) => {
    db_utils.arrayMove(taskList, dragIndex, hoverIndex)
    db_utils.arrayMove(taskListObjects, dragIndex, hoverIndex)

    setTaskListObjects(taskListObjects)
    setTaskList(taskList)

    set.current.childIds = taskList
  }

  const removeSet = () => {  //Removes the selected set from the database
    shouldCloseAsset = true

    store.dispatch({
      type: 'TOAST_SNACKBAR_MESSAGE',
      snackbarOpen: true,
      snackbarMessage: "Set deleted"
    })

    db_helper.deleteTaskSetFromDb(set.current._id, onDBCallback)
  }

  const closeSetComponent = (componentChanged, overrideShouldClose) => {   //Calls the provided callback function that handles the closing of this component
    let shouldClose = overrideShouldClose
      ? overrideShouldClose
      : shouldCloseAsset
    props.closeSetCallback(componentChanged, shouldClose)
  }

  /*
██████  ███████ ███    ██ ██████  ███████ ██████
██   ██ ██      ████   ██ ██   ██ ██      ██   ██
██████  █████   ██ ██  ██ ██   ██ █████   ██████
██   ██ ██      ██  ██ ██ ██   ██ ██      ██   ██
██   ██ ███████ ██   ████ ██████  ███████ ██   ██
*/

  return (
    <div className="setComponentContainer">
      <form className="setFormRoot" autoComplete="off" id="formRootId">
        {
          <div>
            <TextField
              id="questionText"
              required
              padding="dense"
              defaultValue={set.current.name}
              placeholder="Valve questions"
              label="Set Name"
              style={{ width: 'calc(50% - 10px)', marginRight: 10 }}
              rows="1"
              onChange={(e) => { set.current.name = e.target.value }}
            />
            <TextField
              id="tags"
              required
              padding="dense"
              defaultValue={set.current.tags.join(',')}
              placeholder="Pump, Steam"
              label="Tags(comma-separated)"
              style={{ width: '50%' }}
              onChange={(e) => onResponsesChanged(e, e.target.value, "Tags")}
            />
          </div>
        }
      </form>

      <div className="setTaskListContainer">
        <div className="setTaskListViewer">
          <Droppable droppableId="setTaskListId" >
            {(provided, snapshot) => (
              <div ref={provided.innerRef} style={{ width: '100%', minHeight: '100%', height: 'auto' }}>
                <EditSetList
                  removeCallback={removeTask}
                  taskListObjects={taskListObjects}
                  reactDND={true}
                  removeTaskCallback={removeTask}
                  moveTaskCallback={moveTask}
                  displayIfEmpty={"Drag tasks here"}
                />
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </div>
      <div className="editSetComponentButtons">
        <Button
          onClick={onChangeSetSettings}
          variant="outlined"
        >
          {props.isEditing ? "Save" : "Create"}
        </Button>

        {props.isEditing
          ? <Button
            onClick={removeSet}
            variant="outlined"
          >
            Delete
            </Button>
          : null
        }

        <FormControlLabel
          label="Randomize order"
          value="start"
          padding="dense"
          style={{ marginLeft: 10 }}
          checked={randomizeSet}
          control={<Checkbox color="secondary" />}
          onChange={onSetTaskOrderChanged}
          labelPlacement="end"
        />
      </div>
    </div>
  )
}

export default EditSet
