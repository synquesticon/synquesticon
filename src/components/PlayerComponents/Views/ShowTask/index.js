import React, { Suspense } from 'react'
import Button from '@material-ui/core/Button'
import store from '../../../../core/store'
import * as dbObjects from '../../../../core/db_objects'
import './showTask.css'

const InstructionViewComponent = React.lazy(() => import('../InstructionViewComponent'))
const TextEntryComponent = React.lazy(() => import('../TextEntryComponent'))
const NumpadComponent = React.lazy(() => import('../NumpadComponent'))
const ButtonComponent = React.lazy(() => import('../ButtonComponent'))
const ImageViewComponent = React.lazy(() => import('../ImageViewComponent'))

const ShowTask = props => {
  const getDisplayedContent = (taskList, _id, mapIndex) => {
    if (!taskList) {
      return null
    }

    let hideNext = false
    let components = taskList.map((item, i) => {
      if ((store.getState().multipleScreens && (item.screenIDS.includes(store.getState().screenID)
        || item.screenIDS.length === 0)) || !store.getState().multipleScreens) {
        if (store.getState().multipleScreens && item.hideNext) {
          hideNext = true
        }
        switch (item.objType) {
          case dbObjects.TaskTypes.MCHOICE.type:
            return <Suspense fallback={<div></div>}><ButtonComponent className="itemContainer" key={props.renderKey +dbObjects.TaskTypes.MCHOICE.type + i} task={item} tags={props.task.tags} parentSet={props.task.name} taskID={props.task._id} familyTree={props.tasksFamilyTree} objType={item.objType} correctResponses={item.correctResponses} image={item.image} displayText={item.displayText} taskObj={props.task} /></Suspense>
          case dbObjects.TaskTypes.INSTRUCTION.type:
            return <Suspense fallback={<div></div>}><InstructionViewComponent className="itemContainer" key={props.renderKey  + i} task={item} parentSet={props.task.name} /></Suspense>
          case dbObjects.TaskTypes.IMAGE.type:
            return <Suspense fallback={<div></div>}><ImageViewComponent className="itemContainer" key={props.renderKey +dbObjects.TaskTypes.IMAGE.type + i} task={item} parentSet={props.task.name} /></Suspense>;
          case dbObjects.TaskTypes.TEXTENTRY.type:
            return <Suspense fallback={<div></div>}><TextEntryComponent className="itemContainer" key={props.renderKey + i} task={item} parentSet={props.task.name} /></Suspense>
          case dbObjects.TaskTypes.NUMPAD.type:
            return <Suspense fallback={<div></div>}><NumpadComponent className="itemContainer" key={props.renderKey +dbObjects.TaskTypes.NUMPAD.type + i} task={item} parentSet={props.task.name} /></Suspense>
          default:
            return null
        }
      }
      return null
    })
    return { components: components, hideNext: hideNext }
  }

  const contentObject = getDisplayedContent(props.task.childObj, props.task._id, 0)

  let nextButton = null
  if (!contentObject.hideNext) {
    nextButton = <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 99 }}>
      <Button className="nextButton" variant="contained" onClick={() => props.nextPressed(props.setID)}>
        Next
      </Button>
    </div>
  }

  return (
    <div key={props.renderKey} className="multiItemContent">
      {contentObject.components}
      {nextButton}
    </div>
  )
}

export default ShowTask