import React, { useState } from 'react';

import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Dialog from '@material-ui/core/Dialog';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';

import TextField from '@material-ui/core/TextField';
import { withTheme } from '@material-ui/styles';
import uuid from 'react-uuid'

import Button from '@material-ui/core/Button';

import store from '../../../core/store';

const DeviceIDDialog = props => {
  const [deviceName, setDeviceName] = useState(props.myStorage.getItem('deviceID'));
  const [screenID, setScreenID] = useState(store.getState().screenID);
  const [multipleScreens, setMultipleScreens] = useState(store.getState().multipleScreens);

  const multipleScreensToggled = (e, checked) => {
    setMultipleScreens(checked);
  }

  const onChangeDeviceID = e => {
    props.myStorage.setItem('deviceID', deviceName);

    var storeAction = {
      type: 'SET_MULTISCREEN',
      screenID: screenID,
      screen_uuid: uuid(),
      multipleScreens: multipleScreens,
    };
    store.dispatch(storeAction);
    props.closeDeviceIDSettings();
  }

  return(
    <Dialog
            open={props.openDeviceIDSettings}
            onClose={props.closeDeviceIDSettings}
            aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title" variant="h5">Device Settings</DialogTitle>
        <DialogContent>
          <TextField
            defaultValue={deviceName}
            style={{width:'calc(50% - 5px)', marginRight: 5}}
            id="deviceName"
            label="Device ID"
            padding="dense"
            variant="outlined"
            onChange={(e)=>setDeviceName(e.target.value)}
          />
          <TextField
              defaultValue={screenID}
              style={{width:'calc(50% - 5px)', marginRight:5}}
              id="screenID"
              label="Screen ID"
              padding="dense"
              variant="outlined"
              onChange={(e)=>setScreenID(e.target.value)}
            />
            <FormControlLabel label="Multiple screens"
              style={{width:'calc(50% - 5px)', marginRight:5}}
              checked={multipleScreens}
              id="mScreens"
              control={<Checkbox color="secondary" />}
              onChange={multipleScreensToggled}
              labelPlacement="end"
            />
        </DialogContent>
        <DialogActions>
            <Button variant="outlined" onClick={props.closeDeviceIDSettings}>
              Cancel
            </Button>
            <Button variant="outlined" onClick={onChangeDeviceID}>
              OK
            </Button>
        </DialogActions>
      </Dialog>
  );
}

export default withTheme(DeviceIDDialog);
