import React, { Component } from 'react'
import { Typography } from '@material-ui/core'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import Button from '@material-ui/core/Button'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Checkbox from '@material-ui/core/Checkbox'
import TextField from '@material-ui/core/TextField'
import { withTheme } from '@material-ui/styles'
import FileSaver from 'file-saver'
import store from '../core/store'
import db_helper from '../core/db_helper'
import './Export.css'

const GAZE_HEADER = "Timestamp(UTC),X,Y,Left pupil radius,Right pupil radius,Task,Target,database_id\n"

function HEADER(seperator) {
  return ("global_vars" + seperator +
    "content" + seperator +
    "answer" + seperator +
    "answered_correctly" + seperator +
    "correct_answer" + seperator +
    "accepted_margin" + seperator +
    "time_to_first_response" + seperator +
    "time_to_completion" + seperator +
    "comments" + seperator +
    "tags" + seperator +
    "type" + seperator +
    "set_names" + seperator +
    "timestamp_start" + seperator +
    "timestamp_first_response" + seperator +
    "database_id\n" //Note the \n in case more fields are added later
  )
}

class Export extends Component {
  constructor(props) {
    super(props)
    this.state = {
      participants: [],
      delimiter: ',',
      combineFiles: false
    }
    this.pickedParticipants = []
  }

  componentWillMount() {
    db_helper.getAllParticipantsFromDb(ids => {
      this.setState({ participants: ids })
    })
  }

  componenWillUnmount() {
    this.pickedParticipants = []
  }

  onCombineFilesChange() {
    this.setState({ combineFiles: !this.state.combineFiles })
  }

  async handleDeleteSelected() {
    if (this.pickedParticipants.length > 0) {
      store.dispatch({
        type: 'TOAST_SNACKBAR_MESSAGE',
        snackbarOpen: true,
        snackbarMessage: "Deleting data sets"
      })

      this.pickedParticipants.forEach(async participants => {         //Delete each selection synchronously
        await db_helper.deleteParticipantFromDbPromise(participants._id)
      })

      this.pickedParticipants = []        //Empty the user selection

      db_helper.getAllParticipantsFromDb((ids) => {        //Update the list after the deletion have been completed
        store.dispatch({
          type: 'TOAST_SNACKBAR_MESSAGE',
          snackbarOpen: true,
          snackbarMessage: "Deletion completed"
        })
        this.setState({ participants: ids })
      })
    }
  }

  handleDeleteAll() {
    db_helper.deleteAllParticipantsFromDb(() => {
      db_helper.getAllParticipantsFromDb(ids => {
        this.setState({ participants: ids })
      })
    })
  }

  handleClose() { }

  async handleExport() {
    if (this.pickedParticipants.length > 0)
      store.dispatch({
        type: 'TOAST_SNACKBAR_MESSAGE',
        snackbarOpen: true,
        snackbarMessage: "Exporting selected data sets"
      })

    let exported_csv = ""
    let exported_gaze = ""
    let first_file = false
    let file_name = ""
    await Promise.all(this.pickedParticipants.map(async (p, index) => {
      const returnedValue = await db_helper.exportToCSV({ participant: p, delimiter: this.state.delimiter })
      if (this.state.combineFiles) {
        if (!first_file) {
          file_name = "combined_" + returnedValue.file_name
          first_file = true
        }

        exported_csv += returnedValue.csv_string

        if (returnedValue.gaze_data !== undefined && returnedValue.gaze_data)
          exported_gaze += returnedValue.gaze_data
      } else {
        const blob = new Blob([HEADER(this.state.delimiter) + returnedValue.csv_string], { type: 'text/csv' })
        FileSaver.saveAs(blob, returnedValue.file_name + '.csv')

        if (returnedValue.gaze_data !== undefined && returnedValue.gaze_data) {
          const gaze_blob = new Blob([GAZE_HEADER + returnedValue.gaze_data], { type: 'text/csv' })
          FileSaver.saveAs(gaze_blob, returnedValue.file_name + '_gaze.csv')
        }
      }
      return 1
    }))

    if (this.state.combineFiles) {
      const blob = new Blob([HEADER(this.state.delimiter) + exported_csv], { type: 'text/csv' })
      FileSaver.saveAs(blob, file_name + '.csv')

      if (this.state.combineFiles && exported_gaze !== "") {
        const gaze_blob = new Blob([GAZE_HEADER + exported_gaze], { type: 'text/csv' })
        FileSaver.saveAs(gaze_blob, file_name + '_gaze.csv')
      }
    }
    this.handleClose()
  }

  handleExportAll() {
    store.dispatch({
      type: 'TOAST_SNACKBAR_MESSAGE',
      snackbarOpen: true,
      snackbarMessage: "Exporting all data sets"
    })

    if (this.state.combineFiles) {
      db_helper.exportManyToCSV({ participants: this.state.participants, delimiter: this.state.delimiter }, (res) => {
        var blob = new Blob([res.data.csv_string], { type: 'text/csv' })
        FileSaver.saveAs(blob, res.data.file_name + '.csv')
        if (res.data.gaze_data !== undefined) {
          const gaze_blob = new Blob([res.data.gaze_data], { type: 'text/csv' })
          FileSaver.saveAs(gaze_blob, res.data.file_name + '_gaze.csv')
        }
        this.handleClose()
        return 1
      })
    } else {
      this.state.participants.map((p, ind) => {
        db_helper.exportToCSV({ participant: p, delimiter: this.state.delimiter }, (res) => {
          const blob = new Blob([res.data.csv_string], { type: 'text/csv' })
          FileSaver.saveAs(blob, res.data.file_name + '.csv')
          if (res.data.gaze_data !== undefined) {
            const gaze_blob = new Blob([res.data.gaze_data], { type: 'text/csv' })
            FileSaver.saveAs(gaze_blob, res.data.file_name + '_gaze.csv')
          }
          this.handleClose()
          return 1
        })
        return 1
      })
    }
  }

  formatDateTime(t) {
    const d = new Date(t)
    const fillZero = num => {
      if (num < 10) return '0' + num
      else return num
    }
    return(
      d.getFullYear() + '-' + fillZero(d.getMonth() + 1) + '-' + fillZero(d.getDate()) + '_' + fillZero(d.getHours()) + ':' + fillZero(d.getMinutes())
    )
  }

  getParticipantName(p) {
    if (!p.linesOfData || p.linesOfData.length <= 0) return "Empty"       //If there is not data we set the name to "Empty"

    let file_name = ""                        // If there are lines of data avalaible we set the name to be the time of the first recorded data
    if (p.linesOfData && p.linesOfData.length > 0) {
      file_name = this.formatDateTime(p.linesOfData[0].startTimestamp) + '_'
      file_name += p.linesOfData[0].tasksFamilyTree[0]
    }
    if (p.globalVariables.length > 0) {       //If there are saved global variables we append them to the experiment name
      p.globalVariables.sort((a, b) => a.label.localeCompare(b.label))
      p.globalVariables.forEach(globalVar => {
        if (!globalVar.label.toLowerCase().includes("record data"))
          file_name += '_' + globalVar.label + '-' + globalVar.value
      })
    }
    return file_name
  }

  render() {
    return (
      <div className="ExportationModeContainer" style={{ backgroundColor: (this.props.theme.palette.type === "light" ? this.props.theme.palette.primary.main : this.props.theme.palette.primary.dark) }}>
        <List style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, width: '100%', minHeight: 100, maxHeight: 'calc(100% - 100px)', overflowY: 'auto', overflowX: 'hidden' }}>
          {this.state.participants.map( (p, index) => {
            if (this.pickedParticipants.includes(p)) {
              return (
                <ListItem style={{ borderBottom: 'grey solid 1px' }} selected
                  button onClick={ () => {
                    if (this.pickedParticipants.includes(p))
                      this.pickedParticipants.splice(this.pickedParticipants.indexOf(p), 1)
                    else
                      this.pickedParticipants.push(p)
                    this.forceUpdate()
                  }} key={index} >
                  <Typography color="textSecondary">{this.getParticipantName(p)}</Typography>
                </ListItem>
              )
            } else {
              return (
                <ListItem style={{ borderBottom: 'grey solid 1px' }}
                  button onClick={ () => {
                    if (this.pickedParticipants.includes(p))
                      this.pickedParticipants.splice(this.pickedParticipants.indexOf(p), 1)
                    else
                      this.pickedParticipants.push(p)
                    this.forceUpdate()
                  }} key={index} >
                  <Typography color="textPrimary">{this.getParticipantName(p)}</Typography>
                </ListItem>
              )
            }
          })}
        </List>
        <div className="ExportationActions">
          <Typography variant="body1" color="textPrimary">
            {this.pickedParticipants.length} data sets selected 
          </Typography>
          <FormControlLabel label="Combine files"
            value="combineFiles"
            checked={this.state.combineFiles}
            control={<Checkbox color="secondary" />}
            onChange={this.onCombineFilesChange.bind(this)}
            labelPlacement="end"
            style={{ marginLeft: 10 }}
          />
          <TextField label="Delimiter"
            required
            style={{ width: 100 }}
            id="delim"
            defaultValue={this.state.delimiter}
            placeholder=","
            ref="delimiterRef"
            variant="filled"
            onChange={(e) => { this.setState({ delimiter: e.target.value }) }} //state.delimiter = e.target.value
          />

          <Button style={{ height: 50, marginLeft: 20 }} onClick={this.handleExport.bind(this)} variant="outlined">
            Export
          </Button>

          <Button style={{ height: 50, marginLeft: 20 }} onClick={this.handleDeleteSelected.bind(this)} variant="outlined">
            Delete
          </Button>
        </div>
      </div>
    )
  }
}

export default withTheme(Export)