import React, { useState, useEffect } from 'react'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'
import Dialog from '@material-ui/core/Dialog'
import { withTheme } from '@material-ui/styles'
import Button from '@material-ui/core/Button'
import db_helper from '../../../core/db_helper'
import './BrowseImagesDialog.css'

const BrowseFileDialog = props => {
  const [files, setFiles] = useState([])
  const [pickedFile, setPickedFile] = useState(null)

  useEffect(() => {
    if(props.isVideo){
      db_helper.getAllVideos((vids) => setFiles(vids))
    } else {
      db_helper.getAllImages((imgs) => setFiles(imgs))
    }
    
  }, [])

  var buttonContainerHeight = 60
  var buttonHeight = buttonContainerHeight - 4
  var imageRow = []
  var rowContent = []

  return (
    <Dialog
      open={props.openDialog}
      onClose={props.closeDialog}
      aria-labelledby="form-dialog-title"
      fullWidth={true}
      maxWidth='md'
    >
      <DialogTitle style={{ height: 30 }} id="form-dialog-title">Select Image</DialogTitle>
      <DialogContent style={{ display: 'flex', flexDirection: 'row', flexGrow: 1, minHeight: 100, maxHeight: '80%', overflowY: 'auto' }}>
        {
          files.map((file, ind) => {
            var url = props.isVideo?"Videos/" + file+"#t=0.1":"Images/" + file
            var borderStyle = null
            if (pickedFile === file) {
              borderStyle = { borderWidth: 3, borderStyle: 'solid', borderColor: props.theme.palette.secondary.main }
            }

            if(props.isVideo){
              rowContent.push(<video src={url}
              alt="Task" className="image"
              style={borderStyle} key={"vid" + ind}
              onClick={() => setPickedFile(file)} />)
            } else {
              rowContent.push(<img src={url}
                alt="Task" className="image"
                style={borderStyle} key={"img" + ind}
                onClick={() => setPickedFile(file)} />)
            }

            if (ind + 1 % 4 === 0) {
              imageRow.push(<span key={"ispan" + ind}>{rowContent}</span>)
              rowContent = []
            }

            if (files.length - 1 === ind) {
              if (rowContent.length > 0)
                imageRow.push(<span key={"ispan" + ind}>{rowContent}</span>);
              return imageRow
            }
            return null
          })
        }
      </DialogContent>
      <DialogActions style={{ height: buttonContainerHeight }}>
        <Button style={{ height: buttonHeight }} onClick={props.closeDialog} variant="outlined">
          CANCEL
          </Button>
        <Button style={{ height: buttonHeight }} onClick={() => props.onPickImage(pickedFile)} variant="outlined">
          OK
          </Button>
      </DialogActions>
    </Dialog>
  )
}

export default withTheme(BrowseFileDialog)