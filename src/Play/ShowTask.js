import React, { Suspense } from 'react'
import ButtonUI from '@material-ui/core/Button'
import store from '../core/store'
import * as dbObjects from '../core/db_objects'
import uuid from 'react-uuid'
import './css/showTask.css'

const Instruction = React.lazy(() => import('./components/Instruction'))
const Text = React.lazy(() => import('./components/Text'))
const Number = React.lazy(() => import('./components/Number'))
const Button = React.lazy(() => import('./components/Button'))
const Image = React.lazy(() => import('./components/Image'))

const ShowTask = props => {
  const getDisplayedContent = (taskList, _id, mapIndex) => {
    if (!taskList) return null

    let hideNext = false
    let components = taskList.map((item, i) => {
      if ((store.getState().multipleScreens && (item.screenIDS.includes(store.getState().screenID)
        || item.screenIDS.length === 0)) || !store.getState().multipleScreens) {
        if (store.getState().multipleScreens && item.hideNext) {
          hideNext = true
        }
        switch (item.objType) {
          case dbObjects.TaskTypes.MCHOICE.type:
            return <Suspense key={uuid()} fallback={<div></div>}><Button className="itemContainer"
              key={uuid()}
              task={item}
              tags={props.task.tags}
              parentSet={props.task.name}
              taskID={props.task._id}
              familyTree={props.familyTree}
              objType={item.objType}
              correctResponses={item.correctResponses}
              image={item.image}
              displayText={item.displayText}
            />
            </Suspense>
          case dbObjects.TaskTypes.INSTRUCTION.type:
            return <Suspense key={uuid()} fallback={<div></div>}><Instruction className="itemContainer"
              task={item}
              taskID={props.task._id}
              parentSet={props.task.name} />
            </Suspense>
          case dbObjects.TaskTypes.IMAGE.type:
            return <Suspense key={uuid()} fallback={<div></div>}><Image className="itemContainer" task={item} taskID={props.task._id} tags={props.task.tags} parentSet={props.task.name} /></Suspense>;
          case dbObjects.TaskTypes.TEXTENTRY.type:
            return <Suspense key={uuid()} fallback={<div></div>}><Text className="itemContainer" task={item} taskID={props.task._id} tags={props.task.tags} parentSet={props.task.name} /></Suspense>
          case dbObjects.TaskTypes.NUMPAD.type:
            return <Suspense key={uuid()} fallback={<div></div>}><Number className="itemContainer" task={item} taskID={props.task._id} tags={props.task.tags} parentSet={props.task.name} /></Suspense>
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
    nextButton =
      <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 99 }}>
        <ButtonUI className="nextButton" variant="contained" onClick={() => props.nextPressed(props.setID, props.set)}>
          Next
      </ButtonUI>
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