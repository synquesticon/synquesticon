import { HashRouter as Router, Route, Switch } from 'react-router-dom'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { throttle } from 'lodash'
import { AppModes } from './core/sharedObjects'
import store from './core/store'
import Snackbar from '@material-ui/core/Snackbar'
import Header from './Home/Header'
import Edit from './Edit/'
import Observe from './Observe/'
import Export from './Export'
import SessionList from './Home/SessionList/'
import Play from './Play'
import ThemeProvider from '@material-ui/styles/ThemeProvider'
import './App.css'

//To make MaterialUI use the new variant of typography and avoid the deprecation warning
window.__MUI_USE_NEXT_TYPOGRAPHY_VARIANTS__ = true

class App extends Component {
  constructor(props) {
    super(props)
    this.resize = throttle(this.resize.bind(this), 100) //Setup the resize callback function so it is not called too frequently
  }

  resize() {
    store.dispatch({
      type: 'WINDOW_RESIZE',
      windowSize: { width: window.innerWidth, height: window.innerHeight }
    })
  }

  componentDidMount() {
    window.addEventListener('resize', this.resize)
    store.subscribe(() => {
      document.title = 'Synquesticon screen ' + store.getState().screenID
    })
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resize)
  }

  handleCloseSnackbar(event, reason) {
    store.dispatch({
      type: 'TOAST_SNACKBAR_MESSAGE',
      snackbarOpen: false,
      snackbarMessage: ""
    })
  }

  render() {
    let theme = store.getState().theme
    let scrollBgColor = theme.palette.type === "light" ? "lightscroll" : "darkscroll"
    document.body.classList.add(scrollBgColor)

    return (
      <Router>
        <ThemeProvider theme={theme}>
          <div style={{ backgroundColor: theme.palette.background.default }} className="App">
            <Route component={Header} />
            <div className="MainContent">
              <Switch>
                <Route exact path="/" component={SessionList} />
                <Route path={"/" + AppModes.EDIT} component={Edit} />
                <Route path="/Observe" component={Observe} />
                <Route path="/ExportationMode" component={Export} />
                <Route path="/study" component={Play} />
              </Switch>
            </div>
          </div>
          <Snackbar
            style={{ bottom: 200 }}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
            }}
            open={this.props.snackbarOpen}
            onClose={this.handleCloseSnackbar.bind(this)}
            autoHideDuration={2000}
            ContentProps={{
              'aria-describedby': 'message-id',
            }}
            message={<div style={{ width: '100%', height: '100%' }} id="message-id">{this.props.snackbarMessage}</div>}
          />
        </ThemeProvider>
      </Router>
    )
  }
}

const mapStateToProps = (state, ownProps) => {   //Allows us to use store state to update our react component
  return {
    showHeader: state.showHeader,
    windowSize: state.windowSize,
    theme: state.theme,
    snackbarOpen: state.snackbarOpen,
    snackbarMessage: state.snackbarMessage
  }
}

export default connect(mapStateToProps)(App)