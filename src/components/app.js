import React, { Component } from 'react';
import LoginWindow from './login.js';
import fdp from './fdp.js';
import AppWindow from './appWindow.js';

export default class App extends Component {
  constructor(props) {
    super(props);

this.state = {
      login: '',
      app: '',
      ticketPhone: ''
    }
          // Initialise the Zendesk JavaScript API client
      // https://developer.zendesk.com/apps/docs/apps-v2
    



       
    // add additional state properties for different window components (e.g. preferences, about, etc)


    this.loginToApp = this._changeLoginToApp.bind(this);
    // need to include pkg.json module
    this.server = "https://dev4.fon9.com:8081";
    this.configName = "Fonality CTI";
  }

  componentWillReceiveProps() {
    // console.log('app.js: 2a componentWillReceiveProps, this.props - ', this.props);
  }

  componentDidMount() {
        if(localStorage.refresh != undefined){
      fdp.versionCheck();
            this.setState({
              login: false,
              app: true,
            });


      var topBarClientPromise = client.get('instances').then(instancesData =>{
        var instances = instancesData.instances;
        for (var instanceGuid in instances) {
          if (instances[instanceGuid].location === 'top_bar') {
            return client.instance(instanceGuid);
          }
        }
      });

      topBarClientPromise.then(topBarClient =>{

        // opens the top bar app, even if its iframe hasn't been loaded
        topBarClient.invoke('popover');

        client.get('ticket.requester.customField:primary_phone').then(data=>{

          this.setState({
            ticketPhone : data["ticket.requester.customField:primary_phone"]
          });

        });

      });

    
  }
    else{

    this.setState({
      login: true,
      app: false,
      ticketPhone: ''
    });
  }

    // console.log('app.js: 2b componentDidMount, this.props - ', this.props);




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
          <AppWindow avatars={this.props.avatars} locations={this.props.locations} settings={this.props.settings} mycalls={this.props.mycalls} ticketPhone={this.state.ticketPhone} />
        </div>
      )
    }
    if (this.state.login){
      // console.log('1, localStorage - ', localStorage.node, localStorage.auth);
      return <LoginWindow login={this.loginToApp} />
    }
    return (<div></div>)
  }
}
