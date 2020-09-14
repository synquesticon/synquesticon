import React from 'react'
import Button from '@material-ui/core/Button'
import DragIcon from '@material-ui/icons/ControlCamera'
import DeleteIcon from '@material-ui/icons/Delete'
import { withTheme } from '@material-ui/styles'
import { Typography } from '@material-ui/core'
import * as listUtils from '../../core/db_objects_utility_functions'
import * as dbOjects from '../../core/db_objects'
import CollapsableContainer from '../Containers/CollapsableContainer'
import './ListItem.css'

const EditSetListItem = props => {
  const removeTask = () => {
    props.removeCallback(props._id ? props._id : props.item._id)
  }

  const headerHeight = 40
  const task = <div className={"editListItemTextContainer "}>
    <div className="editListItemText">
      <Typography color="textPrimary" noWrap> {props.content} </Typography>
    </div>
  </div>

  if (props.item.objType === "Task" || props.item.objType === dbOjects.ObjectTypes.TASK) {
    if (props.componentDepth === 0) { //If it is a top level parent it should be dragable
      return (
        <div className={"editListItem "} >
          {task}
          <div className="editListItemDelBtnContainer">
            <Button style={{ cursor: 'pointer', width: '100%', height: headerHeight, minWidth: '30px', minHeight: '30px' }}
              size="small" onClick={removeTask}>
              <DeleteIcon />
            </Button>
          </div>
          <div className="editListItemDragBtnContainer">
            <Button style={{ cursor: 'move', width: '100%', height: headerHeight, minWidth: '30px', minHeight: '30px' }}
              size="small" >
              <DragIcon />
            </Button>
          </div>
        </div>)
    } else {               //If it is a child we don't want it to be draggable
      return (<div className={"editListItem "} >
        {task}
      </div>)
    }
  } else if (props.item.objType === dbOjects.ObjectTypes.SET) { //Is a node with children
    const newDepth = props.componentDepth + 1
    let collapsableContent = props.item.data.map((data, index) => {
      return <EditSetListItem key={index} removeCallback={props.removeTaskCallback} 
        item={data} content={listUtils.getTaskContent(data)} componentDepth={newDepth} />
    })

    collapsableContent = <div className="collapsedItemListWrapper">{collapsableContent}</div>

    let dragSource = null
    if (props.componentDepth === 0) {
      dragSource =
        <div>
          <div className="editListItemDelBtnContainer">
            <Button style={{ cursor: 'pointer', width: '100%', height: headerHeight, minWidth: '30px', minHeight: '30px' }}
              size="small" onClick={removeTask} >
              <DeleteIcon className="delBtnIcon" />
            </Button>
          </div>
          <div className="editListItemDragBtnContainer">
            <Button style={{ cursor: 'move', width: '100%', height: headerHeight, minWidth: '30px', minHeight: '30px' }}
              size="small" >
              <DragIcon className="dragBtnIcon" />
            </Button>
          </div>
        </div>

      return (
        <div content={props.content} style={{ width: '100%' }}>
          <CollapsableContainer content={props.content} classNames="editSetCompContainer"
            contentClassNames="editSetCompContent" headerComponents={dragSource} open={false} headerHeight={headerHeight}
            headerClassNames="editSetCompHeader" hideHeaderComponents={false} headerTitle={props.item.name}
            titleVariant="body1" indentContent={20}>
            {collapsableContent}
          </CollapsableContainer>
        </div>)
    }

    return (
      <div style={{ paddingLeft: 20 * props.componentDepth, width: '100%' }}>
        <CollapsableContainer classNames="editSetCompContainer" contentClassNames="editSetCompContent" headerComponents={dragSource} open={false}
          headerClassNames="editSetCompHeader" hideHeaderComponents={false} headerTitle={props.item.name} headerHeight={headerHeight}
          headerWidth={{ flexGrow: 1 }} titleVariant="body1" indentContent={10}>
          {collapsableContent}
        </CollapsableContainer></div>
    )
  }
  return null
}

export default withTheme(EditSetListItem)