import React from 'react'
import Button from '@material-ui/core/Button'
import CommentIcon from '@material-ui/icons/ModeCommentOutlined'
import { withTheme } from '@material-ui/styles'
import './ObserverMessage.css'

const observerMessage = props => {  
  return (
    <div style={{ display: 'flex', position: 'relative', flexDirection: 'row', flexGrow: 1, flexShrink: 1, minWidth: 10, marginTop: 0 }}>
      <div style={{ display: 'flex', position: 'relative', flexGrow: 1, flexShrink: 1, minWidth: 10, height: '100%' }}>
        {props.message}
      </div>
      <Button style={{ display: 'flex', position: 'relative', flexGrow: 0, flexShrink: 0, height: 25, width: 25, maxWidth: 25 }}
        onClick={() => props.onCommentButtonPressed(props.message)} >
        <CommentIcon className="flippedCommentIcon" style={{ display: 'flex', position: 'absolute', height: '100%', width: '100%' }} />
      </Button>
    </div>
  )
}

export default withTheme(observerMessage)