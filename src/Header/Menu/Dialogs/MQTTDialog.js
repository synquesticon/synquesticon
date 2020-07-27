import React, { useState, useEffect } from 'react';

import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Dialog from '@material-ui/core/Dialog';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';

import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';

import * as mqtt from '../../../core/mqtt';

const mqttDialog = (props) => {

  const [useWSS, setUseWSS] = useState(false);
  const [ipAddress, setIpAddress] = useState('127.0.0.1');
  const [port, setPort] = useState('9001');

  useEffect(() => {
    var mqttConfig = JSON.parse(props.myStorage.getItem('mqtt'));

    if (mqttConfig){
      if(mqttConfig.ip){
        setIpAddress(mqttConfig.ip);
      }
      
      if(mqttConfig.port){
        setPort(mqttConfig.port);
      }

      if(mqttConfig.bUseWSS) {
        setUseWSS(mqttConfig.bUseWSS)
      }

    }

  }, []);
  


  const onChangeMQTTSettings = (e) => {

    const mqttObject = {
      ip: ipAddress,
      port: port,
      bUseWSS: useWSS
    };
    props.myStorage.setItem('mqtt', JSON.stringify(mqttObject));

    //Start MQTT and allow restart if there is an existing connection before
    mqtt.startMQTT(mqttObject, true);

    //Callback to close the dialog from the header
    props.closeMQTTSettings();
  }

  return(
    <Dialog
        open={props.openMQTTSettings}
        onClose={props.closeMQTTSettings}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title" variant="h5">MQTT Settings</DialogTitle>
        <DialogContent>
          <TextField
            required
            padding="normal"
            style={{marginRight:"10px", width:"calc(50% - 5px)"}}
            id="mqttIP"
            defaultValue={ipAddress}
            label="MQTT IP Address"
            onChange={(e) => setIpAddress(e.target.value)}
          />
          <TextField
            required
            padding="normal"
            id="mqttPort"
            defaultValue={port}
            style={{width:"calc(50% - 5px)"}}
            label="MQTT port"
            type="number"
            onChange={(e) => setPort(e.target.value)}
          />
          <FormControlLabel label="Use WSS"
            value="end"
            padding="dense"
            id={"useWSS"}
            checked={useWSS}
            control={<Checkbox color="secondary" />}
            onChange={(_, v) => setUseWSS(v)}
            labelPlacement="end"
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
  );
}

export default mqttDialog;
