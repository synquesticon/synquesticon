import React, { Component } from 'react'
import db_helper from '../../core/db_helper'
import * as dbObjects from '../../core/db_objects'
import * as db_utils from '../../core/db_objects_utility_functions'
import store from '../../core/store'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import TaskList from './TaskList'
import TaskComponentList from './ComponentList'
import { Droppable, DragDropContext } from 'react-beautiful-dnd'
import './css/Task.css'

class Task extends Component {
  constructor(props) {
    super(props)

    //If we got a taskObject passed as a prop we use it, otherwise we init with a default constructed object
    //Clone the array via JSON. Otherwise we would operate directly on the original objects which we do not want
    // this.taskObj = this.props.isEditing
    //   ? JSON.parse(JSON.stringify(this.props.taskObj))
    //   : new dbObjects.TaskObj()

      this.taskObj = this.props.isEditing
      ? this.props.taskObj
      : new dbObjects.TaskObj()

    for (var i = 0; i < this.taskObj.components.length; i++) {
      this.taskObj.components[i] = { ...new dbObjects.Component(this.taskObj.components[i].objType), ...this.taskObj.components[i] }
      this.taskObj.components[i].openState = true
    }

    //We keep these fields in the state as they affect how the component is rendered
    this.state = { taskComponents: this.taskObj.components, }
    this.updateChildOpenStateCallback = this.updateChildOpenState.bind(this)
    this.removeComponentCallback = this.removeComponent.bind(this)
    this.moveComponentCallback = this.moveComponent.bind(this)
    this.responseHandler = this.onResponsesChanged
    this.handleDBCallback = this.onDBCallback.bind(this)
    this.shouldCloseAsset = false       //Used to determine if the object should be closed
  }

  //Callback from the collapsable container when it's state is changed
  updateChildOpenState(childIndex, newState) {
    let updatedComponents = this.state.taskComponents.slice()
    updatedComponents[childIndex].openState = newState
    this.setState({ taskComponents: updatedComponents })
  }

  onDBCallback(taskID) {
    if (this.shouldReopen) {
      this.shouldReopen = false
      store.dispatch({
        type: 'SET_SHOULD_EDIT',
        shouldEdit: true,
        objectToEdit: { ...this.taskObj, ...{ _id: taskID } },
        typeToEdit: dbObjects.ObjectTypes.TASK
      })
    }
    this.closeSetComponent(true, this.shouldCloseAsset)
  }

  onChangeTaskSettings() {
    if (this.props.isEditing) {
      this.shouldCloseAsset = false
      db_helper.updateTaskFromDb(this.taskObj._id, this.taskObj, this.handleDBCallback)
      store.dispatch({
        type: 'TOAST_SNACKBAR_MESSAGE',
        snackbarOpen: true,
        snackbarMessage: "Task saved"
      })
    } else {
      this.shouldCloseAsset = true
      this.shouldReopen = true
      db_helper.addTaskToDb(this.taskObj, this.handleDBCallback)
      store.dispatch({
        type: 'TOAST_SNACKBAR_MESSAGE',
        snackbarOpen: true,
        snackbarMessage: "Task created"
      })
    }
  }

  onResponsesChanged(e, response, target) {
    response = response.replace(/\s+/g, " ")
    response = response.trim()
    response = response.split(",")
    response = response.map((value) => {
      return value.trim()
    })
    response = response.filter(Boolean) //Remove empty values
    if (target === "Tags") this.taskObj.tags = response
  }


  addComponent(sourceIndex, destinationIndex) {  //Add a task to the list of tasks in the set
    let newComponent = new dbObjects.Component(Object.values(dbObjects.TaskTypes)[sourceIndex])
    newComponent.openState = true
    if (newComponent) {
      let updatedComponents = this.state.taskComponents.slice()        //Insert the new component at the index stored when add task was called
      updatedComponents.splice(destinationIndex, 0, newComponent)
      store.dispatch({
        type: 'TOAST_SNACKBAR_MESSAGE',
        snackbarOpen: true,
        snackbarMessage: "Task component added successfully"
      })
      this.setState({ taskComponents: updatedComponents, })
      this.taskObj.components = updatedComponents
    }
  }

  removeComponent(index) {        //Remove a task from the list of tasks in the set
    var newObjectList = [...this.state.taskComponents]
    newObjectList.splice(index, 1)
    store.dispatch({
      type: 'TOAST_SNACKBAR_MESSAGE',
      snackbarOpen: true,
      snackbarMessage: "Component removed"
    })
    this.setState({ taskComponents: newObjectList, })
    this.taskObj.components = newObjectList
  }

  moveComponent(dragIndex, hoverIndex) {
    const updatedObjectList = this.state.taskComponents.slice()
    db_utils.arrayMove(updatedObjectList, dragIndex, hoverIndex)
    this.setState({ taskComponents: updatedObjectList, })
    this.taskObj.components = updatedObjectList
  }

  removeTask() {     //Removes the selected task from the database
    this.shouldCloseAsset = true
    store.dispatch({
      type: 'TOAST_SNACKBAR_MESSAGE',
      snackbarOpen: true,
      snackbarMessage: "Task deleted"
    })
    db_helper.deleteTaskFromDb(this.taskObj._id, this.handleDBCallback)
  }

  //Calls the provided callback function that handles the closing of this component
  closeSetComponent(componentChanged, overrideShouldClose) {
    let shouldClose = overrideShouldClose ? overrideShouldClose : this.shouldCloseAsset
    this.props.closeTaskCallback(componentChanged, shouldClose)
  }

  onDragEnd = result => {       //On drag end callback from ReactDND
    const { source, destination } = result
    if (!destination) return   // dropped outside the list

    if (source.droppableId === destination.droppableId)
      this.moveComponent(source.index, destination.index)
    else  //Otherwise we add to the list at the desired location
      this.addComponent(source.index, destination.index)
  }
  /*
██████  ███████ ███    ██ ██████  ███████ ██████
██   ██ ██      ████   ██ ██   ██ ██      ██   ██
██████  █████   ██ ██  ██ ██   ██ █████   ██████
██   ██ ██      ██  ██ ██ ██   ██ ██      ██   ██
██   ██ ███████ ██   ████ ██████  ███████ ██   ██
*/

  render() {
    const setContent =
      <div>
        <TextField id="nameText"
          required
          padding="dense"
          defaultValue={this.taskObj.name}
          placeholder="Demographics"
          label="Name"
          ref="setTextRef"
          style={{ width: 'calc(50% - 10px)', marginRight: 10 }}
          rows="1"
          onChange={(e) => { this.taskObj.name = e.target.value }}
        />
        <TextField id="tags"
          required
          padding="dense"
          defaultValue={this.taskObj.tags.join(',')}
          placeholder="Pump, Steam"
          label="Tags(comma-separated)"
          style={{ width: '50%' }}
          ref="tagsRef"
          onChange={(e) => this.responseHandler(e, e.target.value, "Tags")}
        />
      </div>

    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <div className="synquestiComponentContainer">
          <form className="synquestiFormRoot" autoComplete="off" id="formRootId">
            {setContent}
          </form>

          <div className="synquestiTaskOptions">
            {
              <TaskList
                dragEnabled={true}
                taskList={Object.values(dbObjects.TaskTypes)}
                itemType={dbObjects.ObjectTypes.TASK}
                droppableId="tasks" />
            }
          </div>

          <div className="taskListContainer">
            <div className="taskListViewer">
              <Droppable droppableId="taskListId" >
                {(provided, snapshot) => (
                  <div ref={provided.innerRef} style={{ width: '100%', height: '100%', minHeight: 0 }}>
                    < TaskComponentList removeCallback={this.removeComponentCallback} toggleChildCallback={this.updateChildOpenState.bind(this)}
                      taskComponents={this.state.taskComponents} displayIfEmpty={"Drag components here"} />
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </div>

          <div className="editSynquestitaskComponentButtons">
            <Button onClick={this.onChangeTaskSettings.bind(this)} variant="outlined">
              {this.props.isEditing ? "Save" : "Create"}
            </Button>
            {
              (this.props.isEditing) ?
                <Button onClick={this.removeTask.bind(this)} variant="outlined">
                  Delete
                </Button> : null
            }
          </div>
        </div>
      </DragDropContext>
    )
  }
}

export default Task
