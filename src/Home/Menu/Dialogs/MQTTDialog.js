import React, { useState, useEffect } from 'react'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'
import Dialog from '@material-ui/core/Dialog'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import * as mqtt from '../../../core/mqtt'

const mqttDialog = (props) => {
  const [mqttURL, setMqttURL] = useState('localhost/mqtt')

  const mqttObject = {
    mqttURL: mqttURL
  }

  useEffect( () => {
    const mqttConfig = JSON.parse(props.myStorage.getItem('mqtt'))
    if (mqttConfig) {
      mqtt.startMQTT(mqttConfig)
      setMqttURL(mqttConfig.ip)
    } else{
      console.log(mqttObject)
      mqtt.startMQTT(mqttObject)

    } 
  }, [])

  const onChangeMQTTSettings = e => {
    props.myStorage.setItem('mqtt', JSON.stringify(mqttObject))
    mqtt.startMQTT(mqttObject, true)    //Start MQTT and allow restart if there is an existing connection before
    props.closeMQTTSettings()           //Callback to close the dialog from the header
  }

  return (
    <Dialog
      open={props.openMQTTSettings}
      onClose={props.closeMQTTSettings}
      aria-labelledby="form-dialog-title"
      fullWidth={true}
      maxWidth={"md"}
    >
      <DialogTitle id="form-dialog-title" variant="h5">MQTT Settings</DialogTitle>
      <DialogContent>
        <TextField
          required
          padding="normal"
          style={{ marginRight: "10px", width: "calc(100%)" }}
          id="mqttIP"
          defaultValue={mqttURL}
          label="MQTT Broker URL"
          onChange={(e) => setMqttURL(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={props.closeMQTTSettings} >
          Cancel
          </Button>
        <Button variant="outlined" onClick={onChangeMQTTSettings} >
          OK
          </Button>
      </DialogActions>
    </Dialog>
  )
}

export default mqttDialog