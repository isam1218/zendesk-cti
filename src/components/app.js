import React, { Component } from 'react';
import LoginWindow from './login.js';
import fdp from './fdp.js';
import AppWindow from './appWindow.js';
import update from 'react-addons-update';
import _ from 'lodash';

export default class App extends Component {
  constructor(props) {
    super(props);

    console.log('app.js: 1 constructor: props passed down from index.js - ', props);
    
    this.state = {
      login: true,
      app: false
    }

    this.loginToApp = this._changeLoginToApp.bind(this);
    // need to include pkg.json module
    this.server = "https://dev4.fon9.com:8081";
    this.configName = "Fonality CTI";
  }

  componentWillReceiveProps() {
    console.log('app.js: 2a componentWillReceiveProps - ', this.props.updates);
  }

  componentDidMount() {
    console.log('app.js: 2b componentDidMount - ', this.props.updates);

  }


  // handles initialization of app upon login...
  _changeLoginToApp() {
    this.setState({
      login: false,
      app: true
    });
    // versionCheck calls -> syncRequest -> syncRequest calls syncStatus + emits data to listener here in componentDidMount 
    fdp.versionCheck();
  }

  render() {
    if (this.state.app){
      // ***Uncomment below and comment above to enable refresh..
    // if (localStorage.node || localStorage.auth || this.state.app){
      // fdp.init();
      // console.log('have tokens already! - ', localStorage.node, localStorage.auth);
      return (
        <div>
          <AppWindow locations={this.props.updates.locations} settings={this.props.updates.settings} mycalls={this.props.updates.mycalls}/>
        </div>
      )
    }
    if (this.state.login){
      // console.log('1, localStorage - ', localStorage.node, localStorage.auth);
      return <LoginWindow login={this.loginToApp} />
    }
  }
}
