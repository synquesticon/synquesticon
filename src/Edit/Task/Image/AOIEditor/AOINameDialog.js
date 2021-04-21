import React from "react"
import DialogTitle from "@material-ui/core/DialogTitle"
import DialogContent from "@material-ui/core/DialogContent"
import DialogActions from "@material-ui/core/DialogActions"
import Dialog from "@material-ui/core/Dialog"
import Button from "@material-ui/core/Button"
import TextField from "@material-ui/core/TextField"

const AOINameDialog = (props) => {
  let name = ""
  let startTimeValue = null
  let endTimeValue = null
  let numberSufficentFixation = null

  const onClose = () => {
    if (name !== "") {
      props.closeDialog(name, startTimeValue, endTimeValue, numberSufficentFixation)
    }
  }

  name = props.name
  var label = ""
  if (name !== "") {
    label = "Change"
  } else {
    label = "Create"
  }

  const videoOption = props.isVideo ? (
    <DialogContent>
      <TextField
        required
        padding="dense"
        id="taskComment"
        defaultValue={startTimeValue}
        label="Watch Time Start (ms)"
        onChange={(e) => (startTimeValue = e.target.value)}
        fullWidth
        multiline
        rows="5"
      />
      <TextField
        required
        padding="dense"
        id="taskComment"
        defaultValue={endTimeValue}
        label="Watch Time End (ms)"
        onChange={(e) => (endTimeValue = e.target.value)}
        fullWidth
        multiline
        rows="5"
      />
      <TextField
        required
        padding="dense"
        id="taskComment"
        defaultValue={numberSufficentFixation}
        label="Sufficient Fixations"
        onChange={(e) => (numberSufficentFixation = e.target.value)}
        fullWidth
        multiline
        rows="5"
      />
    </DialogContent>
  ) : null

  return (
    <Dialog
      open={props.openDialog}
      onClose={props.closeDialog}
      aria-labelledby="form-dialog-title"
      fullWidth={true}
      maxWidth="md"
    >
      <DialogTitle id="form-dialog-title" variant="h5">
        AOI Specification
      </DialogTitle>
      <DialogContent>
        <TextField
          required
          padding="dense"
          id="taskComment"
          defaultValue={name}
          label="AOI Name"
          fullWidth
          multiline
          rows="5"
          onChange={(e) => {
            name = e.target.value
          }}
        />
      </DialogContent>
      {videoOption}
      <DialogActions>
        <Button onClick={(e) => props.closeDialog("")} variant="outlined">
          Cancel
        </Button>
        <Button onClick={onClose} variant="outlined">
          {label}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AOINameDialog
