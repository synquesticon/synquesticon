import React, { useState, useEffect, useRef } from 'react'
import mqtt from '../../core/mqtt'
import store from '../../core/store'
import * as playerUtils from '../../core/player_utility_functions'
import AOIComponent from '../../Edit/Task/Image/AOIEditor/AOIComponent'
import makeLogObject from '../../core/makeLogObject'
import uuid from 'react-uuid'
import './css/Image.css'

let CLICK_RADIUS = "1"
let OPACITY = "0.5"
let COLOR = "red"

const VideoComponent = props => {
  const videoRef = useRef()
  const clicksRef = useRef()
  const shouldTurnOffAlarmRef = useRef()
  let timer = null
  
  const [shouldTurnOffAlarm, setShouldTurnOffAlarm] = useState(false)
  const [videoWidth, setVideoWidth] = useState(100)
  const [videoHeight, setVideoHeight] = useState(100)
  const [videoElement, setVideoElement] = useState(null)
  const [clicks, setClicks] = useState([])
  let video = null

  useEffect(() => {
    clicksRef.current = [...clicks]
    video = new Image()
    video.src = "/Videos/" + props.task.video
    video.ref = videoRef

    shouldTurnOffAlarmRef.current = shouldTurnOffAlarm

    if (props.task.aois.length > 0) {
      let aois = props.task.aois.slice()
      aois.forEach(aio => { aio.videoRef = videoRef })

      store.dispatch({
        type: 'ADD_AOIS',
        aois: aois
      })

      timer = setInterval(soundAlarm, 1000)

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
      //     type: "IMAGE",
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
      clearInterval(timer)
      window.removeEventListener("resize", handleVideoLoaded)
    }
  }, [])

  useEffect(() => {
    clicksRef.current = clicks.slice()
  }, [clicks])

  const getMousePosition = e => {
    let videoRect = e.target.getBoundingClientRect();
    return {
      x: (e.clientX - videoRect.left) / videoRect.width,
      y: (e.clientY - videoRect.top) / videoRect.height
    }
  }

  const soundAlarm = () => {
    console.log("Value", shouldTurnOffAlarmRef.current)
    if(shouldTurnOffAlarmRef.current === false && videoRef.current.currentTime > 10){
      alert('Alarm sound!!!')
      clearInterval(timer)
    }
  }

  const normalizeBoundingBoxes = (boundingBox, videoDivRectangle, polygonList) => {
    let x = boundingBox[0] * videoDivRectangle.width / 100 + videoDivRectangle.x
    let y = boundingBox[1] * videoDivRectangle.height / 100 + videoDivRectangle.y
    return [x, y]
  }

  const checkHitAOI = click => {
    // let aois = store.getState().aois
    let aois = props.task.aois
    let pointInsideAOIs = []

    aois.map(a => {
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
        polygon.push([videoDivRect.x + videoDivRect.width, videoDivRect.y + videoDivRect.height])
        polygon.push([videoDivRect.x, videoDivRect.y + videoDivRect.height])
      }

      if (playerUtils.pointIsInPoly([click.clientX, click.clientY], polygon))
        pointInsideAOIs.push(a.name)
    })

    if (pointInsideAOIs.length > 0)
      return pointInsideAOIs
    else
      return ["Background"]
  }

  const onVideoClicked = e => {
    let mouseClick = getMousePosition(e)
    let click = {
      hitAOIs: checkHitAOI(e),
      x: mouseClick.x,
      y: mouseClick.y,
    }
    setClicks([...clicks, click])

    const AOICount = {}
    props.task.aois.forEach(aoi => { AOICount[aoi.name] = 0 })
    clicks.map(click => click.hitAOIs.map(aoi => AOICount[aoi]++))
    
    console.log("Count: ", AOICount)
    // hardcode
    if(AOICount[props.task.aois[0].name] >= 3 && videoRef.current.currentTime <= 10){
      console.log('Now off')
      shouldTurnOffAlarmRef.current = setShouldTurnOffAlarm(true)
    }

  }

  const getClickableComponent = () => {
    if (props.task.recordClicks) {
      const left = (videoElement) 
        ? parseInt(videoElement.offsetLeft) 
        : 0

      return (
        <svg onClick={onVideoClicked} style={{ left: left }} className="clickableCanvas"
          width={videoWidth} opacity={OPACITY} height={videoHeight} viewBox="0 0 100 100"
          preserveAspectRatio="none">
          <g stroke="none" fill="black">
            {clicks.map((item, index) => {
              return <ellipse key={index} cx={item.x * 100} cy={item.y * 100} rx={CLICK_RADIUS}
                ry={CLICK_RADIUS * 1.8} fill={COLOR} style={{ pointerEvents: 'none' }} />
            })}
          </g>
        </svg>)
    } else return null
  }

  const showAOIs = () => {
    if (props.task.showAOIs) {
      const left = (videoElement) ? parseInt(videoElement.offsetLeft) : 0

      return (
        <svg id={"AOICanvas"} style={{ left: left, pointerEvents: 'none' }} className="AOICanvas"
          width={videoWidth} height={videoHeight} viewBox="0 0 100 100" preserveAspectRatio="none">
          {props.task.aois.map((aoi, index) => {
            return <AOIComponent aoi={aoi} key={index} />
          })}
        </svg>
      )
    } else return null
  }

  const handleVideoLoaded = () => {
    if (videoRef && videoRef.current) {
      let video = videoRef.current
      setVideoHeight(video.clientHeight)
      setVideoWidth(video.clientWidth)
      setVideoElement(video)
    }
  }

  return (
    <div className="imagePreviewContainer">
        <video controls autoPlay ref={videoRef} className={props.task.fullScreenImage ? "fullScreenImage" : "videoCanvas"} onLoadedData={handleVideoLoaded}>
            <source src={"/Videos/" + props.task.image} type="video/mp4"
            ></source>
        </video>
        {getClickableComponent()}
        {showAOIs()}

    </div>
  )
}

export default VideoComponent