import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import css from '../../style/main.less';
import fdp from './fdp.js';
import Slider from './slider.js';

export default class Popup extends Component {
	// data requirements
	// static propTypes = {
	// 	className: React.PropTypes.string.isRequired,
	// 	callback: React.PropTypes.func.isRequired,
	// 	locations: React.PropTypes.object.isRequired,
	// 	settings: React.PropTypes.object.isRequired,
	// 	mycalls: React.PropTypes.array.isRequired
	// }
	
	constructor(props) {
		// feed data will continue to be used as this.props
		super(props);
		
		// internal unique state
		this.state = {
			className: props.className,
			custom: props.settings.chat_custom_status,
			queues: props.queues,
			queuelogoutreasons: props.queuelogoutreasons,
			settings:props.settings
		};
		
		// for remembering slider positions
		this._prev = {};
	}
	
	componentDidMount() {
		switch(this.props.className) {
			case 'move full':
				// re-position pop-up since we don't know the height until render time
				var popup = ReactDOM.findDOMNode(this);
				popup.style.marginTop = `-${popup.offsetHeight}px`;
				popup = null;
				
				break;
			case 'location basic':
				// extend window if the pop-up is too big to fit
				// var popup = ReactDOM.findDOMNode(this);
				// var app = document.getElementById('app');
				// var offset = popup.offsetHeight - (app.offsetHeight - popup.offsetTop);
				
				// if (offset > -10) {
				// 	app.style.height = app.offsetHeight + offset + 10 + 'px';
				// 	remote.getCurrentWindow().setContentSize(320, document.body.offsetHeight);
				// }
				
				// popup = null;				
				// app = null;				
			
				break;
		}
	}
	
	componentWillUnmount() {
		// revert back to normal size
		// if (this.props.className == 'location basic') {
		// 	document.getElementById('app').style.height = 'auto';
			// remote.getCurrentWindow().setContentSize(320, document.body.offsetHeight);
		// }
	}
	
	_showCustom() {
		// update pop-up to custom status box
		this.setState({
			className: 'custom'
		});
	}
	
	_updateValue(e, property) {
		// update state property based on input value
		this.setState({
			[property]: e.target.value
		});
	}
	
	_sendAction(action, value) {
    // need to CHANGE LOCATION! by passing this value ^ back to appWindow
    // make fdp call to locations
    fdp.postFeed('locations', 'select', {
      locationId: value
    });
		
    // trigger action from node context
		// ipcRenderer.send('window', {action, value});
		
		// close pop-up via parent function call
		this.props.callback(null);
	}
	

	// used for slider callback and quick togglin'
	_changeVolume(setting, value) {
		// called by _toggle
		var data;
		if (setting.indexOf('hudmw') != -1){
			// mic...
			if (setting == 'hudmw_webphone_mic'){
				data = {'name': 'hudmw_webphone_mic', 'value': value};
				fdp.postFeed('settings', 'update', data);
			}
			else if (setting == 'hudmw_webphone_speaker'){
				// speaker...
				data = {'name': 'hudmw_webphone_speaker', 'value': value};
				fdp.postFeed('settings', 'update', data);
			}
		}
	}
	
	_toggle(setting) {
		// save old position when icon is clicked
		if (this.props.settings[setting] != 0) {
			this._prev[setting] = this.props.settings[setting];
			this._changeVolume(setting, 0);
		}
		// restore position
		else if (this._prev[setting])
			this._changeVolume(setting, this._prev[setting]);
		else
			this._changeVolume(setting, .5);
	}

	_moveLocation(call, key) {
		fdp.postFeed('mycalls', 'route', {
			mycallId: call.xpid,
			toLocationId: key,
			variance: 'native',
			options: '0'
		});
		// close popup...
		this.props.callback(null);
	}

	_logoutQueues(reason){
		var logoutReason = reason;
		var data = {};
		var toSend = [];
		for(var i = 0; i < this.props.myqueues.length;i++){
			if(this.props.myqueues[i].checkStatus == true){
				
				
					
					toSend.push(this.props.myqueues[i].xpid);
					

				
				
			}
		}

		data.contactId = this.props.settings.my_pid;
		data.queues = toSend.join(",");
		data.reason = logoutReason;

		fdp.postFeed("queues","queueLogout",data);

		this.props.callback(null);
	}
	
	render() {
		var content;
		
		// change content according to pop-up type
		switch(this.state.className.split(' ')[0]) {
			case 'location':
				content = (
					<div>
						{Object.keys(this.props.locations).map((key) => {
							var location = this.props.locations[key];
							var check = '';
							
							// which location is on?
							if (this.props.settings.current_location == key)
								check = 'check';
							
							if (!location.hidden) {
								return (
									<div 
										key={key} 
										className="line"
										onClick={() => this._sendAction('location', key)}
									>										
										<i className="material-icons">{check}</i>
										<span className="name">{location.name}</span>
										<span className="reg">{location.status.deviceStatus == 'u' ? 'Not Registered' : 'Registered'}</span>
									</div>
								);
							}
						})}
					</div>
				);
			
				break;
			case 'status':
				// which status is on?
				var available = this.props.settings.chat_status == 'available' ? 'check' : '';
				var away = this.props.settings.chat_status == 'away' ? 'check' : '';
				var dnd = this.props.settings.chat_status == 'dnd' ? 'check' : '';
			
				content = (
					<div>
						<div className="option" onClick={() => this._sendAction('status', 'available')}>
							<i className="material-icons">{available}</i>
							<div className="indicator available"></div>
							<span>Available</span>
						</div>
						<div className="option" onClick={() => this._sendAction('status', 'away')}>
							<i className="material-icons">{away}</i>
							<div className="indicator away"></div>
							<span>Away</span>
						</div>
						<div className="option" onClick={() => this._sendAction('status', 'dnd')}>
							<i className="material-icons">{dnd}</i>
							<div className="indicator dnd"></div>
							<span>Busy</span>
						</div>
						
						<hr className="divider" />
						
						<div className="option" onClick={() => this._showCustom()}>
							<i className="material-icons"></i>
							<span>Custom</span>
						</div>
					</div>
				);
				
				break;
			case 'preferences':
				content = (
					<div>
						<div className="option" onClick={() => this._sendAction('about')}>About</div>
						
						<hr className="divider" />
						
						<div className="option" onClick={() => this._sendAction('preferences')}>Preferences</div>
						<div className="option" onClick={() => this._sendAction('hudweb')}>Launch HUD</div>
						
						<hr className="divider" />
						
						<div className="option" onClick={() => this._sendAction('quit')}>Quit</div>
					</div>
				);
				
				break;
			case 'logoutreasons':
				content = (
					<div>
					<h4 className="selectTitle">SELECT LOGOUT REASON</h4>
						<ul className="logoutList">
							{
								this.state.queuelogoutreasons.map(items =>{
									return(
										<li className="logoutOptions" onClick={() => this._logoutQueues(items.xpid)} >{items.name}</li>
										)
								})

							}
						</ul>
					</div>
				);
				
				break;
			case 'custom':
				content = (
					<div>
						<span className="label">Edit Your Custom Status</span>
						<textarea className="message" 
							placeholder="Enter Message" 
							value={this.state.custom} 
							onChange={(e) => this._updateValue(e, 'custom')}>
						</textarea>
						
						<div className="buttons">
							<div className="button" onClick={() => this.props.callback(null)}>Cancel</div>
							<div className="button" onClick={() => this._sendAction('status', {custom: this.state.custom})}>Update</div>
						</div>
					</div>
				);
			
				break;
			case 'audio':
				// audio icons
				var iconMic = this.props.settings.hudmw_webphone_mic == 0 ? 'mic_off' : 'mic';
				var iconSpk = this.props.settings.hudmw_webphone_speaker == 0 ? 'volume_off' : 'volume_up';
			
				content = (
					<div>
						<div className="control">
							<i className="material-icons" onClick={() => this._toggle('hudmw_webphone_mic')}>{iconMic}</i>
							<Slider 
								setting="hudmw_webphone_mic"
								value={this.props.settings.hudmw_webphone_mic} 
								callback={this._changeVolume}
							/>
						</div>
						
						<div className="control">
							<i className="material-icons" onClick={() => this._toggle('hudmw_webphone_speaker')}>{iconSpk}</i>
							<Slider 
								setting="hudmw_webphone_speaker"
								value={this.props.settings.hudmw_webphone_speaker} 
								callback={this._changeVolume}
							/>
						</div>
					</div>
				);
			
				break;
			case 'move':
				var mycall = this.props.mycalls[0];
			
				content = (
					<div>
						<div className="label">SELECT A PHONE TO USE</div>
					
						{Object.keys(this.props.locations).map((key) => {
							var location = this.props.locations[key];
							var check = '';
							var name = location.name;
							
							// which location is on?
							if (mycall && mycall.locationId == key)
								check = 'check';
							
							if (!location.hidden) {
								// add phone number to name
								if (location.locationType != 'w')
									name += ` (${location.phone})`;
								
								return (
									<div 
										key={key} 
										className="line"
										onClick={() => this._moveLocation(mycall, key)}
									>										
										<i className="material-icons">{check}</i>
										<span className="name">{name}</span>
										<span className="reg">{location.status.deviceStatus == 'u' ? 'Not Registered' : 'Registered'}</span>
									</div>
								);
							}
						})}
					</div>
				);
			
				break;
		}
		
		// pass class name through and prevent closing pop-up when clicked
		return (
			<div id="popup" className={this.state.className} onClick={(e) => e.stopPropagation()}>
				{content}
			</div>
		);
	}
}