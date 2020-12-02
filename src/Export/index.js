import React, { useState, useEffect } from 'react'
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

const setHeader = (seperator) => {
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

const exportComponent = (props) => {
    
    const [sessions, setSessions] = useState([])
    const [delimiter, setDelimiter] = useState(',')
    const [shouldCombineFiles, setShouldCombineFiles] = useState(true)    
    const [pickedSessions, setPickedSessions] = useState([])
    
    let countTest = 0

  useEffect(() => {
    db_helper.getAllParticipantsFromDb(ids => {
      setSessions(ids)
    })
  }, [])

  const onCombineFilesChange = () => {
    setShouldCombineFiles(prevBool => !prevBool)
  }

  const handleDeleteSelected = async () => {
    if (pickedSessions.length > 0) {
      store.dispatch({
        type: 'TOAST_SNACKBAR_MESSAGE',
        snackbarOpen: true,
        snackbarMessage: "Deleting data sets"
      })

      pickedSessions.forEach(async session => {         //Delete each selection synchronously
        await db_helper.deleteParticipantFromDbPromise(session._id)
      })

      setPickedSessions([])        //Empty the user selection

      db_helper.getAllParticipantsFromDb((ids) => {        //Update the list after the deletion have been completed
        store.dispatch({
          type: 'TOAST_SNACKBAR_MESSAGE',
          snackbarOpen: true,
          snackbarMessage: "Deletion completed"
        })
        
        setSessions(ids)
      })
    }
  }

/*   const handleDeleteAll = () => {
    db_helper.deleteAllParticipantsFromDb(() => db_helper.getAllParticipantsFromDb(ids => setSessions(ids)))
  } */

  const handleExport = async () => {
    if (pickedSessions.length > 0)
      store.dispatch({
        type: 'TOAST_SNACKBAR_MESSAGE',
        snackbarOpen: true,
        snackbarMessage: "Exporting selected data sets"
      })

    let exported_csv = ""
    let exported_gaze = ""
    let first_file = false
    let file_name = ""
    await Promise.all(pickedSessions.map(async (p, index) => {
      const returnedValue = await db_helper.exportToCSV({ participant: p, delimiter: delimiter })
      if (shouldCombineFiles) {
        if (!first_file) {
          file_name = "combined_" + returnedValue.file_name
          first_file = true
        }

        exported_csv += returnedValue.csv_string

        if (returnedValue.gaze_data !== undefined && returnedValue.gaze_data)
          exported_gaze += returnedValue.gaze_data
      } else {
        const blob = new Blob([setHeader(delimiter) + returnedValue.csv_string], { type: 'text/csv' })
        FileSaver.saveAs(blob, returnedValue.file_name + '.csv')

        if (returnedValue.gaze_data !== undefined && returnedValue.gaze_data) {
          const gaze_blob = new Blob([GAZE_HEADER + returnedValue.gaze_data], { type: 'text/csv' })
          FileSaver.saveAs(gaze_blob, returnedValue.file_name + '_gaze.csv')
        }
      }
      return 1
    }))

    if (shouldCombineFiles) {
      const blob = new Blob([setHeader(delimiter) + exported_csv], { type: 'text/csv' })
      FileSaver.saveAs(blob, file_name + '.csv')

      if (shouldCombineFiles && exported_gaze !== "") {
        const gaze_blob = new Blob([GAZE_HEADER + exported_gaze], { type: 'text/csv' })
        FileSaver.saveAs(gaze_blob, file_name + '_gaze.csv')
      }
    }
  }

/*   const handleExportAll = () => {
    store.dispatch({
      type: 'TOAST_SNACKBAR_MESSAGE',
      snackbarOpen: true,
      snackbarMessage: "Exporting all data sets"
    })

    if (shouldCombineFiles) {
      db_helper.exportManyToCSV({ participants: sessions, delimiter: delimiter }, (res) => {
        var blob = new Blob([res.data.csv_string], { type: 'text/csv' })
        FileSaver.saveAs(blob, res.data.file_name + '.csv')
        if (res.data.gaze_data !== undefined) {
          const gaze_blob = new Blob([res.data.gaze_data], { type: 'text/csv' })
          FileSaver.saveAs(gaze_blob, res.data.file_name + '_gaze.csv')
        }
        return 1
      })
    } else {
      sessions.map((p, ind) => {
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
  } */

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
    /* if (!p.linesOfData || p.linesOfData.length <= 0) return "Empty"       //If there is not data we set the name to "Empty"

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
    
      
    } */
    // TODO: recode the name convention
    countTest++
    return "InProgress "+countTest

    
  }


  return (
    <div className="ExportContainer" style={{ backgroundColor: (props.theme.palette.type === "light" ? props.theme.palette.primary.main : props.theme.palette.primary.dark) }}>
      <List style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, width: '100%', minHeight: 100, maxHeight: 'calc(100% - 100px)', overflowY: 'auto', overflowX: 'hidden' }}>
        {sessions.map( (p, index) => {
          if (pickedSessions.includes(p)) {
            return (
              <ListItem style={{ borderBottom: 'grey solid 1px' }} selected
                button onClick={ () => {
                  if (pickedSessions.includes(p))
                    setPickedSessions(prevVal => prevVal.slice(pickedSessions.indexOf(p), 1))
                  else
                    setPickedSessions(prevVal => [...prevVal, p])
                }} key={index} >
                <Typography color="textSecondary">{getParticipantName(p)}</Typography>
              </ListItem>
            )
          } else {
            return (
              <ListItem style={{ borderBottom: 'grey solid 1px' }}
                button onClick={ () => {
                  if (pickedSessions.includes(p))
                    setPickedSessions(prevVal => prevVal.slice(pickedSessions.indexOf(p), 1))
                  else
                    setPickedSessions(prevVal => [...prevVal, p])
                }} key={index} >
                <Typography color="textPrimary">{getParticipantName(p)}</Typography>
              </ListItem>
            )
          }
        })}
      </List>
      <div className="ExportationActions">
        <Typography variant="body1" color="textPrimary">
          {pickedSessions.length} data sets selected 
        </Typography>
        <FormControlLabel label="Combine files"
          value="shouldCombineFiles"
          checked={shouldCombineFiles}
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
          // ref="delimiterRef"
          variant="filled"
          onChange={(e) => setDelimiter(e.target.value)}
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

export default withTheme(exportComponent)