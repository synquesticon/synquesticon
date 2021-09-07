import React, { Suspense, useEffect } from "react"
import ButtonUI from "@material-ui/core/Button"
import store from "../core/store"
import * as dbObjects from "../core/db_objects"
import uuid from "react-uuid"
import "./css/showTask.css"
import mqtt from "../core/mqtt"

const Instruction = React.lazy(() => import("./components/Instruction"))
const Text = React.lazy(() => import("./components/Text"))
const Number = React.lazy(() => import("./components/Number"))
const Button = React.lazy(() => import("./components/Button"))
const Image = React.lazy(() => import("./components/Image"))
const Video = React.lazy(() => import("./components/Video"))

const ShowTask = (props) => {
  const onEnterPress = (e) => {
    if (e.key === "Enter") {
      // Enter press
      props.nextPressed(props.setID, props.set)
    }
  }

  useEffect(() => {
    document.addEventListener("keydown", onEnterPress, false)

    const taskLoadedObj = {
      sessionUID: store.getState().experimentInfo.participantId,
      setTags: props.setTags,
      taskTags: props.task.tags,
    }
    mqtt.sendMqttMessage("onTaskLoaded/", JSON.stringify(taskLoadedObj))

    return () => {
      document.removeEventListener("keydown", onEnterPress, false)
    }
  }, [])

  const getDisplayedContent = (taskList, _id, mapIndex) => {
    if (!taskList) return null

    let hideNext = false
    let components = taskList.map((item, i) => {
      if (
        (store.getState().multipleScreens &&
          (item.screenIDS.includes(store.getState().screenID) ||
            item.screenIDS.length === 0)) ||
        !store.getState().multipleScreens
      ) {
        if (item.hideNext) hideNext = true
        switch (item.objType) {
          case dbObjects.TaskTypes.BUTTON.type:
            return (
              <Suspense key={uuid()} fallback={<div></div>}>
                <Button
                  className="itemContainer"
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
                  logCallback={(logObj) => props.logCallback(logObj)}
                  commandCallback={(commandObj) =>
                    props.commandCallback(commandObj)
                  }
                />
              </Suspense>
            )
          case dbObjects.TaskTypes.INSTRUCTION.type:
            return (
              <Suspense key={uuid()} fallback={<div></div>}>
                <Instruction
                  className="itemContainer"
                  task={item}
                  taskID={props.task._id}
                  parentSet={props.task.name}
                />
              </Suspense>
            )
          case dbObjects.TaskTypes.IMAGE.type:
            return (
              <Suspense key={uuid()} fallback={<div></div>}>
                <Image
                  className="itemContainer"
                  task={item}
                  taskID={props.task._id}
                  tags={props.task.tags}
                  parentSet={props.task.name}
                />
              </Suspense>
            )
          case dbObjects.TaskTypes.VIDEO.type:
            return (
              <Suspense key={uuid()} fallback={<div></div>}>
                <Video
                  className="itemContainer"
                  task={item}
                  taskID={props.task._id}
                  tags={props.task.tags}
                  logCallback={(logObj) => props.logCallback(logObj)}
                  parentSet={props.task.name}
                />
              </Suspense>
            )
          case dbObjects.TaskTypes.TEXT.type:
            return (
              <Suspense key={uuid()} fallback={<div></div>}>
                <Text
                  className="itemContainer"
                  task={item}
                  taskID={props.task._id}
                  tags={props.task.tags}
                  parentSet={props.task.name}
                />
              </Suspense>
            )
          case dbObjects.TaskTypes.NUMBER.type:
            return (
              <Suspense key={uuid()} fallback={<div></div>}>
                <Number
                  className="itemContainer"
                  task={item}
                  taskID={props.task._id}
                  tags={props.task.tags}
                  parentSet={props.task.name}
                />
              </Suspense>
            )
          default:
            return null
        }
      }
      return null
    })
    return { components: components, hideNext: hideNext }
  }

  const contentObject = getDisplayedContent(
    props.task.components,
    props.task._id,
    0
  )

  return (
    <div key={props.renderKey} className="multiItemContent">
      {contentObject.components}
      {contentObject.hideNext ? null : (
        <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 99 }}>
          <ButtonUI
            className="nextButton"
            variant="contained"
            onClick={() => props.nextPressed(props.setID, props.set)}
          >
            Next
          </ButtonUI>
        </div>
      )}
    </div>
  )
}

export default ShowTask
