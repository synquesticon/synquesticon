import React, { useState, useEffect, useRef } from "react"
import AOIComponent from "./AOIComponent"
import "./AOIEditorComponent.css"

const AOIImageViewComponent = (props) => {
  const [imageWidth, setImageWidth] = useState()
  const [imageHeight, setImageHeight] = useState(100)
  const [imageElement, setImageElement] = useState(null)

  const imageRef = useRef()
  const videoRef = useRef()

  const onSelectAOI = (aoi) => {
    if (props.onSelectAOI !== undefined) props.onSelectAOI(aoi)
  }

  useEffect(() => {
    let url = "/Images/" + props.imageName
    if (props.image) {
      url = URL.createObjectURL(props.image)
      const img = document.createElement("img")
      img.src = url
    }
  }, [])

  useEffect(() => {
    console.log(imageHeight)
    console.log(imageWidth)
  }, [imageHeight])

  const handleImageLoaded = () => {
    const image = imageRef.current
    setImageHeight(image.height)
    setImageWidth(image.width)
    setImageElement(image)
  }

  const handleVideoLoaded = () => {
    const video = videoRef.current
    // setImageHeight(video.height)
    setImageHeight(video.clientHeight)
    setImageWidth(video.clientWidth)
    setImageElement(video)
  }

  const tempAOI =
    props.mode !== "SELECT" ? <AOIComponent aoi={props.tempAOI} /> : null

  let url = props.image
    ? (url = URL.createObjectURL(props.image))
    : "/Images/" + props.imageName

  if (props.isVideo) {
    url = "/Videos/" + props.imageName + "#t=0.1"
  }

  const left = imageElement ? parseInt(imageElement.offsetLeft) : 0

  const displayImage = props.isVideo ? (
    <video
      className="videoCanvas"
      id="videoCanvas"
      src={url}
      alt="Task"
      ref={videoRef}
      onLoadedData={handleVideoLoaded}
    />
  ) : (
    <img
      className="imageCanvas"
      src={url}
      alt="Task"
      ref={imageRef}
      onLoad={handleImageLoaded}
    />
  )

  return (
    <div
      className="imagePreviewContainer"
      onMouseDown={props.onMouseDown}
      onMouseUp={props.onMouseUp}
      onMouseMove={props.onMouseMove}
    >
      {displayImage}
      <svg
        style={{ left: left }}
        id="AOICanvas"
        className="AOICanvas"
        width={imageWidth}
        height={imageHeight}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {tempAOI}
        {props.aois.map((aoi, index) => {
          return (
            <AOIComponent
              aoi={aoi}
              key={index}
              onSelected={(e) => onSelectAOI(aoi)}
            />
          )
        })}
      </svg>
    </div>
  )
}

export default AOIImageViewComponent
