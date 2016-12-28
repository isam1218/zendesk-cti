import React, { Component } from 'react';
import css from '../../style/main.less';

export default class AppWindow extends Component {
  // data requirements
  static propTypes = {
    locations: React.PropTypes.object.isRequired,
    settings: React.PropTypes.object.isRequired,
    avatars: React.PropTypes.object.isRequired,
    mycalls: React.PropTypes.array.isRequired
  }
  
  constructor(props) {
    super(props);
    // this.state.phone is the phone # dialed into form input
    this.state = {
      screen: 'basic',
      phone: '',
      focused: false,
      popup: null
    }
    // initial feed data from index.js
  }

  componentWillReceiveProps() {
    // console.log('appWindow.js before props set as state - ', this.props);
    this.setState({
      settings: this.props.settings,
      locations: this.props.locations,
      mycalls: this.props.mycalls,
      avatars: this.props.avatars
    })

    console.log('appWindow.js after props set as state - ', this.state);
  }

  // change view
  _changeScreen(type = '') {
    this.setState({
      screen: type,
      phone: ''
    });
    console.log('_changeScreen to -> ', type);
  }

  // handles css depending on focus change of Number/Extension input
  _setFocus(f) {
    console.log('called _setFocus - ', f);
    this.setState({
      focused: f
    });
  }

  // handles input event.target.value
  _updateValue(e, property) {
    console.log('in _updateValue - ', e, property);
    this.setState({
      [property]: e.target.value
    })
  }

  // press enter or green call button to call
  _callNumber(e) {
    console.log('in _callNumber - ',e);
    // can press enter to call
    if (e && e.key != 'Enter')
      return;
    
    if (this.state.phone != '') {
      // this._sendAction('call', this.state.phone);

      // NEED TO CHANGE TO DIALPAD SCREEN
      // clear form + change to dialpad screen? or to call screen?
      // this.setState({
      //   phone: '',
      //   screen: 'call'
      // });

      this._changeScreen('call');

      e.target.blur();
    }
  }

  // parse out unwanted inputs
  _restrictInput(e) {
    console.log('_restrictInput called - ', e);
    // convert letters and strip out unwanted chars
		e.target.value = e.target.value
			.replace(/[abc]/ig, 2)
			.replace(/[def]/ig, 3)
			.replace(/[ghi]/ig, 4)
			.replace(/[jkl]/ig, 5)
			.replace(/[mno]/ig, 6)
			.replace(/[pqrs]/ig, 7)
			.replace(/[tuv]/ig, 8)
			.replace(/[wxyz]/ig, 9)
			.replace(/[^0-9\*\+\-()# ]/g, '');
  }

  // calls relevant popup
  _openPopup(type) {
    console.log('in _openPopup');
    this.setState({
      popup: type
    });
  }
  
  // AT THIS POINT, WE'RE JUST TESTING TO GET SOME STUFF ON THE SCREEN
  render() {
    // if (this.state && this.state.locations &&  this.state.locations[this.state.settings.current_location] && this.state.locations[this.state.settings.current_location].name){
    // if not on call, this is [DEFAULT SCREEN - BASIC WINDOW NO CALL]
    if (this.state && this.state.screen == 'basic' && this.state.mycalls && this.state.mycalls.length == 0 && this.state.locations &&  this.state.locations[this.state.settings.current_location] && this.state.locations[this.state.settings.current_location].name){
      // console.log('appWindow.js: 3a rendering app w/ data  this.state is - ', this.state);
      var audioBtn, body;
      var formCSS = 'form' + (this.state.focused ? ' focused' : '');
      // var formCSS = 'form focused';
      // var callBtnCSS = 'material-icons callbtn' + (this.state.phone != '' ? ' active' : '');
      var callBtnCSS = 'material-icons callbtn';
      // var audioBtnCSS = 'material-icons audio';
      var dialBtn = (<i className="material-icons dialpad" onClick={() => this._changeScreen('dialpad')}>dialpad</i>);
      // extra buttons for softphone users
      // if (this.props.locations[this.props.settings['current_location']].locationType == 'w') {
      //   console.log('in extra buttons if branch!');
      //   var classy = 'material-icons audio';
      
      //   // if (this.state.popup == 'audio')
      //   //   classy += ' on';
        
      //   // audioBtn = (<i className={classy} onClick={() => this._openPopup('audio')}>volume_up</i>);
        
      //   // dialBtn = (<i className="material-icons dialpad" onClick={() => this._changeScreen('dialpad')}>dialpad</i>);
      // }
    
      body = (
        <div id="basic">  
        
          <div className="location">
            <span>Location:</span>
            <span className="my_location" onClick={this.state.settings.chat_status != 'offline' ? () => this._openPopup('location') : ''}>
              {this.state.locations[this.state.settings.current_location].name} 
              <i className="material-icons">expand_more</i>
            </span>
          </div>
            
          <div className="calling">
            <div >
              <div className="label">NUMBER/EXTENSION</div>
              <input 
                className="number" 
                type="text"
                value={this.state.phone} 
                onChange={(e) => this._updateValue(e, 'phone')} 
                onKeyPress={(e) => this._callNumber(e)}
                onInput={(e) => this._restrictInput(e)}
                onFocus={(e) => this._setFocus(true)}
                onBlur={(e) => this._setFocus(false)}
              />
            </div>
            
            {dialBtn}
            
            <i  onClick={() => this._callNumber()}>call</i>
          </div>
        </div>
      );

      // header is always the same; body will change
      return(
        <div id="app"  onClick={() => this._openPopup(null)}>

        
          <div id="header">
            <div>
              <div ></div>
              FONALITY
            </div>
          
            <div className="buttons">
              
              <div className="agentlogin">
                <div className="tooltip"></div>
                <i className="material-icons">headset</i>
                
              </div>
            </div>
            
            <i className="material-icons" onClick={() => this._openPopup('preferences')}>power_settings_new</i>
          </div>
          
          {body}
          
          
          

        </div>
      );


      {/*}
      return(
          <div id="basic" > 
            <div>
              <span>Location:</span>
              <span className="my_location" >
                <i className="material-icons">{this.state.locations[this.state.settings.current_location].name}</i>
              </span>

            </div>
            
            
            <div className="calling">
              <input 
                className="number" 
                type="text" 
                placeholder="ENTER NUMBER OR EXT." 
                value={this.state.phone} 
                onChange={(e) => this._updateValue(e, 'phone')} 
                onKeyPress={(e) => this._callNumber(e)}
                onInput={(e) => this._restrictInput(e)}
              />
              
              
              <i  onClick={() => this._callNumber()}>call</i>
            </div>
          </div>
      );
      */}     


    }
    else if (this.state.screen == 'dialpad') {
      console.log("DIAL PAD SCREEN GOES HERE!");
    }
    else if (this.state.screen == 'call') {
      console.log('CALL SCREEN GOES HERE!');
    }
    else {
      // console.log('appWindow.js: 3b not rendering view w/ data yet...');
      // otherwise catch it when props hasn't been passed down yet
      return(
          <div id="basic" > 
            <div>
              <span>Location:</span>
              <span className="my_location" >
                <i className="material-icons">Location HERE</i>
                
              </span>
            </div>
            
            {/*}
            <div className="calling">
              <input 
                className="number" 
                type="text" 
                placeholder="ENTER NUMBER OR EXT." 
                value={this.state.phone} 
                onChange={(e) => this._updateValue(e, 'phone')} 
                onKeyPress={(e) => this._callNumber(e)}
                onInput={(e) => this._restrictInput(e)}
              />
              
              
              <i  onClick={() => this._callNumber()}>call</i>
            </div>
          */}
          </div>
        );
      
    }
  }
}

