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
    // console.log('fdp - ', fdp);
    // fdp.login(username, password).then((status) => {
    //   if (status == 1){
    //     console.log('sync start ');
    //     fdp.init();
    //     this.setState({
    //       login: false,
    //       app: true
    //     })
    //   }
    //   else {
    //     console.log('error logging in');
    //   }
    // })
  }

  changeLoginToApp() {
    console.log('*APP - in changeLoginToApp! fdp is  - ', fdp);
    this.setState({
      login: false,
      app: true
    });
    // update state w/ fdp sync?
    // fdp.versionCheck();
    fdp.versionCheck().then((status, err) => {
      console.log('versioncheck promise return status = DATA???? -> - ', status);
    })
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
