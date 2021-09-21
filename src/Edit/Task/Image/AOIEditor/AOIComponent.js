import React, { useEffect, useState } from "react"
import { withTheme } from "@material-ui/styles"
import "./AOIEditorComponent.css"

const AOIComponent = (props) => {
  let theme = props.theme

  let timer = null

  useEffect(() => {
    if (props.aoi.isSelected === true && props.resetAOI !== undefined) {
      timer = setTimeout(() => props.resetAOI(props.index), 3000)
    }

    return () => clearTimeout(timer)
  }, [props.aoi.isSelected])

  if (props.aoi.boundingbox.length <= 0) {
    return <div className="AOI" />
  }

  let pathData = []

  props.aoi.boundingbox.map((point, index) => {
    pathData.push(point[0] + " " + point[1])
    return 1
  })

  let borderColor = "none"
  let strokeDashArray = "none"
  if (props.aoi.isSelected === true) {
    borderColor = "blue"
    strokeDashArray = "0.5,1"
  } else if(props.aoi.isAcknowledged){
    borderColor = "yellow"
  } else {
    borderColor = theme.palette.secondary.main
  }

  let fillColor = null

  if (props.aoi.isFilledYellow) {
    fillColor = "yellow"
  } else {
    fillColor = "none"
  }

  const path = pathData.join(" ")

  const strokeWidth = "0.5"

  return (
    <g
      onClick={props.onSelected}
      fontSize="3"
      fontFamily="sans-serif"
      fill="black"
      stroke="none"
    >
      <polygon
        points={path}
        stroke={borderColor}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDashArray}
        fill={fillColor}
      />
    </g>
  )

  // if (props.aoi.isSelected) {
  //   return (
  //     <g onClick={props.onSelected} fontSize="3" fontFamily="sans-serif" fill="black" stroke="none">
  //       <polygon points={path} stroke={color} strokeWidth={strokeWidth}
  //         fill={props.aoi.isFilledYellow ? "yellow" : "none"} />
  //       {props.aoi.boundingbox.map((p, ind) => {
  //         return <circle key={ind} cx={p[0]} cy={p[1]} r="0.75" stroke="black" fill="white" strokeWidth={strokeWidth} />
  //       })}
  //       {/* <text className="AOIName" x={p1[0]} y={p1[1]} dy="-1" fill={textColor}>{props.aoi.name}</text> */}
  //     </g>
  //   )
  // } else {
  //   return (
  //     <g onClick={props.onSelected} fontSize="3" fontFamily="sans-serif" fill="black" stroke="none">
  //       <polygon points={path} stroke={color} strokeWidth={strokeWidth}
  //         fill={props.aoi.isFilledYellow ? "yellow" : "none"} />
  //       {/* <text className="AOIName" x={p1[0]} y={p1[1]} dy="-1" stroke={textBGColor} strokeWidth="0.4em">{props.aoi.name}</text> */}
  //       {/* <text className="AOIName" x={p1[0]} y={p1[1]} dy="-1" fill={textColor}> {props.aoi.name} </text> */}
  //     </g>
  //   )
  // }
}

export default withTheme(AOIComponent)
