import React, { Component } from 'react';
// import ReactDOM from 'react-dom';
import css from '../../style/main.less';
import Popup from './popup.js';
import Timer from './timer.js';

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
      screen: 'default',
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

    if (this.state && this.state.locations & this.state.settings){
      console.log('***appWindow, my location should now be - ', this.state.locations[this.state.settings.current_location].name);
    }
    // console.log('appWindow.js after props set as state - ', this.state);
  }

  // press enter or green call button to call
  _callNumber(e) {
    // console.log('in _callNumber - ',e);
    // can press enter to call
    if (e && e.key != 'Enter')
      return;
    
    if (this.state.phone != '') {
      // this._sendAction('call', this.state.phone);
      
      // WILL EVENTAULLY MAKE FDP CALL TO ACTUALLY MAKE THE CALL (using this.state.phone) HERE...

      this._changeScreen('call');

      // e.target.blur();
    }
  }

  // change view
  _changeScreen(type = '') {
    this.setState({
      screen: type,
      phone: ''
    });
    console.log('_changeScreen to -> ', type);
  }

  // [DIALPAD SCREEN]
  // placeholder for dtmf - just updating this.state.phone w/ phone # to ultimately dial
  _dial(digit, skip) {
    if (!skip){
      this.setState({
        phone: this.state.phone + digit
      });
    }
  }

	// get avatar of person calling in (for [CALL SCREEN])
	_getAvatar(call) {
		// internal user
		if (call.contactId) {
			// avatar image
			if (this.props.avatars[call.contactId]) {
				return(<img className="avatar" src={this.props.avatars[call.contactId]} />);
			}
			// initials
			else {
				var split = call.displayName.split(' ');
				var fName = split[0].charAt(0);
				var lName = '';
				
				if (split.length > 1)
					lName = split[split.length-1].charAt(0);
				
				return(
					<div className="avatar">
						<div className="initials">{fName + lName}</div>
					</div>
				);
			}
		}
		// unknown
		else
			return (<img className="avatar" src="images/generic-avatar.png" />);
	}
	
	// part of [CALL SCREEN]
	_getStatus(call) {
    console.log('in _getStatus - ', call);
		// change text of call status based on state/type
		switch(call.state) {
			case 3:
				return (
					<div className="status">
						On hold for (<Timer start={call.holdStart} />)
					</div>
				);
			
				break;
			case 2:
				return (
					<div className="status">
						On call for (<Timer start={call.created} />)
					</div>
				);
				
				break;
			default:
				// ringing
				if (call.incoming) {
					return (<div className="status">Incoming call</div>);
				}
				else {
					return (<div className="status">Outbound call</div>);
				}
				
				break;
		}
	}

  // calls relevant popup
  _openPopup(type) {
    // make sure this only used in necessary areas
    console.log('in _openPopup - ', type);
    this.setState({
      popup: type
    });
  }
  // parse out unwanted inputs
  _restrictInput(e) {
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

  _sendAction(action, value) {
    switch(action){
      case 'mute':
      case 'hold':
      case 'answer':
      case 'end':
        var mycall = {};
        this._changeScreen('default');
        break;
    }
  }

  // [BASIC SCREEN] handles css depending on focus change of Number/Extension input
  _setFocus(f) {
    this.setState({
      focused: f
    });
  }

	// [CALL SCREEN]
	_toggleMute(call, onOffice) {
		// conf calls, hardphone only
		if (onOffice && call.type == 0)
			this._sendAction('mute', call);
		else {
			var oldVal = this.props.settings.hudmw_webphone_mic;
			var newVal = 0;
			
			// save old position when icon is clicked
			if (oldVal != 0)
				this._prev = oldVal;
			// restore position
			else if (this._prev)
				newVal = this._prev;
			else
				newVal = .5;
			
			// this._sendAction('volume', {
			// 	setting: 'hudmw_webphone_mic',
			// 	value: newVal
			// });
		}
	}

	_transfer(call, isVM) {
		// call FDP API to transfer call (either regular or to VM transfer)

		// clear screen
		this._changeScreen('default');
	}

  // handles input event.target.value
  _updateValue(e, property) {
    this.setState({
      [property]: e.target.value
    })
  }

  
  // AT THIS POINT, WE'RE JUST TESTING TO GET SOME STUFF ON THE SCREEN
  render() {
    var mycall = this.props.mycalls[0];
    var popup, overlay, body, footer;
    var barCSS = '';
    // console.log('this.state - ', this.state); 

    // [DEFAULT SCREEN - BASIC WINDOW NO CALL] {body} *****WILL NEED TO ADD NEW RECENT CALLS SECTION TO THE BOTTOM OF THIS VIEW*****
    if (this.state && this.state.screen == 'default' && this.state.mycalls && this.state.mycalls.length == 0 && this.state.locations &&  this.state.locations[this.state.settings.current_location] && this.state.locations[this.state.settings.current_location].name){
      // console.log('appWindow.js: 3a rendering app w/ data  this.state is - ', this.state);
      var audioBtn, body;
      var formCSS = 'form' + (this.state.focused ? ' focused' : '');
      // var formCSS = 'form focused';
      // var callBtnCSS = 'material-icons callbtn' + (this.state.phone != '' ? ' active' : '');
      var callBtnCSS = 'material-icons callbtn';
      // var audioBtnCSS = 'material-icons audio';
      var dialBtn = (<i className="material-icons dialpad" onClick={() => this._changeScreen('dialpad')}>dialpad</i>);
      // console.log('this.state.locations - ', this.state.locations);
      // console.log('this.state.settings.current_location - ', this.state.settings.current_location);
      // console.log('this.state.locations[this.state.settings.current_location] - ', this.state.locations[this.state.settings.current_location]);

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
            <div className={formCSS}>
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
            
            <i className={callBtnCSS} onClick={() => this._callNumber()}>call</i>
          </div>
        </div>
      );


    }

    // [DIAL PAD SCREEN] {body}
    else if (this.state.screen == 'dialpad') {
			var input, actionBtn;
			
			// not on a call, so dialpad is just a glorified whatever
			if (!mycall) {
				input = (
					<input 
						className="input" 
						type="text" 
						placeholder="Enter Number or Ext." 
						value={this.state.phone} 
						onChange={(e) => this._updateValue(e, 'phone')} 
						onKeyPress={(e) => this._callNumber(e)}
						onInput={(e) => this._restrictInput(e)}
					/>
				);
				
				actionBtn = (<i className="material-icons answer" onClick={() => this._callNumber()}>call</i>);
			}
			else {
				input = (
					<input 
						className="input" 
						type="text" 
						placeholder="Enter #" 
						value={this.state.phone} 
						onChange={(e) => this._updateValue(e, 'phone')}
						onInput={(e) => this._restrictInput(e)}
						onKeyPress={(e) => this._dial(e.key, true)}
					/>
				);
				
				actionBtn = (<i className="material-icons end" onClick={() => this._sendAction('end', mycall)}>call_end</i>);
			}
			
			body = (
				<div id="dialpad">
					<div className="banner">
						<i className="material-icons" onClick={() => this._changeScreen('default')}>keyboard_arrow_left</i>
						<span>Dialpad</span>
					</div>
					
					{input}
					
					<div className="controls">
						<div className="key" onClick={() => this._dial(1)}>
							<div className="number">1</div>
						</div>
						<div className="key" onClick={() => this._dial(2)}>
							<div className="number">2</div>
							<div className="label">ABC</div>
						</div>
						<div className="key" onClick={() => this._dial(3)}>
							<div className="number">3</div>
							<div className="label">DEF</div>
						</div>
						<div className="key" onClick={() => this._dial(4)}>
							<div className="number">4</div>
							<div className="label">GHI</div>
						</div>
						<div className="key" onClick={() => this._dial(5)}>
							<div className="number">5</div>
							<div className="label">JKL</div>
						</div>
						<div className="key" onClick={() => this._dial(6)}>
							<div className="number">6</div>
							<div className="label">MNO</div>
						</div>
						<div className="key" onClick={() => this._dial(7)}>
							<div className="number">7</div>
							<div className="label">PQRS</div>
						</div>
						<div className="key" onClick={() => this._dial(8)}>
							<div className="number">8</div>
							<div className="label">TUV</div>
						</div>
						<div className="key" onClick={() => this._dial(9)}>
							<div className="number">9</div>
							<div className="label">WXYZ</div>
						</div>
						<div className="key special" onClick={() => this._dial('*')}>
							<div className="number">*</div>
						</div>
						<div className="key" onClick={() => this._dial(0)}>
							<div className="number">0</div>
							<div className="label">+</div>
						</div>
						<div className="key special" onClick={() => this._dial('#')}>
							<div className="number">#</div>
						</div>
					</div>
					
					<div className="buttons">
						<i className="material-icons" onClick={() => this._changeScreen('default')}>dialpad</i>
						{actionBtn}
					</div>
				</div>
			);

    }
    // [FULL VIEW ON CALL SCREEN] {body}
    else if (this.state.screen == 'call') {
      /*  *****FAKE CALL OBJ HARDWIRED IN SO WE CAN SWITCH SCREENS**** */
			// WILL HAVE TO REMOVE
      mycall = {
        type: 5,
        locationId: "0_11216067",
        incoming: false,
        state: 2,
        mute: false,
        contactId: "1000015ad_1905460",
        displayName: "Sean Rose",
        created: 1483047916744,
        phone: "714-469-1796",
        holdStart: 1483057916744
      }

      console.log('CALL SCREEN GOES HERE!');
			var answerBtn, muteBtn;
			
			var audioBtnCSS = 'material-icons';
			var moveBtnCSS = 'material-icons';
			var holdBtnCSS = 'material-icons';
			
			// disable certain buttons based on context
      var disableConf = false;
      var disablePhone = false;
      var disableMute = false;
      var disableFDP = false;
			// var disableConf = mycall.type == 0 ? true : false;
      // var disablePhone = this.props.locations[mycall.locationId].locationType != 'w';
      // var disableMute = disablePhone && !disableConf;
			// var disableFDP = this.props.settings.chat_status == 'offline' ? true : false;
			
			if (this.state.popup == 'audio' || this.state.popup == 'move') {				
				if (this.state.popup == 'audio')
					audioBtnCSS += ' on';
				else
					moveBtnCSS += ' on';
			}
			
			if (mycall.incoming && mycall.state == 0) {
				// not for carrier location
				if (this.props.locations[mycall.locationId].locationType != 'm')
					answerBtn = (<i className="material-icons answer" onClick={() => this._sendAction('answer', mycall)}>call</i>);
				
				// change color of bottom bar
				barCSS = `type${mycall.type}`;
			}
			
			if (mycall.state == 3)
				holdBtnCSS += ' on';
			
			if (mycall.mute || (!disablePhone && this.props.settings.hudmw_webphone_mic == 0))
				muteBtn = (<i className='material-icons mic on'>mic_off</i>);
			else
				muteBtn = (<i className='material-icons mic'>mic</i>);
		

			body = (
				<div id="full">				
					<div className="banner">
            {this._getAvatar(mycall)}
					</div>
					
					<div className="info">
						<div className="name">{mycall.displayName}</div>
            {this._getStatus(mycall)}
						
						<div className="controls">
							<div 
								className="button" 
								onClick={() => this._sendAction('hold', mycall)}
								disabled={disableConf}
							>
								<i className={holdBtnCSS}>pause</i>
								<span className="label">hold</span>
							</div>
							
							<div 
								className="button"
								onClick={() => this._changeScreen('dialpad')}
								disabled={disablePhone}
							>
								<i className="material-icons">dialpad</i>
								<span className="label">dialpad</span>
							</div>
							
							<div 
								className="button" 
								onClick={() => this._openPopup('audio')}
								disabled={disablePhone}
							>
								<i className={audioBtnCSS}>volume_up</i>
								<span className="label">audio</span>
							</div>
							
							<div 
								className="button"
								onClick={() => this._toggleMute(mycall, disablePhone)}
								disabled={disableMute}
							>
								{muteBtn}
								<span className="label">mute</span>
							</div>
							
							<div 
								className="button"
								disabled={disableConf}
								onClick={() => this._changeScreen('transfer')}
							>
								<i className="material-icons">phone_forwarded</i>
								<span className="label">transfer</span>
							</div>
							
							<div 
								className="button" 
								disabled={disableFDP}
								onClick={() => this._openPopup('move')}
							>
								<i className={moveBtnCSS}>call_split</i>
								<span className="label">move</span>
							</div>
						</div>
						
						<i className="material-icons end" onClick={() => this._sendAction('end', mycall)}>call_end</i>
						
						{answerBtn}
					</div>
				</div>
			);


      console.log('body in call - ', body);
    }

    // NEED TO DO [TRANSFER SCREEN]?
		else if (this.state.screen == 'transfer') {
      /*  *****FAKE CALL OBJ HARDWIRED IN SO WE CAN SWITCH SCREENS**** */
			// WILL HAVE TO REMOVE
      mycall = {
        type: 5,
        locationId: "0_11216067",
        incoming: false,
        state: 2,
        mute: false,
        contactId: "1000015ad_1905460",
        displayName: "Sean Rose",
        created: 1483047916744,
        phone: "714-469-1796",
        holdStart: 1483057916744
      }

			// disable buttons based on length of input value
			var disableNum = false;
			var disableVM = false;
			
			if (this.state.phone == '') {
				disableNum = true;
				disableVM = true;
			}
			else {
				var num = this.state.phone;
				
				// reserved numbers
				if (num.length >= 10 || num == 0 || num == 911 || num == 8555 || (num >= 8500 && num <= 8520) || (num >= 9000 && num <= 9050))
					disableVM = true;
			}
			
			body = (
				<div id="transfer">
					<div className="banner">
						<i className="material-icons" onClick={() => this._changeScreen('default')}>keyboard_arrow_left</i>
						<span>Transfer</span>
					</div>
					
					<div className="info">
						<div className="alert">
							{this._getAvatar(mycall)}
							<div className="details">
								<div className="name">{mycall.displayName}</div>
								{this._getStatus(mycall)}
							</div>
						</div>
						
						<div className="to">
							<span>To:</span>
							<input 
								className="number" 
								type="text" 
								placeholder="Enter Ext or Number" 
								value={this.state.phone} 
								onChange={(e) => this._updateValue(e, 'phone')}
								onInput={(e) => this._restrictInput(e)}
							/>
						</div>
					</div>
					
					<div className="controls">
						<div>
							<div
								className="button" 
								disabled={disableNum}
								onClick={() => this._transfer(mycall)}
							>
								<i className="material-icons">phone_forwarded</i>
								<span className="label">transfer</span>
							</div>
							<div
								className="button" 
								disabled={disableVM}
								onClick={() => this._transfer(mycall, true)}
							>
								<i className="material-icons">voicemail</i>
								<span className="label">voicemail</span>
							</div>
						</div>
						
						<div className="cancel" onClick={() => this._changeScreen('default')}>cancel</div>
					</div>
				</div>
			);
		}
    
    // [POPUPS] {popup} 
    if (this.state.popup) {
      var classy = this.state.popup + (mycall ? ' full' : ' basic');

      popup = (
        <Popup 
          {...this.props}
          className={classy}
          callback={() => this._openPopup()}
        />
      );

      overlay = (<div className="overlay"></div>);
    }

    // RENDER COMPONENTS TOGETHER:
    return(
      <div id="app">
        {overlay}
        {popup}
        <div id="header">
          <div>
            <div ></div>
            FONALITY
          </div>
        
          <div className="buttons">            
          </div>
          <div className="agentlogin">
            <div className="tooltip"></div>
            <i className="material-icons">headset</i>
          </div>
          
          <i className="material-icons" onClick={() => this._openPopup('preferences')}>power_settings_new</i>
        </div>
        
        {body}
        
      </div>
    );


  }
}

