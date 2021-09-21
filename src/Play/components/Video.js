import React, { useState, useEffect, useRef } from "react"
import mqtt from "../../core/mqtt"
import { Typography } from "@material-ui/core"
import audioFileSrc from "./Sounds/cesium.wav"
import eventStore from "../../core/eventStore"
import store from "../../core/store"
import * as playerUtils from "../../core/player_utility_functions"
import AOIComponent from "../../Edit/Task/Image/AOIEditor/AOIComponent"
import makeLogObject from "../../core/makeLogObject"
import "./css/Image.css"
import { ContactsOutlined } from "@material-ui/icons"
import { SetObject } from "../../core/db_objects"

let CLICK_RADIUS = "1"
let OPACITY = "0.5"
let COLOR = "red"

const VideoComponent = (props) => {
  const videoRef = useRef()
  const audioRef = useRef()
  const clicksRef = useRef()

  let alarmTimer,
    endAlarmTimer,
    registrationTimer,
    endRegistrationTimer = null

  const [shouldPlayAlarmSound, setShouldPlayAlarmSound] = useState(false)
  const [videoWidth, setVideoWidth] = useState(100)
  const [videoHeight, setVideoHeight] = useState(100)
  const [videoElement, setVideoElement] = useState(null)
<<<<<<< HEAD
  const [aoiHitCounts, setAOIHitCounts] = useState({})
=======
  const [aoiHitCounts, setAOIHitCount] = useState({})
>>>>>>> video_fixation
  const [clicks, setClicks] = useState([])
  const [fixations, setFixations] = useState([])
  const [aois, setAOIs] = useState(props.task.aois)
  let video = null

  useEffect(() => {
    clicksRef.current = [...clicks]
    video = new Image()
    video.src = "/Videos/" + props.task.video
    video.ref = videoRef

    if (props.task.aois.length > 0) {
      let aois = [...props.task.aois]
      aois.forEach((aoi) => {
        aoi.videoRef = videoRef
        aoi.isSelected = false
        aoi.isFilledYellow = false
        aoiHitCounts[aoi.name] = {
          hitClickCount: 0,
<<<<<<< HEAD
          hitFixationCount: 0
=======
          hitFixationCount: 0,
>>>>>>> video_fixation
        }
      })

      aoiHitCounts["Background"] = {
        hitClickCount: 0,
        hitFixationCount: 0,
      }
      setAOIs(aois)

      store.dispatch({
        type: "ADD_AOIS",
        aois: aois,
      })

      window.addEventListener("resize", handleVideoLoaded)
    }

    return () => {

      // if (props.task.recordClicks) {
      //   const taskObject = {
      //     uid: props.taskID,
      //     name: props.parentSet,
      //     tags: props.tags
      //   }

      //   const aois = props.task.aois.slice()
      //   const AOICount = {}
      //   aois.forEach(aoi => { AOICount[aoi.name] = 0 })

      //   AOICount['Background '] = 0

      //   clicksRef.current.map(click => click.hitAOIs.forEach(aoi => AOICount[aoi]++))

      //   const componentObject = {
      //     uid: uuid(),
      //     type: "VIDEO",
      //     text: props.task.displayText,
      //     responsesArray: clicksRef.current,
      //     AOICount: Object.keys(AOICount).map(aoiKey => [aoiKey, AOICount[aoiKey]])
      //   }

      //   let observerMessageString = 'Final answer '
      //   componentObject.AOICount.map((count, i) => {
      //     observerMessageString += count[0] + ': ' + count[1]
      //     if (i === componentObject.AOICount.length - 1)
      //       observerMessageString += ' '
      //     else
      //       observerMessageString += ', '
      //   })
      //   mqtt.sendMqttMessage(
      //     'taskEvent',
      //     makeLogObject(
      //       taskObject,
      //       componentObject,
      //       { observerMessage: observerMessageString }
      //     )
      //   )
      // }
      clearTimeout(alarmTimer)
      clearTimeout(endAlarmTimer)
      clearTimeout(registrationTimer)
      clearTimeout(endRegistrationTimer)
      window.removeEventListener("resize", handleVideoLoaded)
    }
  }, [])

  useEffect(() => {
    clicksRef.current = clicks.slice()
  }, [clicks])

<<<<<<< HEAD
  const getVideoData = (eventType) => {
    let data = {}
    data.clicksPoints = clicks
=======
  const getVideoComponent = () => {
    return {
      text: props.task.video,
      responseOptions: props.task.aois,
    }
  }

  const getVideoData = (eventType) => {
    let data = {}
    data.clickedPoints = clicksRef.current
>>>>>>> video_fixation
    data.fixations = fixations
    data.aoiHitCounts = aoiHitCounts
    data.eventType = eventType
    return data
  }

  const replayAudioSound = () => {
    if (shouldPlayAlarmSound === true) {
      audioRef.current.play()
    }
  }

  const getMousePosition = (e) => {
    let videoRect = e.target.getBoundingClientRect()
    let x = (e.clientX - videoRect.left) / videoRect.width
    let y = (e.clientY - videoRect.top) / videoRect.height
    return {
      x: x,
      y: y,
    }
  }

  const getFixationPosition = (gazeX, gazeY, videoRef) => {
    let videoRect = videoRef.current.getBoundingClientRect()
    let x = gazeX * window.innerWidth
    let y = gazeY * window.innerHeight

    let newX = (x - videoRect.left) / videoRect.width
    let newY = (y - videoRect.top) / videoRect.height

    return {
      x: newX,
      y: newY,
    }
  }

  // const soundAlarm = async () => {
  //   // console.log("Check at " + videoRef.current.currentTime)
  //   aois.map((aoi, index) => {
  //     if (AOICount[aoi.name] < aoi.numberSufficentFixation &&
  //       videoRef.current.currentTime * 1000 >= aoi.startTime &&
  //       videoRef.current.currentTime * 1000 <= aoi.endTime) {
  //       let newAOI = aoi
  //       newAOI.isFilledYellow = true
  //       let tempAOIs = [...aois]
  //       tempAOIs = tempAOIs.splice(index, 1, newAOI)
  //       setAOIs(tempAOIs)
  //       if(shouldPlayAlarmSound === false){
  //         setShouldPlayAlarmSound(true)
  //       }

  //       audioSound.play().finally(
  //         () => {
  //           if (shouldPlayAlarmSound === true && audioSound.pause) {
  //             audioSound.play()
  //           }
  //         }
  //       )
  //     } else if(aoi.numberSufficentFixation && AOICount[aoi.name] >= aoi.numberSufficentFixation){
  //       let newAOI = aoi
  //       newAOI.isAcknowledged = true
  //       let tempAOIs = [...aois]
  //       tempAOIs.splice(index, 1, newAOI)
  //       setAOIs(tempAOIs)
  //       if(shouldPlayAlarmSound === true){
  //         setShouldPlayAlarmSound(false)
  //       }
  //     } else {

  //       if(shouldPlayAlarmSound === true){
  //         if(aoi.name === 'attention1'){
  //           console.log(aoi.name, ' Alarm time')
  //         }
  //         setShouldPlayAlarmSound(false)
  //       }
  //     }
  //   })
  // }

<<<<<<< HEAD
  const endWatchTime = () => {
    if(videoRef.current.currentTime * 1000 >= props.task.alarmWatchTimeEnd){
      clearInterval(checkShouldEndWatchTimer)

      props.logCallback(
        makeLogObject(props, 
          getVideoData('COMPONENT'), "Video")
      )

      clearTimeout(timer) 
      let tempAOIs = [...aois]

      tempAOIs.map((aoi, index) => {
        aoi.isFilledYellow = false
        aoi.isAcknowledged = false
      })
      setAOIs(tempAOIs)
      setShouldPlayAlarmSound(false)
    }
=======
  const endAlarm = () => {
    let tempAOIs = [...aois]
    tempAOIs.map((aoi, index) => {
      aoi.isFilledYellow = false
      aoi.isAcknowledged = false
    })
    setAOIs(tempAOIs)
    setShouldPlayAlarmSound(false)
>>>>>>> video_fixation
  }

  const checkAlarm = () => {
    aois.map((aoi, index) => {
<<<<<<< HEAD
      if(aoi.numberSufficentFixation !== null){
        if ((aoiHitCounts[aoi.name].hitClickCount + aoiHitCounts[aoi.name].hitFixationCount) < aoi.numberSufficentFixation) {             
=======
      if (aoi.numberSufficentFixation !== undefined) {
        if (          
          aoiHitCounts[aoi.name].hitFixationCount <
          aoi.numberSufficentFixation
        ) {
>>>>>>> video_fixation
          let newAOI = aoi
          newAOI.isFilledYellow = true
          let tempAOIs = [...aois]
          tempAOIs = tempAOIs.splice(index, 1, newAOI)
          setAOIs(tempAOIs)
          if (shouldPlayAlarmSound === false) {
            setShouldPlayAlarmSound(true)
            audioRef.current.play()
          }
        } else {
          let newAOI = aoi
          newAOI.isAcknowledged = true
          newAOI.isFilledYellow = false
          let tempAOIs = [...aois]
          tempAOIs = tempAOIs.splice(index, 1, newAOI)
          setAOIs(tempAOIs)
          if (shouldPlayAlarmSound === true) {
            setShouldPlayAlarmSound(false)
          }
        }

        // props.logCallback(
        //   makeLogObject(
        //     props,
        //     getVideoComponent(),
        //     getVideoData("COMPONENT"),
        //     "Video"
        //   )
        // )
      }
    })
  }

  const onGazeEvent = () => {
    const gazeData = JSON.parse(eventStore.getGazeData())

    const fixationArray = gazeData.data.filter(
      (datum) => datum.isFixation === true
    )
    fixationArray.map((fixationGaze) => {
      let gazePos = getFixationPosition(
        fixationGaze.gaze.x,
        fixationGaze.gaze.y,
        videoRef
      )
      let hitAOIs = checkGazeHitAOI(
        gazePos.x * window.innerWidth,
        gazePos.y * window.innerHeight,
        videoRef
      )

      let fixation = {
        hitAOIs: hitAOIs,
        x: gazePos.x,
        y: gazePos.y,
<<<<<<< HEAD
        ts: gazePos.timestamp
      }

      hitAOIs.map(hitAOI =>
        aoiHitCounts[hitAOI].fixationCount = aoiHitCounts[hitAOI].fixationCount + 1
      )

      setFixations([...fixations], fixation)
=======
        fixationLength: fixationGaze.fixationLength,
      }

      console.log("Here is one fixation ", fixation)
>>>>>>> video_fixation

      hitAOIs.map(
        (hitAOI) =>
          (aoiHitCounts[hitAOI].hitFixationCount =
            aoiHitCounts[hitAOI].hitFixationCount + 1)
      )

      setFixations([...fixations, fixation])

      console.log("Count: ", aoiHitCounts)
    })
  }

  const normalizeBoundingBoxes = (
    boundingBox,
    videoDivRectangle,
    polygonList
  ) => {
    let x =
      (boundingBox[0] * videoDivRectangle.width) / 100 + videoDivRectangle.x
    let y =
      (boundingBox[1] * videoDivRectangle.height) / 100 + videoDivRectangle.y
    return [x, y]
  }

  const checkHitAOI = (click) => {
    // let aois = store.getState().aois
    let aois = props.task.aois
    let pointInsideAOIs = []

    aois.map((a) => {
      if (a.videoRef.current === null) return ["Background"]

      let videoDivRect = videoRef.current.getBoundingClientRect()
      let polygon = []
      if (a.boundingbox.length > 0) {
        for (let boundingbox of a.boundingbox) {
          polygon.push(normalizeBoundingBoxes(boundingbox, videoDivRect))
        }
      } else {
        polygon.push([videoDivRect.x, videoDivRect.y])
        polygon.push([videoDivRect.x + videoDivRect.width, videoDivRect.y])
        polygon.push([
          videoDivRect.x + videoDivRect.width,
          videoDivRect.y + videoDivRect.height,
        ])
        polygon.push([videoDivRect.x, videoDivRect.y + videoDivRect.height])
      }

      if (playerUtils.pointIsInPoly([click.clientX, click.clientY], polygon))
        pointInsideAOIs.push(a.name)
    })

    if (pointInsideAOIs.length > 0) return pointInsideAOIs
    else return ["Background"]
  }

  const checkGazeHitAOI = (gazeX, gazeY, videoRef) => {
    let aois = store.getState().aois
    let pointInsideAOIs = []

    aois.map((a) => {
      if (a.videoRef.current === null) return ["Background"]

      let videoDivRect = videoRef.current.getBoundingClientRect()
      let polygon = []
      if (a.boundingbox.length > 0) {
        for (let boundingbox of a.boundingbox) {
          polygon.push(normalizeBoundingBoxes(boundingbox, videoDivRect))
        }
      } else {
        polygon.push([videoDivRect.x, videoDivRect.y])
        polygon.push([videoDivRect.x + videoDivRect.width, videoDivRect.y])
        polygon.push([
          videoDivRect.x + videoDivRect.width,
          videoDivRect.y + videoDivRect.height,
        ])
        polygon.push([videoDivRect.x, videoDivRect.y + videoDivRect.height])
      }

      if (playerUtils.pointIsInPoly([gazeX, gazeY], polygon))
        pointInsideAOIs.push(a.name)
    })

    if (pointInsideAOIs.length > 0) return pointInsideAOIs
    else return ["Background"]
  }

  const onVideoClicked = (e) => {
    let mouseClick = getMousePosition(e)
    const hitAOIs = checkHitAOI(e)
    let click = {
      hitAOIs: hitAOIs,
      x: mouseClick.x,
      y: mouseClick.y,
<<<<<<< HEAD
      ts: Date.now()
=======
      ts: Date.now(),
>>>>>>> video_fixation
    }
    // console.log(click)
    // console.log(e.clientX, e.clientY)
    setClicks([...clicks, click])

    hitAOIs.map((hitAOI) => {
<<<<<<< HEAD
      aoiHitCounts[hitAOI].hitClickCount = aoiHitCounts[hitAOI].hitClickCount + 1
=======
      aoiHitCounts[hitAOI].hitClickCount =
        aoiHitCounts[hitAOI].hitClickCount + 1
>>>>>>> video_fixation
      let newAOIs = aois.slice()
      newAOIs.map((aoi) => {
        if (aoi.name === hitAOI) {
          aoi.isSelected = !aoi.isSelected
        }
      })
      setAOIs(newAOIs)
    })

    // console.log("Count: ", AOICount)
  }

  const getClickableComponent = () => {
    if (props.task.recordClicks) {
      const left = videoElement ? parseInt(videoElement.offsetLeft) : 0

      return (
        <svg
          onClick={onVideoClicked}
          style={{ left: left }}
          className="clickableCanvas"
          width={videoWidth}
          opacity={OPACITY}
          height={videoHeight}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <g stroke="none" fill="black">
            {/* {clicks.map((item, index) => {
              return (
                <ellipse
                  key={index}
                  cx={item.x * 100}
                  cy={item.y * 100}
                  rx={CLICK_RADIUS}
                  ry={CLICK_RADIUS * 1.8}
                  fill={COLOR}
                  style={{ pointerEvents: "none" }}
                />
              )
            })} */}
          </g>
        </svg>
      )
    } else return null
  }

  const showFixationForTesting = () => {
    const left = videoElement ? parseInt(videoElement.offsetLeft) : 0

    return (
      <svg
        style={{ left: left }}
        className="clickableCanvas"
        width={videoWidth}
        opacity={OPACITY}
        height={videoHeight}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <g stroke="none" fill="black">
          {fixations.map((item, index) => {
            return (
              <ellipse
                key={index}
                cx={item.x * 100}
                cy={item.y * 100}
                rx={CLICK_RADIUS}
                ry={CLICK_RADIUS * 1.8}
                fill={COLOR}
                style={{ pointerEvents: "none" }}
              />
            )
          })}
        </g>
      </svg>
    )
  }

  const resetAOI = (index) => {
    const newAOIs = [...aois]
    let aoi = aois[index]
    aoi.isSelected = false
    newAOIs.splice(index, 1, aoi)
    setAOIs(newAOIs)
  }

  const showAOIs = () => {
    const left = videoElement ? parseInt(videoElement.offsetLeft) : 0

    if (aois !== undefined) {
      return (
        <svg
          id={"AOICanvas"}
          style={{ left: left, pointerEvents: "none" }}
          className="AOICanvas"
          width={videoWidth}
          height={videoHeight}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {aois.map((aoi, index) => {
            if (
              props.task.showAOIs ||
              aoi.isFilledYellow ||
              aoi.isSelected ||
              aoi.isAcknowledged
            ) {
              return (
                <AOIComponent
                  aoi={aoi}
                  key={index}
                  index={index}
                  resetAOI={(index) => resetAOI(index)}
                />
              )
            }
          })}
        </svg>
      )
    } else {
      return null
    }
  }

  const handleVideoLoaded = () => {
    if (videoRef && videoRef.current) {
      setVideoElement(video)
      setVideoHeight(videoRef.current.clientHeight)
      setVideoWidth(videoRef.current.clientWidth)

      //set timer for registration time and alarm time
      alarmTimer = setTimeout(() => checkAlarm(), props.task.alarmWindowStart)
      endAlarmTimer = setTimeout(
        () => endAlarm(),
        props.task.alarmWindowStart + props.task.alarmWindowDuration
      )

      registrationTimer = setTimeout(
        () => eventStore.setGazeListener("on", onGazeEvent),
        props.task.registrationWindowStart
      )
      endRegistrationTimer = setTimeout(
        () => eventStore.setGazeListener("off", onGazeEvent),
        props.task.registrationWindowStart +
          props.task.registrationWindowDuration
      )
    }
  }

  if (aois) {
    return (
      <div className="videoContainer">
        <audio
          src={audioFileSrc}
          ref={audioRef}
          style={{ display: "none" }}
          onEnded={replayAudioSound}
        ></audio>

        <video
          controls
          autoPlay
          ref={videoRef}
          className={
            props.task.fullScreenImage ? "fullScreenVideo" : "videoCanvas"
          }
          onLoadedData={handleVideoLoaded}
        >
          <source src={"/Videos/" + props.task.image} type="video/mp4"></source>
        </video>

        {getClickableComponent()}
        {showFixationForTesting()}
        {showAOIs()}
      </div>
    )
  } else {
    return (
      <Typography
        variant="h2"
        color="textPrimary"
        style={{ position: "absolute", left: "50%", top: "50%" }}
      >
        Loading...
      </Typography>
    )
  }
}

export default VideoComponent
