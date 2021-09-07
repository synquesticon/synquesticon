import React, { useState, useEffect, useRef } from "react"
import mqtt from "../../core/mqtt"
import audioFileSrc from './Sounds/cesium.wav'
import eventStore from '../../core/eventStore'
import store from "../../core/store"
import * as playerUtils from "../../core/player_utility_functions"
import AOIComponent from "../../Edit/Task/Image/AOIEditor/AOIComponent"
import makeLogObject from "../../core/makeLogObject"
import "./css/Image.css"

let CLICK_RADIUS = "1"
let OPACITY = "0.5"
let COLOR = "red"

const VideoComponent = (props) => {
  const videoRef = useRef()
  const clicksRef = useRef()
  let timer = null

  const [shouldPlayAlarmSound, setShouldPlayAlarmSound] = useState(false)
  const [videoWidth, setVideoWidth] = useState(100)
  const [videoHeight, setVideoHeight] = useState(100)
  const [videoElement, setVideoElement] = useState(null)
  const [AOICount, setAOICCount] = useState({})
  const [clicks, setClicks] = useState([])
  const audioSound = new Audio(audioFileSrc)
  const [aois, setAOIs] = useState(props.task.aois)
  let video = null

  useEffect(() => {
    clicksRef.current = [...clicks]
    video = new Image()
    video.src = "/Videos/" + props.task.video
    video.ref = videoRef

    if (props.task.aois.length > 0) {
      let aois = props.task.aois.slice()
      aois.forEach((aoi) => {
        aoi.videoRef = videoRef
        aoi.isSelected = false
        aoi.isFilledYellow = false
        AOICount[aoi.name] = 0
      })
      setAOIs(aois)


      console.log(AOICount)

      store.dispatch({
        type: "ADD_AOIS",
        aois: aois,
      })

      timer = setInterval(soundAlarm, 100)

      eventStore.setGazeListener("on", onGazeEvent)

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
      eventStore.setGazeListener("off", onGazeEvent)
    }
  }, [])

  useEffect(() => {
    clicksRef.current = clicks.slice()
  }, [clicks])

  const getMousePosition = (e) => {
    let videoRect = e.target.getBoundingClientRect()
    let x = (e.clientX - videoRect.left) / videoRect.width
    let y = (e.clientY - videoRect.top) / videoRect.height
    return {
      x: x,
      y: y
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
      y: newY
    }

  }

  const soundAlarm = () => {
    // console.log("Check at " + videoRef.current.currentTime)
    aois.map((aoi, index) => {
      if (AOICount[aoi.name] < aoi.numberSufficentFixation &&
        videoRef.current.currentTime * 1000 >= aoi.startTime &&
        videoRef.current.currentTime * 1000 <= aoi.endTime) {
        setShouldPlayAlarmSound(true)
        
        let newAOI = aoi
        newAOI.isFilledYellow = true
        let tempAOIs = [...aois]
        tempAOIs.splice(index, 1, newAOI)
        setAOIs(tempAOIs)


        audioSound.play().finally(
          () => {
            if (shouldPlayAlarmSound === true && audioSound.pause) {
              audioSound.play()
            }
          }
        )
      } else if(aoi.numberSufficentFixation && AOICount[aoi.name] >= aoi.numberSufficentFixation){
        let newAOI = aoi
        newAOI.isAcknowledged = true
        let tempAOIs = [...aois]
        tempAOIs.splice(index, 1, newAOI)
        setAOIs(tempAOIs)
        setShouldPlayAlarmSound(false)
      } 
      else {
        let newAOI = aoi
        newAOI.isFilledYellow = false
        let tempAOIs = [...aois]
        tempAOIs.splice(index, 1, newAOI)
        setAOIs(tempAOIs)
        setShouldPlayAlarmSound(false)
      }
    })
  }

  const onGazeEvent = () => {
    const gazeData = JSON.parse(eventStore.getGazeData())
    const fixationArray = gazeData.data.filter(datum => datum.isFixation === true)
    fixationArray.map(fixationGaze => {
      let gazePos = getFixationPosition(fixationGaze.gaze.x, fixationGaze.gaze.y, videoRef)
      let hitAOIs = checkGazeHitAOI(gazePos.x * window.innerWidth, gazePos.y * window.innerHeight, videoRef)

      let fixation = {
        hitAOIs: hitAOIs,
        x: gazePos.x,
        y: gazePos.y
      }

      hitAOIs.map(hitAOI =>
        AOICount[hitAOI] = AOICount[hitAOI] + 1
      )

      setClicks([...clicks, fixation])



      console.log("Count: ", AOICount)
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

      if (playerUtils.pointIsInPoly([gazeX, gazeY], polygon))
        pointInsideAOIs.push(a.name)
    })

    if (pointInsideAOIs.length > 0)
      return pointInsideAOIs
    else
      return ["Background"]
  }

  const onVideoClicked = (e) => {
    let mouseClick = getMousePosition(e)
    const hitAOIs = checkHitAOI(e)
    let click = {
      hitAOIs: hitAOIs,
      x: mouseClick.x,
      y: mouseClick.y,
    }
    // console.log(click)
    // console.log(e.clientX, e.clientY)
    setClicks([...clicks, click])

    hitAOIs.map((hitAOI) => {
      AOICount[hitAOI] = AOICount[hitAOI] + 1
      let newAOIs = aois.slice()
      newAOIs.map(aoi => {
        if (aoi.name === hitAOI) {
          aoi.isSelected = !aoi.isSelected
        }
      }      
      )
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
          {/* <g stroke="none" fill="black">
            {clicks.map((item, index) => {
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
          </g> */}
        </svg>
      )
    } else return null
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
            if (props.task.showAOIs || aoi.isFilledYellow || aoi.isSelected) {
              return <AOIComponent aoi={aoi} key={index} index={index} resetAOI={(index) => resetAOI(index)}/>            }
          })}
        </svg>
      )
  }

  const handleVideoLoaded = () => {
    if (videoRef && videoRef.current) {
      setVideoElement(video)
      console.log('Height ', videoRef.current.clientHeight)
      console.log('Width ', videoRef.current.clientWidth)
      console.log('Offset height', videoRef.current.offsetHeight)
      console.log('Offset width ', videoRef.current.offsetWidth)

      setVideoHeight(videoRef.current.clientHeight)
      setVideoWidth(videoRef.current.clientWidth)      
    }
  }

  return (
    <div className="videoContainer">
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
      {showAOIs()}
    </div>
  )
}

export default VideoComponent
