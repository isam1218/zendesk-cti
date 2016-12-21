import React, { Component } from 'react';
import LoginWindow from './login.js';
import fdp from './fdp.js';
import AppWindow from './appWindow.js';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      login: true,
      app: false
    }
    this.loginToApp = this.changeLoginToApp.bind(this);
  }

  componentDidMount() {
    this.dataListener = fdp.emitter.addListener('data_sync_update', (data) => {
      console.log('*** ---> Parent Component is receiving new data!!! - ', data);
    })

  }

  // handles initialization of app upon login...
  changeLoginToApp() {
    this.setState({
      login: false,
      app: true
    });
    // versionCheck calls -> syncRequest -> syncRequest calls syncStatus + emits data to listener here in componentDidMount 
    fdp.versionCheck();
  }

  render() {
    if (this.state.login){
      return <LoginWindow login={this.loginToApp} />
    }
    else if (this.state.app){
      return (
        <div>
          APP GOES HERE
        </div>
      )
    }
  }
}
