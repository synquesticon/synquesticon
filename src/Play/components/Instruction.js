import React, { useEffect, useRef } from 'react'
import { Typography } from '@material-ui/core'
import store from '../../core/store'

const InstructionViewComponent = props => {
  const textRef = useRef()

  if (props.newTask) {
    props.answerCallback({
      responses: [],
      correctlyAnswered: "notApplicable",
      mapID: props.mapID,
    })
  }

  useEffect(() => {
    store.dispatch({
      type: 'ADD_AOIS',
      aois: {
        name: props.parentSet + '_' + props.task.displayText,
        boundingbox: [],
        imageRef: textRef.current
      }
    })
  }, [])

  return (
    <div className={props.className}>
      <Typography ref={textRef} variant="h3" color="textPrimary" align="center" style={{ whiteSpace: "pre-line" }}>{props.task.displayText}</Typography>
    </div>
  )
}

export default InstructionViewComponent