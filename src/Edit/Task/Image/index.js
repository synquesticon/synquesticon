import React, { useState } from "react"
import FileSelector from "../../../core/fileSelector"
import { Typography, TextField } from "@material-ui/core"
import Button from "@material-ui/core/Button"
import Checkbox from "@material-ui/core/Checkbox"
import FormControlLabel from "@material-ui/core/FormControlLabel"
import AOIEditorComponent from "./AOIEditor/AOIEditorComponent"
import BrowseFileDialog from "./BrowseImagesDialog"
import "./Image.css"

const ImageTaskType = (props) => {
  const [selectedImage, setSelectedImage] = useState(
    props.task ? props.task.image : ""
  )
  const [recordClicks, setRecordClicks] = useState(
    props.task ? props.task.recordClicks : false
  )
  const [alarmWindowStart, setAlarmWindowStart] = useState(
    props.task ? props.task.alarmWindowStart : ""
  )
  const [alarmWindowDuration, setAlarmWindowDuration] = useState(
    props.task ? props.task.alarmWindowDuration : ""
  )

  const [registrationWindowStart, setRegistrationWindowStart] = useState(
    props.task ? props.task.registrationWindowStart : ""
  )
  const [registrationWindowDuration, setRegistrationWindowDuration] = useState(
    props.task ? props.task.registrationWindowDuration : ""
  )
  const [isVideo, setIsVideo] = useState(props.isVideo ? props.isVideo : false)
  const [fullScreenImage, setFullScreenImage] = useState(
    props.task ? props.task.fullScreenImage : false
  )
  const [showAOIs, setShowAOIs] = useState(
    props.task ? props.task.showAOIs : false
  )

  const [showFixations, setShowFixations] = useState(
    props.task ? props.task.showFixations : false
  )

  const [openBrowseImage, setOpenBrowseImage] = useState(false)

  let preview = false
  let image = null

  const onRecordClickChanged = (e, checked) => {
    props.task.recordClicks = checked
    setRecordClicks(checked)
  }

  const onShowFullScreenChanged = (e, checked) => {
    props.task.fullScreenImage = checked
    setFullScreenImage(checked)
  }

  const onShowFixationsChanged = (e, checked) => {
    props.task.showFixations = checked
    setShowFixations(checked)
  }

  const onShowAOIsChanged = (e, checked) => {
    props.task.showFixations = checked
    setShowAOIs(checked)
  }

  const onImageFileSelected = (selectedFile) => {
    console.log(selectedFile)
    props.task.image = selectedFile.name
    image = selectedFile
    props.task.aois = []
    preview = true
    props.selectImageCallback(true, image)
    setSelectedImage(props.task.image)
  }

  const onPickImageBrowseImages = (img) => {
    props.task.image = img
    image = null
    props.task.aois = []
    preview = true
    props.selectImageCallback(false, image)
    // setSelectedImage(props.task.image)
    setSelectedImage(img)
    setOpenBrowseImage(false)
  }

  const onAlarmWindowStartChanged = (e) => {
    props.task.alarmWindowStart = e.target.value
    setAlarmWindowStart(e.target.value)
  }

  const onAlarmDurationChanged = (e) => {
    props.task.alarmWindowDuration = e.target.value
    setAlarmWindowDuration(e.target.value)
  }

  const onRegistrationWindowStartChanged = (e) => {
    props.task.registrationWindowStart = e.target.value
    setRegistrationWindowStart(e.target.value)
  }

  const onRegistrationWindowDurationChanged = (e) => {
    props.task.registrationWindowDuration = e.target.value
    setRegistrationWindowDuration(e.target.value)

  }

  const getCheckBoxes = () => {
      return (<div className="imagePickingContainer">
        <FormControlLabel
          label="Record Clicks"
          value="end"
          id={props.uniqueID + "rclick"}
          padding="dense"
          style={{ marginLeft: 5 }}
          checked={recordClicks}
          control={<Checkbox color="secondary" />}
          onChange={onRecordClickChanged}
          labelPlacement="end"
        />
        <FormControlLabel
          label="Show Fullscreen"
          value="end"
          id={props.uniqueID + "fscreen"}
          padding="dense"
          checked={fullScreenImage}
          control={<Checkbox color="secondary" />}
          onChange={onShowFullScreenChanged}
          labelPlacement="end"
        />
        <FormControlLabel
          label="Show AOIs"
          value="end"
          id={props.uniqueID + "saois"}
          padding="dense"
          checked={showAOIs}
          control={<Checkbox color="secondary" />}
          onChange={onShowAOIsChanged}
          labelPlacement="end"
        />
        
        
        {props.isVideo === true ? <FormControlLabel
          label="Show Fixations"
          value="end"
          id={props.uniqueID + "saois"}
          padding="dense"
          checked={showFixations}
          control={<Checkbox color="secondary" />}
          onChange={onShowFixationsChanged}
          labelPlacement="end"
        /> : null
        }
        <Button variant="outlined" onClick={() => setOpenBrowseImage(true)}>
          {isVideo ? "Browse Videos" : "Browse Images"}
        </Button>
        <FileSelector handleSelectionCallback={onImageFileSelected} />
      </div>)
  }

  let previewImage = (
    <div
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Typography color="textPrimary"> "No Image selected" </Typography>
    </div>
  )

  if (selectedImage !== "") {
    previewImage = (
      <AOIEditorComponent
        isVideo={isVideo}
        preview={preview}
        task={props.task}
        image={image}
      />
    )
  }

  return (
    <div className="imageTypeContainer">
      {getCheckBoxes()}
      <TextField
        required
        padding="dense"
        id="taskComment"
        defaultValue={alarmWindowStart}
        label="Alarm time start (ms)"
        onChange={onAlarmWindowStartChanged}
        rows="5"
      />
      <TextField
        required
        padding="dense"
        id="taskComment"
        defaultValue={alarmWindowDuration}
        label="Alarm window duration (ms)"
        onChange={onAlarmDurationChanged}
        rows="5"
      />

      <TextField
        required
        padding="dense"
        id="taskComment"
        defaultValue={registrationWindowStart}
        label="Registration window start (ms)"
        onChange={onRegistrationWindowStartChanged}
        rows="5"
      />
      <TextField
        required
        padding="dense"
        id="taskComment"
        defaultValue={registrationWindowDuration}
        label="Registration window duration (ms)"
        onChange={onRegistrationWindowDurationChanged}
        rows="5"
      />
      <div className="editTaskImagePreview">{previewImage}</div>
      <BrowseFileDialog
        openDialog={openBrowseImage}
        isVideo={isVideo}
        closeDialog={() => setOpenBrowseImage(false)}
        onPickImage={onPickImageBrowseImages}
      />
    </div>
  )
}

export default ImageTaskType
