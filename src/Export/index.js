import React, { Component, useState, useEffect } from 'react'
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

const Export = (props) => {
  const [participants, setParticipants] = useState([])
  const [delimiter, setDelimiter] = useState(',')
  const [combineFiles, setCombineFiles] = useState(false)
  const [pickedParticipants, setPickedParticipants] = useState([])



  useEffect(() => {
    db_helper.getAllParticipantsFromDb(ids => {
      setParticipants(ids)
    })
    return () => {
    }
  }, [])

  const onCombineFilesChange = () => {
    setCombineFiles(oldValue => !oldValue)
  }

  const handleDeleteSelected = async () => {
    if (pickedParticipants.length > 0) {
      store.dispatch({
        type: 'TOAST_SNACKBAR_MESSAGE',
        snackbarOpen: true,
        snackbarMessage: "Deleting data sets"
      })

      pickedParticipants.forEach(async deletedParticipant => {         //Delete each selection synchronously
        await db_helper.deleteParticipantFromDbPromise(deletedParticipant._id)
        const myFilter = participants.filter((participant) => participant._id !== deletedParticipant._id)
        setParticipants(myFilter)
      })

      store.dispatch({
        type: 'TOAST_SNACKBAR_MESSAGE',
        snackbarOpen: true,
        snackbarMessage: "Deletion completed"
      })

      setPickedParticipants([])       //Empty the user selection


    }
  }

  const handleDeleteAll = () => {
    db_helper.deleteAllParticipantsFromDb(() => {
      db_helper.getAllParticipantsFromDb(ids => {
        setParticipants(ids)
      })
    })
  }



  // async handleExport() {
  //   if (pickedParticipants.length > 0)
  //     store.dispatch({
  //       type: 'TOAST_SNACKBAR_MESSAGE',
  //       snackbarOpen: true,
  //       snackbarMessage: "Exporting selected data sets"
  //     })

  //   let exported_csv = ""
  //   let exported_gaze = ""
  //   let first_file = false
  //   let file_name = ""
  //   await Promise.all(pickedParticipants.map(async (p, index) => {
  //     const returnedValue = await db_helper.exportToCSV({ participant: p, delimiter: delimiter })
  //     if (combineFiles) {
  //       if (!first_file) {
  //         file_name = "combined_" + returnedValue.file_name
  //         first_file = true
  //       }

  //       exported_csv += returnedValue.csv_string

  //       if (returnedValue.gaze_data !== undefined && returnedValue.gaze_data)
  //         exported_gaze += returnedValue.gaze_data
  //     } else {
  //       const blob = new Blob([HEADER(delimiter) + returnedValue.csv_string], { type: 'text/csv' })
  //       FileSaver.saveAs(blob, returnedValue.file_name + '.csv')

  //       if (returnedValue.gaze_data !== undefined && returnedValue.gaze_data) {
  //         const gaze_blob = new Blob([GAZE_HEADER + returnedValue.gaze_data], { type: 'text/csv' })
  //         FileSaver.saveAs(gaze_blob, returnedValue.file_name + '_gaze.csv')
  //       }
  //     }
  //     return 1
  //   }))

  //   if (combineFiles) {
  //     const blob = new Blob([HEADER(delimiter) + exported_csv], { type: 'text/csv' })
  //     FileSaver.saveAs(blob, file_name + '.csv')

  //     if (combineFiles && exported_gaze !== "") {
  //       const gaze_blob = new Blob([GAZE_HEADER + exported_gaze], { type: 'text/csv' })
  //       FileSaver.saveAs(gaze_blob, file_name + '_gaze.csv')
  //     }
  //   }
  //   
  // }

  const handleClose = () => {

  }
  const handleExport = () => {
    console.log('Here comes the Export click', pickedParticipants)
    if (pickedParticipants.length > 0){
      store.dispatch({
        type: 'TOAST_SNACKBAR_MESSAGE',
        snackbarOpen: true,
        snackbarMessage: "Exporting selected data sets"
      })

      pickedParticipants.map((p, index) => {
        let downloadObj = {
          content: p.linesOfData,
          rawGazeData: p.rawGazeData
        }
        const blob = new Blob([JSON.stringify(downloadObj)], { type: "application/json" })
        FileSaver.saveAs(blob, getParticipantName(p)+'_.json')
      })
    }
    handleClose()
  }

  const handleExportAll = () => {
    store.dispatch({
      type: 'TOAST_SNACKBAR_MESSAGE',
      snackbarOpen: true,
      snackbarMessage: "Exporting all data sets"
    })

    if (combineFiles) {
      db_helper.exportManyToCSV({ participants: participants, delimiter: delimiter }, (res) => {
        var blob = new Blob([res.data.csv_string], { type: 'text/csv' })
        FileSaver.saveAs(blob, res.data.file_name + '.csv')
        if (res.data.gaze_data !== undefined) {
          const gaze_blob = new Blob([res.data.gaze_data], { type: 'text/csv' })
          FileSaver.saveAs(gaze_blob, res.data.file_name + '_gaze.csv')
        }
        
        return 1
      })
    } else {
      participants.map((p, ind) => {
        db_helper.exportToCSV({ participant: p, delimiter: delimiter }, (res) => {
          const blob = new Blob([res.data.csv_string], { type: 'text/csv' })
          FileSaver.saveAs(blob, res.data.file_name + '.csv')
          if (res.data.gaze_data !== undefined) {
            const gaze_blob = new Blob([res.data.gaze_data], { type: 'text/csv' })
            FileSaver.saveAs(gaze_blob, res.data.file_name + '_gaze.csv')
          }
          
          return 1
        })
        return 1
      })
    }
  }

  const formatDateTime = (t) => {
    const d = new Date(t)
    const fillZero = num => {
      if (num < 10) return '0' + num
      else return num
    }
    return(
      d.getFullYear() + '-' + fillZero(d.getMonth() + 1) + '-' + fillZero(d.getDate()) + '_' + fillZero(d.getHours()) + ':' + fillZero(d.getMinutes())
    )
  }

  const getParticipantName = (p) => {
    if (!p.linesOfData || p.linesOfData.length <= 0) return "Empty"       //If there is not data we set the name to "Empty"

    let file_name = ""                        // If there are lines of data avalaible we set the name to be the time of the first recorded data
    if (p.linesOfData && p.linesOfData.length > 0) {
      file_name = formatDateTime(p.linesOfData[0].startTimestamp) + '_' + p.setName
    }
    return file_name
  }

  const handleParticipantsOnclick = (p) => {
    if (pickedParticipants.includes(p)){
      let tempPickedParticipants = pickedParticipants.splice(pickedParticipants.indexOf(p), 1)
      setPickedParticipants(tempPickedParticipants)
    }
    else {
      setPickedParticipants((pickedParticipants) => [...pickedParticipants, p])
    }
  }


  return (
    <div className="ExportContainer" style={{ backgroundColor: (props.theme.palette.type === "light" ? props.theme.palette.primary.main : props.theme.palette.primary.dark) }}>
      <List style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, width: '100%', minHeight: 100, maxHeight: 'calc(100% - 100px)', overflowY: 'auto', overflowX: 'hidden' }}>
        {participants.map( (p, index) => {
          {
            let selected = false
            if (pickedParticipants.includes(p)){
              selected = true
            }
            return (
              <ListItem style={{ borderBottom: 'grey solid 1px' }} selected={selected}
                button onClick={ () => handleParticipantsOnclick(p) } key={index} >
                <Typography color="textSecondary">{getParticipantName(p)}</Typography>
              </ListItem>
            )
          }
        })}
      </List>
      <div className="ExportationActions">
        <Typography variant="body1" color="textPrimary">
          {pickedParticipants.length} data sets selected 
        </Typography>
        <FormControlLabel label="Combine files"
          value="combineFiles"
          checked={combineFiles}
          control={<Checkbox color="secondary" />}
          onChange={onCombineFilesChange}
          labelPlacement="end"
          style={{ marginLeft: 10 }}
        />
        <TextField label="Delimiter"
          required
          style={{ width: 100 }}
          id="delim"
          defaultValue={delimiter}
          placeholder=","
          variant="filled"
          onChange={(e) => setDelimiter(e.target.value) } //state.delimiter = e.target.value
        />

        <Button style={{ height: 50, marginLeft: 20 }} onClick={handleExport} variant="outlined">
          Export
        </Button>

        <Button style={{ height: 50, marginLeft: 20 }} onClick={handleDeleteSelected} variant="outlined">
          Delete
        </Button>
      </div>
    </div>
  )
}

export default withTheme(Export)