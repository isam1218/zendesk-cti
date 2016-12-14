class AppWindow extends React.Component {
	// data requirements
	static propTypes = {
		locations: React.PropTypes.object.isRequired,
		settings: React.PropTypes.object.isRequired,
		quickinbox: React.PropTypes.object.isRequired,
		avatars: React.PropTypes.object.isRequired,
		mycalls: React.PropTypes.array.isRequired
	}
	
	constructor(props) {
		super(props);
		
		// initial feed data from main.js
		this.state = props;
	}
	  
	componentDidMount() {
		// main script sent a message
		ipcRenderer.on('sync', (event, data) => {
			for (let key in data) {
				// update each feed that exists
				if (this.state[key]) {
					this.setState({
						[key]: data[key]
					});
				}
			}
		});
	}
	
	componentWillUnmount(){
		// clean up
		ipcRenderer.removeAllListeners('sync');
	}
	
	render() {
		// pass feed data down the chain as props
		return(<AppContent {...this.state} />);
	}
}

class AppContent extends React.Component {
	constructor(props) {
		// feed data will continue to be used as this.props
		super(props);
		
		// internal unique state
		this.state = {
			popup: null,
			phone: '',
			screen: ''
		};
	}
	
	componentDidMount() {
		this._resize();
	}
	
	componentDidUpdate() {
		this._resize();
	}
	
	_resize() {
		// adjust window to fit content
		var win = remote.getCurrentWindow();
			
		win.setContentSize(320, document.body.offsetHeight);
	}
	
	_sendAction(action, value) {
		// trigger action from node context
		ipcRenderer.send('window', {action, value});
	}
	
	_updateValue(e, property) {
		// update state property based on input value
		this.setState({
			[property]: e.target.value
		});
	}
	
	_restrictInput(e) {
		// strip out stupid characters
		e.target.value = e.target.value.replace(/[^0-9a-z\*\+\-()# ]/ig, '');
	}
	
	_openPopup(type) {
		// show appropriate pop-up
		this.setState({
			popup: type
		});
	}
	
	_changeScreen(type = '') {
		this.setState({
			screen: type,
			phone: ''
		});
	}
	
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
	
	_getStatus(call) {
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
	
	_callNumber(e) {
		// press enter to call
		if (e && e.key != 'Enter')
			return;
		
		if (this.state.phone != '') {
			this._sendAction('call', this.state.phone);
			
			// clear value
			this.setState({
				phone: '',
				screen: ''
			});
		}
	}
	
	_transfer(call, isVM) {
		this._sendAction('transfer', {
			call: call,
			number: this.state.phone,
			isVM: isVM
		});
		
		// clear screen
		this._changeScreen();
	}
	
	_dtmf(digit, skip) {
		var key = digit.toString();
		
		// if not direct input, append to text
		if (!skip) {
			this.setState({
				phone: this.state.phone + key
			});
		}
		
		// send key to softphone
		if (key.length == 1)
			this._sendAction('dtmf', key);
	}
	
	render() {
		var popup, overlay, body, footer;
		
		// easy reference to the top-most call
		var mycall = this.props.mycalls[0];
		
		/**
			DIALPAD SCREEN
		*/
			
		if (this.state.screen == 'dialpad' && (!mycall || mycall.state != 0)) {
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
						placeholder="Enter DTMF" 
						value={this.state.phone} 
						onChange={(e) => this._updateValue(e, 'phone')}
						onInput={(e) => this._restrictInput(e)}
						onKeyPress={(e) => this._dtmf(e.key, true)}
					/>
				);
				
				actionBtn = (<i className="material-icons end" onClick={() => this._sendAction('end', mycall)}>call_end</i>);
			}
			
			body = (
				<div id="dialpad">
					<div className="banner">
						<i className="material-icons" onClick={() => this._changeScreen()}>keyboard_arrow_left</i>
						<span>Dialpad</span>
					</div>
					
					{input}
					
					<div className="controls">
						<div className="key" onClick={() => this._dtmf(1)}>
							<div className="number">1</div>
						</div>
						<div className="key" onClick={() => this._dtmf(2)}>
							<div className="number">2</div>
							<div className="label">ABC</div>
						</div>
						<div className="key" onClick={() => this._dtmf(3)}>
							<div className="number">3</div>
							<div className="label">DEF</div>
						</div>
						<div className="key" onClick={() => this._dtmf(4)}>
							<div className="number">4</div>
							<div className="label">GHI</div>
						</div>
						<div className="key" onClick={() => this._dtmf(5)}>
							<div className="number">5</div>
							<div className="label">JKL</div>
						</div>
						<div className="key" onClick={() => this._dtmf(6)}>
							<div className="number">6</div>
							<div className="label">MNO</div>
						</div>
						<div className="key" onClick={() => this._dtmf(7)}>
							<div className="number">7</div>
							<div className="label">PQRS</div>
						</div>
						<div className="key" onClick={() => this._dtmf(8)}>
							<div className="number">8</div>
							<div className="label">TUV</div>
						</div>
						<div className="key" onClick={() => this._dtmf(9)}>
							<div className="number">9</div>
							<div className="label">WXYZ</div>
						</div>
						<div className="key special" onClick={() => this._dtmf('*')}>
							<div className="number">*</div>
						</div>
						<div className="key" onClick={() => this._dtmf(0)}>
							<div className="number">0</div>
							<div className="label">+</div>
						</div>
						<div className="key special" onClick={() => this._dtmf('#')}>
							<div className="number">#</div>
						</div>
					</div>
					
					<div className="buttons">
						<i className="material-icons" onClick={() => this._changeScreen()}>dialpad</i>
						{actionBtn}
					</div>
				</div>
			);
		}
		
		/**
			TRANSFER SCREEN
		*/
		
		else if (this.state.screen == 'transfer' && mycall && mycall.state != 0) {
			// disable buttons based on length of input value
			var disableNum = false;
			var disableVM = false;
			
			if (this.state.phone == '') {
				disableNum = true;
				disableVM = true;
			}
			else if (this.state.phone.length >= 10)
				disableVM = true;
			
			body = (
				<div id="transfer">
					<div className="banner">
						<i className="material-icons" onClick={() => this._changeScreen()}>keyboard_arrow_left</i>
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
						
						<div className="cancel" onClick={() => this._changeScreen()}>cancel</div>
					</div>
				</div>
			);
		}
		
		/**
			BASIC WINDOW (NO CALL)
		*/
		
		else if (this.props.mycalls.length == 0) {	
			var audioBtn, dialBtn;
			
			var callBtnCSS = 'material-icons callbtn' + (this.state.phone != '' ? ' active' : '');
			var audioBtnCSS = 'material-icons audio';
			
			// extra buttons for softphone users
			if (this.props.locations[this.props.settings['current_location']].locationType == 'w') {
				var classy = 'material-icons audio';
			
				if (this.state.popup == 'audio') {
					overlay = (<div className="overlay"></div>);
					
					classy += ' on';
				}
				
				audioBtn = (<i className={classy} onClick={() => this._openPopup('audio')}>volume_up</i>);
				
				dialBtn = (<i className="material-icons dialpad" onClick={() => this._changeScreen('dialpad')}>dialpad</i>);
			}
		
			body = (
				<div id="basic">	
					{audioBtn}
				
					<div>
						<span>Location:</span>
						<span className="my_location" onClick={this.props.settings.chat_status != 'offline' ? () => this._openPopup('location') : ''}>
							{this.props.locations[this.props.settings.current_location].name} 
							<i className="material-icons">expand_more</i>
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
						
						{dialBtn}
						
						<i className={callBtnCSS} onClick={() => this._callNumber()}>call</i>
					</div>
				</div>
			);
		}		
		
		/**
			FULL VIEW (ON CALL)
		*/		
		
		else {			
			var answerBtn;
			
			var audioBtnCSS = 'material-icons';
			var moveBtnCSS = 'material-icons';
			var holdBtnCSS = 'material-icons';
			var recBtnCSS = 'material-icons rec';
			
			// disable certain buttons based on context
			var disableConf = mycall.type == 0 ? true : false;
            var disablePhone = this.props.locations[mycall.locationId].locationType != 'w';
			var disableRec = (this.props.settings.personal_permissions & (1 << 14)) != 0 ? true : false;
			var disableFDP = this.props.settings.chat_status == 'offline' ? true : false;
			
			if (this.state.popup == 'audio' || this.state.popup == 'move') {
				overlay = (<div className="overlay"></div>);
				
				if (this.state.popup == 'audio')
					audioBtnCSS += ' on';
				else
					moveBtnCSS += ' on';
			}
			
			if (mycall.incoming && mycall.state == 0)
				answerBtn = (<i className="material-icons answer" onClick={() => this._sendAction('answer', mycall)}>call</i>);
			
			if (mycall.state == 3)
				holdBtnCSS += ' on';
			
			if (mycall.record)
				recBtnCSS += ' on';
		
			// print out final html
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
								onClick={() => this._sendAction('record', mycall)}
								disabled={disableRec || disableFDP}
							>
								<i className={recBtnCSS}>fiber_manual_record</i>
								<span className="label">record</span>
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
		}
		
		// add remaining alerts to bottom of template
		if (this.props.mycalls.length > 1) {
			footer = (
				<div id="footer">
					{this.props.mycalls.slice(1, this.props.mycalls.length).map((call, key) => {
						var actionBtn;
						
						// on hold
						if (call.state == 3)
							actionBtn = (<i className="material-icons switch" onClick={() => this._sendAction('switch', call)}>swap_calls</i>);
						else
							actionBtn = (<i className="material-icons answer" onClick={() => this._sendAction('answer', call)}>call</i>);
						
						return (
							<div className={`alert type${call.type}`} key={key}>
								{this._getAvatar(call)}
								<div className="details">
									<div className="name">{call.displayName}</div>
									{this._getStatus(call)}
								</div>
								<div>
									<i className="material-icons end" onClick={() => this._sendAction('end', call)}>call_end</i>
									
									{actionBtn}
								</div>
							</div>
						);
					})}
				</div>
			);
		}
		
		// add the pop-up to the end of the returned html
		if (this.state.popup) {
			var classy = this.state.popup + (mycall ? ' full' : ' basic');
			
			popup = (
				<Popup 
					{...this.props}
					className={classy} 
                    callback={() => this._openPopup()}
				/>
			);
		}
		
		// header is always the same; body will change
		return(
			<div id="app" onClick={popup ? () => this._openPopup(null) : ''}>
				{overlay}
			
				<div id="header">
					<div onClick={() => this._openPopup('status')}>
						<div className={`indicator ${this.props.settings.chat_status}`}></div>
						<i className="material-icons more">expand_more</i>
					</div>
				
					<div className="buttons">
						<div className="missed_calls">
							<i className="material-icons">call_missed</i>
							<Indicator quickinbox={this.props.quickinbox} type="missed-call" />
						</div>
						
						<div className="voicemails">
							<i className="material-icons">voicemail</i>
							<Indicator quickinbox={this.props.quickinbox} type="vm" />
						</div>
						
						<div className="chats">
							<i className="material-icons">chat</i>
							<Indicator quickinbox={this.props.quickinbox} type="chat" />
						</div>
					</div>
					
					<i className="material-icons" onClick={() => this._openPopup('preferences')}>settings</i>
				</div>
				
				{body}
				{footer}
				{popup}
			</div>
		);
	}
}