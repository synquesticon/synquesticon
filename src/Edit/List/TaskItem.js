import React from 'react'
import Button from '@material-ui/core/Button'
import DragIcon from '@material-ui/icons/ControlCamera'
import { Typography } from '@material-ui/core'
import { withTheme } from '@material-ui/styles'
import * as dnd from '../../core/beautifulDND.js'
import './TaskItem.css'

const TaskItem = props => {
  let setRef = ref => {     // give the dom ref to react-beautiful-dnd
    props.domRef(ref)
  }

  let leftBG = props.theme.palette.type === "light" ? props.theme.palette.primary.dark : props.theme.palette.primary.main

  if (props.provided === undefined) return null

  const highlightColor = (props.highlight) ? { backgroundColor: props.theme.palette.secondary.main + "66" } : null
  const dragButton = props.dragEnabled ? 
    <div className="listItemDragBtnContainer" style={{ backgroundColor: (props.isDragging ? props.theme.palette.secondary.main + "66" : leftBG) }}>
      <Button style={{ cursor: 'move', width: '100%', height: '100%', minWidth: '30px', minHeight: '30px' }} className="listItemDragBtn" size="small" fullWidth >
        <DragIcon className="dragBtnIcon" />
      </Button>
    </div> : null
  const dragStyle = dnd.getItemStyle( props.snapshot, props.provided.draggableProps.style, leftBG, leftBG)

  return (
    <div ref={setRef}{...props.provided.draggableProps}{...props.provided.dragHandleProps}
      className={"listItem"} style={{ ...dragStyle, ...{ opacity: (props.isDragging ? 0.8 : 1) }, ...highlightColor }}
      onClick={() => props.onSelectedCallback(props.task)}>
      <div className="listItemTextContainer" >
        <div className="listItemText">
          <Typography color="textPrimary" noWrap> {props.content} </Typography>
        </div>
      </div>
      {dragButton}
    </div>
  )
}

export default withTheme(TaskItem)