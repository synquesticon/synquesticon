import React from 'react'
import Button from '@material-ui/core/Button'
import DragIcon from '@material-ui/icons/ControlCamera'
import { Typography } from '@material-ui/core'
import { withTheme } from '@material-ui/styles'
import * as dnd from '../../core/beautifulDND.js'
import './css/TaskList.css'

const TaskItem = props => {
  const setRef = ref => {       // give the dom ref to react-beautiful-dnd
    props.domRef(ref)
  }

  const { theme, provided, isDragging, snapshot } = props
  let leftBG = theme.palette.type === "light" ? theme.palette.primary.dark : theme.palette.primary.main

  if (provided === undefined) return null

  const highlightColor = (props.highlight)
    ? { backgroundColor: theme.palette.secondary.main + "66" }
    : null

  const dragButton = props.dragEnabled ?
    <div className="synquestiListItemDragBtnContainer"
      style={{ backgroundColor: isDragging ? theme.palette.secondary.main + "66" : leftBG }}>
      <Button style={{ cursor: 'move', width: '100%', height: '100%', minWidth: '30px', minHeight: '30px' }}
        className="synquestiListItemDragBtn" size="small" fullWidth >
        <DragIcon className="synquestiDragBtnIcon" />
      </Button>
    </div> : null

  const dragStyle = dnd.getItemStyle(
    snapshot.isDragging,
    provided.draggableProps.style,
    leftBG,
    leftBG
  )

  return (
    <div ref={setRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={"synquestiListItem " + props.marginClass}
      style={{ ...dragStyle, ...{ opacity: isDragging ? 0.8 : 1 }, ...highlightColor }}>
      <div className="synquestiListItemTextContainer" >
        <div className="synquestiListItemText">
          <Typography color="textPrimary" noWrap> {props.content} </Typography>
        </div>
      </div>
      {dragButton}
    </div>
  )
}

export default withTheme(TaskItem)