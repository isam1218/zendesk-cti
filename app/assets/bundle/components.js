'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var AppWindow = function (_React$Component) {
	_inherits(AppWindow, _React$Component);

	function AppWindow(props) {
		_classCallCheck(this, AppWindow);

		// initial feed data from main.js
		var _this = _possibleConstructorReturn(this, (AppWindow.__proto__ || Object.getPrototypeOf(AppWindow)).call(this, props));

		_this.state = props;
		return _this;
	}
	// data requirements


	_createClass(AppWindow, [{
		key: 'componentDidMount',
		value: function componentDidMount() {
			var _this2 = this;

			// main script sent a message
			ipcRenderer.on('sync', function (event, data) {
				for (var key in data) {
					// update each feed that exists
					if (_this2.state[key]) {
						_this2.setState(_defineProperty({}, key, data[key]));
					}
				}
			});
		}
	}, {
		key: 'componentWillUnmount',
		value: function componentWillUnmount() {
			// clean up
			ipcRenderer.removeAllListeners('sync');
		}
	}, {
		key: 'render',
		value: function render() {
			// pass feed data down the chain as props
			return React.createElement(AppContent, this.state);
		}
	}]);

	return AppWindow;
}(React.Component);

AppWindow.propTypes = {
	locations: React.PropTypes.object.isRequired,
	settings: React.PropTypes.object.isRequired,
	quickinbox: React.PropTypes.object.isRequired,
	avatars: React.PropTypes.object.isRequired,
	mycalls: React.PropTypes.array.isRequired
};

var AppContent = function (_React$Component2) {
	_inherits(AppContent, _React$Component2);

	function AppContent(props) {
		_classCallCheck(this, AppContent);

		// internal unique state
		var _this3 = _possibleConstructorReturn(this, (AppContent.__proto__ || Object.getPrototypeOf(AppContent)).call(this, props));
		// feed data will continue to be used as this.props


		_this3.state = {
			popup: null,
			phone: '',
			screen: ''
		};
		return _this3;
	}

	_createClass(AppContent, [{
		key: 'componentDidMount',
		value: function componentDidMount() {
			this._resize();
		}
	}, {
		key: 'componentDidUpdate',
		value: function componentDidUpdate() {
			this._resize();
		}
	}, {
		key: '_resize',
		value: function _resize() {
			// adjust window to fit content
			var win = remote.getCurrentWindow();

			win.setContentSize(320, document.body.offsetHeight);
		}
	}, {
		key: '_sendAction',
		value: function _sendAction(action, value) {
			// trigger action from node context
			ipcRenderer.send('window', { action: action, value: value });
		}
	}, {
		key: '_updateValue',
		value: function _updateValue(e, property) {
			// update state property based on input value
			this.setState(_defineProperty({}, property, e.target.value));
		}
	}, {
		key: '_restrictInput',
		value: function _restrictInput(e) {
			// strip out stupid characters
			e.target.value = e.target.value.replace(/[^0-9a-z\*\+\-()# ]/ig, '');
		}
	}, {
		key: '_openPopup',
		value: function _openPopup(type) {
			// show appropriate pop-up
			this.setState({
				popup: type
			});
		}
	}, {
		key: '_changeScreen',
		value: function _changeScreen() {
			var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

			this.setState({
				screen: type,
				phone: ''
			});
		}
	}, {
		key: '_getAvatar',
		value: function _getAvatar(call) {
			// internal user
			if (call.contactId) {
				// avatar image
				if (this.props.avatars[call.contactId]) {
					return React.createElement('img', { className: 'avatar', src: this.props.avatars[call.contactId] });
				}
				// initials
				else {
						var split = call.displayName.split(' ');
						var fName = split[0].charAt(0);
						var lName = '';

						if (split.length > 1) lName = split[split.length - 1].charAt(0);

						return React.createElement(
							'div',
							{ className: 'avatar' },
							React.createElement(
								'div',
								{ className: 'initials' },
								fName + lName
							)
						);
					}
			}
			// unknown
			else return React.createElement('img', { className: 'avatar', src: 'images/generic-avatar.png' });
		}
	}, {
		key: '_getStatus',
		value: function _getStatus(call) {
			// change text of call status based on state/type
			switch (call.state) {
				case 3:
					return React.createElement(
						'div',
						{ className: 'status' },
						'On hold for (',
						React.createElement(Timer, { start: call.holdStart }),
						')'
					);

					break;
				case 2:
					return React.createElement(
						'div',
						{ className: 'status' },
						'On call for (',
						React.createElement(Timer, { start: call.created }),
						')'
					);

					break;
				default:
					// ringing
					if (call.incoming) {
						return React.createElement(
							'div',
							{ className: 'status' },
							'Incoming call'
						);
					} else {
						return React.createElement(
							'div',
							{ className: 'status' },
							'Outbound call'
						);
					}

					break;
			}
		}
	}, {
		key: '_callNumber',
		value: function _callNumber(e) {
			// press enter to call
			if (e && e.key != 'Enter') return;

			if (this.state.phone != '') {
				this._sendAction('call', this.state.phone);

				// clear value
				this.setState({
					phone: '',
					screen: ''
				});
			}
		}
	}, {
		key: '_transfer',
		value: function _transfer(call, isVM) {
			this._sendAction('transfer', {
				call: call,
				number: this.state.phone,
				isVM: isVM
			});

			// clear screen
			this._changeScreen();
		}
	}, {
		key: '_dtmf',
		value: function _dtmf(digit, skip) {
			var key = digit.toString();

			// if not direct input, append to text
			if (!skip) {
				this.setState({
					phone: this.state.phone + key
				});
			}

			// send key to softphone
			if (key.length == 1) this._sendAction('dtmf', key);
		}
	}, {
		key: 'render',
		value: function render() {
			var _this4 = this;

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
					input = React.createElement('input', {
						className: 'input',
						type: 'text',
						placeholder: 'Enter Number or Ext.',
						value: this.state.phone,
						onChange: function onChange(e) {
							return _this4._updateValue(e, 'phone');
						},
						onInput: function onInput(e) {
							return _this4._restrictInput(e);
						}
					});

					actionBtn = React.createElement(
						'i',
						{ className: 'material-icons answer', onClick: function onClick() {
								return _this4._callNumber();
							} },
						'call'
					);
				} else {
					input = React.createElement('input', {
						className: 'input',
						type: 'text',
						placeholder: 'Enter DTMF',
						value: this.state.phone,
						onChange: function onChange(e) {
							return _this4._updateValue(e, 'phone');
						},
						onInput: function onInput(e) {
							return _this4._restrictInput(e);
						},
						onKeyPress: function onKeyPress(e) {
							return _this4._dtmf(e.key, true);
						}
					});

					actionBtn = React.createElement(
						'i',
						{ className: 'material-icons end', onClick: function onClick() {
								return _this4._sendAction('end', mycall);
							} },
						'call_end'
					);
				}

				body = React.createElement(
					'div',
					{ id: 'dialpad' },
					React.createElement(
						'div',
						{ className: 'banner' },
						React.createElement(
							'i',
							{ className: 'material-icons', onClick: function onClick() {
									return _this4._changeScreen();
								} },
							'keyboard_arrow_left'
						),
						React.createElement(
							'span',
							null,
							'Dialpad'
						)
					),
					input,
					React.createElement(
						'div',
						{ className: 'controls' },
						React.createElement(
							'div',
							{ className: 'key', onClick: function onClick() {
									return _this4._dtmf(1);
								} },
							React.createElement(
								'div',
								{ className: 'number' },
								'1'
							)
						),
						React.createElement(
							'div',
							{ className: 'key', onClick: function onClick() {
									return _this4._dtmf(2);
								} },
							React.createElement(
								'div',
								{ className: 'number' },
								'2'
							),
							React.createElement(
								'div',
								{ className: 'label' },
								'ABC'
							)
						),
						React.createElement(
							'div',
							{ className: 'key', onClick: function onClick() {
									return _this4._dtmf(3);
								} },
							React.createElement(
								'div',
								{ className: 'number' },
								'3'
							),
							React.createElement(
								'div',
								{ className: 'label' },
								'DEF'
							)
						),
						React.createElement(
							'div',
							{ className: 'key', onClick: function onClick() {
									return _this4._dtmf(4);
								} },
							React.createElement(
								'div',
								{ className: 'number' },
								'4'
							),
							React.createElement(
								'div',
								{ className: 'label' },
								'GHI'
							)
						),
						React.createElement(
							'div',
							{ className: 'key', onClick: function onClick() {
									return _this4._dtmf(5);
								} },
							React.createElement(
								'div',
								{ className: 'number' },
								'5'
							),
							React.createElement(
								'div',
								{ className: 'label' },
								'JKL'
							)
						),
						React.createElement(
							'div',
							{ className: 'key', onClick: function onClick() {
									return _this4._dtmf(6);
								} },
							React.createElement(
								'div',
								{ className: 'number' },
								'6'
							),
							React.createElement(
								'div',
								{ className: 'label' },
								'MNO'
							)
						),
						React.createElement(
							'div',
							{ className: 'key', onClick: function onClick() {
									return _this4._dtmf(7);
								} },
							React.createElement(
								'div',
								{ className: 'number' },
								'7'
							),
							React.createElement(
								'div',
								{ className: 'label' },
								'PQRS'
							)
						),
						React.createElement(
							'div',
							{ className: 'key', onClick: function onClick() {
									return _this4._dtmf(8);
								} },
							React.createElement(
								'div',
								{ className: 'number' },
								'8'
							),
							React.createElement(
								'div',
								{ className: 'label' },
								'TUV'
							)
						),
						React.createElement(
							'div',
							{ className: 'key', onClick: function onClick() {
									return _this4._dtmf(9);
								} },
							React.createElement(
								'div',
								{ className: 'number' },
								'9'
							),
							React.createElement(
								'div',
								{ className: 'label' },
								'WXYZ'
							)
						),
						React.createElement(
							'div',
							{ className: 'key special', onClick: function onClick() {
									return _this4._dtmf('*');
								} },
							React.createElement(
								'div',
								{ className: 'number' },
								'*'
							)
						),
						React.createElement(
							'div',
							{ className: 'key', onClick: function onClick() {
									return _this4._dtmf(0);
								} },
							React.createElement(
								'div',
								{ className: 'number' },
								'0'
							),
							React.createElement(
								'div',
								{ className: 'label' },
								'+'
							)
						),
						React.createElement(
							'div',
							{ className: 'key special', onClick: function onClick() {
									return _this4._dtmf('#');
								} },
							React.createElement(
								'div',
								{ className: 'number' },
								'#'
							)
						)
					),
					React.createElement(
						'div',
						{ className: 'buttons' },
						React.createElement(
							'i',
							{ className: 'material-icons', onClick: function onClick() {
									return _this4._changeScreen();
								} },
							'dialpad'
						),
						actionBtn
					)
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
					} else if (this.state.phone.length >= 10) disableVM = true;

					body = React.createElement(
						'div',
						{ id: 'transfer' },
						React.createElement(
							'div',
							{ className: 'banner' },
							React.createElement(
								'i',
								{ className: 'material-icons', onClick: function onClick() {
										return _this4._changeScreen();
									} },
								'keyboard_arrow_left'
							),
							React.createElement(
								'span',
								null,
								'Transfer'
							)
						),
						React.createElement(
							'div',
							{ className: 'info' },
							React.createElement(
								'div',
								{ className: 'alert' },
								this._getAvatar(mycall),
								React.createElement(
									'div',
									{ className: 'details' },
									React.createElement(
										'div',
										{ className: 'name' },
										mycall.displayName
									),
									this._getStatus(mycall)
								)
							),
							React.createElement(
								'div',
								{ className: 'to' },
								React.createElement(
									'span',
									null,
									'To:'
								),
								React.createElement('input', {
									className: 'number',
									type: 'text',
									placeholder: 'Enter Ext or Number',
									value: this.state.phone,
									onChange: function onChange(e) {
										return _this4._updateValue(e, 'phone');
									},
									onInput: function onInput(e) {
										return _this4._restrictInput(e);
									}
								})
							)
						),
						React.createElement(
							'div',
							{ className: 'controls' },
							React.createElement(
								'div',
								null,
								React.createElement(
									'div',
									{
										className: 'button',
										disabled: disableNum,
										onClick: function onClick() {
											return _this4._transfer(mycall);
										}
									},
									React.createElement(
										'i',
										{ className: 'material-icons' },
										'phone_forwarded'
									),
									React.createElement(
										'span',
										{ className: 'label' },
										'transfer'
									)
								),
								React.createElement(
									'div',
									{
										className: 'button',
										disabled: disableVM,
										onClick: function onClick() {
											return _this4._transfer(mycall, true);
										}
									},
									React.createElement(
										'i',
										{ className: 'material-icons' },
										'voicemail'
									),
									React.createElement(
										'span',
										{ className: 'label' },
										'voicemail'
									)
								)
							),
							React.createElement(
								'div',
								{ className: 'cancel', onClick: function onClick() {
										return _this4._changeScreen();
									} },
								'cancel'
							)
						)
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
								overlay = React.createElement('div', { className: 'overlay' });

								classy += ' on';
							}

							audioBtn = React.createElement(
								'i',
								{ className: classy, onClick: function onClick() {
										return _this4._openPopup('audio');
									} },
								'volume_up'
							);

							dialBtn = React.createElement(
								'i',
								{ className: 'material-icons dialpad', onClick: function onClick() {
										return _this4._changeScreen('dialpad');
									} },
								'dialpad'
							);
						}

						body = React.createElement(
							'div',
							{ id: 'basic' },
							audioBtn,
							React.createElement(
								'div',
								null,
								React.createElement(
									'span',
									null,
									'Location:'
								),
								React.createElement(
									'span',
									{ className: 'my_location', onClick: this.props.settings.chat_status != 'offline' ? function () {
											return _this4._openPopup('location');
										} : '' },
									this.props.locations[this.props.settings.current_location].name,
									React.createElement(
										'i',
										{ className: 'material-icons' },
										'expand_more'
									)
								)
							),
							React.createElement(
								'div',
								{ className: 'calling' },
								React.createElement('input', {
									className: 'number',
									type: 'text',
									placeholder: 'ENTER NUMBER OR EXT.',
									value: this.state.phone,
									onChange: function onChange(e) {
										return _this4._updateValue(e, 'phone');
									},
									onKeyPress: function onKeyPress(e) {
										return _this4._callNumber(e);
									},
									onInput: function onInput(e) {
										return _this4._restrictInput(e);
									}
								}),
								dialBtn,
								React.createElement(
									'i',
									{ className: callBtnCSS, onClick: function onClick() {
											return _this4._callNumber();
										} },
									'call'
								)
							)
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
							var disableRec = (this.props.settings.personal_permissions & 1 << 14) != 0 ? true : false;
							var disableFDP = this.props.settings.chat_status == 'offline' ? true : false;

							if (this.state.popup == 'audio' || this.state.popup == 'move') {
								overlay = React.createElement('div', { className: 'overlay' });

								if (this.state.popup == 'audio') audioBtnCSS += ' on';else moveBtnCSS += ' on';
							}

							if (mycall.incoming && mycall.state == 0) answerBtn = React.createElement(
								'i',
								{ className: 'material-icons answer', onClick: function onClick() {
										return _this4._sendAction('answer', mycall);
									} },
								'call'
							);

							if (mycall.state == 3) holdBtnCSS += ' on';

							if (mycall.record) recBtnCSS += ' on';

							// print out final html
							body = React.createElement(
								'div',
								{ id: 'full' },
								React.createElement(
									'div',
									{ className: 'banner' },
									this._getAvatar(mycall)
								),
								React.createElement(
									'div',
									{ className: 'info' },
									React.createElement(
										'div',
										{ className: 'name' },
										mycall.displayName
									),
									this._getStatus(mycall),
									React.createElement(
										'div',
										{ className: 'controls' },
										React.createElement(
											'div',
											{
												className: 'button',
												onClick: function onClick() {
													return _this4._sendAction('hold', mycall);
												},
												disabled: disableConf
											},
											React.createElement(
												'i',
												{ className: holdBtnCSS },
												'pause'
											),
											React.createElement(
												'span',
												{ className: 'label' },
												'hold'
											)
										),
										React.createElement(
											'div',
											{
												className: 'button',
												onClick: function onClick() {
													return _this4._changeScreen('dialpad');
												},
												disabled: disablePhone
											},
											React.createElement(
												'i',
												{ className: 'material-icons' },
												'dialpad'
											),
											React.createElement(
												'span',
												{ className: 'label' },
												'dialpad'
											)
										),
										React.createElement(
											'div',
											{
												className: 'button',
												onClick: function onClick() {
													return _this4._openPopup('audio');
												},
												disabled: disablePhone
											},
											React.createElement(
												'i',
												{ className: audioBtnCSS },
												'volume_up'
											),
											React.createElement(
												'span',
												{ className: 'label' },
												'audio'
											)
										),
										React.createElement(
											'div',
											{
												className: 'button',
												onClick: function onClick() {
													return _this4._sendAction('record', mycall);
												},
												disabled: disableRec || disableFDP
											},
											React.createElement(
												'i',
												{ className: recBtnCSS },
												'fiber_manual_record'
											),
											React.createElement(
												'span',
												{ className: 'label' },
												'record'
											)
										),
										React.createElement(
											'div',
											{
												className: 'button',
												disabled: disableConf,
												onClick: function onClick() {
													return _this4._changeScreen('transfer');
												}
											},
											React.createElement(
												'i',
												{ className: 'material-icons' },
												'phone_forwarded'
											),
											React.createElement(
												'span',
												{ className: 'label' },
												'transfer'
											)
										),
										React.createElement(
											'div',
											{
												className: 'button',
												disabled: disableFDP,
												onClick: function onClick() {
													return _this4._openPopup('move');
												}
											},
											React.createElement(
												'i',
												{ className: moveBtnCSS },
												'call_split'
											),
											React.createElement(
												'span',
												{ className: 'label' },
												'move'
											)
										)
									),
									React.createElement(
										'i',
										{ className: 'material-icons end', onClick: function onClick() {
												return _this4._sendAction('end', mycall);
											} },
										'call_end'
									),
									answerBtn
								)
							);
						}

			// add remaining alerts to bottom of template
			if (this.props.mycalls.length > 1) {
				footer = React.createElement(
					'div',
					{ id: 'footer' },
					this.props.mycalls.slice(1, this.props.mycalls.length).map(function (call, key) {
						var actionBtn;

						// on hold
						if (call.state == 3) actionBtn = React.createElement(
							'i',
							{ className: 'material-icons switch', onClick: function onClick() {
									return _this4._sendAction('switch', call);
								} },
							'swap_calls'
						);else actionBtn = React.createElement(
							'i',
							{ className: 'material-icons answer', onClick: function onClick() {
									return _this4._sendAction('answer', call);
								} },
							'call'
						);

						return React.createElement(
							'div',
							{ className: 'alert type' + call.type, key: key },
							_this4._getAvatar(call),
							React.createElement(
								'div',
								{ className: 'details' },
								React.createElement(
									'div',
									{ className: 'name' },
									call.displayName
								),
								_this4._getStatus(call)
							),
							React.createElement(
								'div',
								null,
								React.createElement(
									'i',
									{ className: 'material-icons end', onClick: function onClick() {
											return _this4._sendAction('end', call);
										} },
									'call_end'
								),
								actionBtn
							)
						);
					})
				);
			}

			// add the pop-up to the end of the returned html
			if (this.state.popup) {
				var classy = this.state.popup + (mycall ? ' full' : ' basic');

				popup = React.createElement(Popup, _extends({}, this.props, {
					className: classy,
					callback: function callback() {
						return _this4._openPopup();
					}
				}));
			}

			// header is always the same; body will change
			return React.createElement(
				'div',
				{ id: 'app', onClick: popup ? function () {
						return _this4._openPopup(null);
					} : '' },
				overlay,
				React.createElement(
					'div',
					{ id: 'header' },
					React.createElement(
						'div',
						{ onClick: function onClick() {
								return _this4._openPopup('status');
							} },
						React.createElement('div', { className: 'indicator ' + this.props.settings.chat_status }),
						React.createElement(
							'i',
							{ className: 'material-icons more' },
							'expand_more'
						)
					),
					React.createElement(
						'div',
						{ className: 'buttons' },
						React.createElement(
							'div',
							{ className: 'missed_calls' },
							React.createElement(
								'i',
								{ className: 'material-icons' },
								'call_missed'
							),
							React.createElement(Indicator, { quickinbox: this.props.quickinbox, type: 'missed-call' })
						),
						React.createElement(
							'div',
							{ className: 'voicemails' },
							React.createElement(
								'i',
								{ className: 'material-icons' },
								'voicemail'
							),
							React.createElement(Indicator, { quickinbox: this.props.quickinbox, type: 'vm' })
						),
						React.createElement(
							'div',
							{ className: 'chats' },
							React.createElement(
								'i',
								{ className: 'material-icons' },
								'chat'
							),
							React.createElement(Indicator, { quickinbox: this.props.quickinbox, type: 'chat' })
						)
					),
					React.createElement(
						'i',
						{ className: 'material-icons', onClick: function onClick() {
								return _this4._openPopup('preferences');
							} },
						'settings'
					)
				),
				body,
				footer,
				popup
			);
		}
	}]);

	return AppContent;
}(React.Component);

var LoginWindow = function (_React$Component3) {
	_inherits(LoginWindow, _React$Component3);

	function LoginWindow() {
		_classCallCheck(this, LoginWindow);

		var _this5 = _possibleConstructorReturn(this, (LoginWindow.__proto__ || Object.getPrototypeOf(LoginWindow)).call(this));

		_this5.state = {
			username: '',
			password: '',
			error: null
		};

		return _this5;
	}

	_createClass(LoginWindow, [{
		key: 'componentDidMount',
		value: function componentDidMount() {}
	}, {
		key: '_updateValue',
		value: function _updateValue(e, property) {
			var _setState2;

			// update state property based on input value
			this.setState((_setState2 = {}, _defineProperty(_setState2, property, e.target.value), _defineProperty(_setState2, 'error', null), _setState2));
		}
	}, {
		key: '_attemptLogin',
		value: function _attemptLogin(e) {
			var _this6 = this;

			// press enter to call
			if (e && e.key != 'Enter') return;

			var username = this.state.username;
			var password = this.state.password;

			if (username != '' && password != '') {
				// send creds to node context
				login(username, password).then(function (status, err) {
					//some type of error

					var msgObj = {};

					//status is set by resolve in index.js...


					if (status == 403) {

						// incorrect username/pw
						msgObj.error = 'incorrect credentials';
						_this6.setState({
							error: msgObj.error
						});
					} else {

						// status == 0 aka server failure...
						msgObj.error = "server failure";
						_this6.setState({
							error: msgObj.error
						});
					}
				});
			}
		}
	}, {
		key: 'render',
		value: function render() {
			var _this7 = this;

			if (this.state.error) {
				var error = React.createElement(
					'div',
					{ className: 'incorrect_cred' },
					this.state.error
				);
			}

			return React.createElement(
				'div',
				{ id: 'login' },
				React.createElement(
					'div',
					{ className: 'label' },
					'Sign in with your ',
					React.createElement(
						'strong',
						null,
						'HUD'
					),
					' account'
				),
				React.createElement('input', {
					className: 'input',
					type: 'text',
					placeholder: 'username',
					value: this.state.username,
					onChange: function onChange(e) {
						return _this7._updateValue(e, 'username');
					},
					onKeyPress: function onKeyPress(e) {
						return _this7._attemptLogin(e);
					}
				}),
				React.createElement('input', {
					className: 'input',
					type: 'password',
					placeholder: 'password',
					value: this.state.password,
					onChange: function onChange(e) {
						return _this7._updateValue(e, 'password');
					},
					onKeyPress: function onKeyPress(e) {
						return _this7._attemptLogin(e);
					}
				}),
				error,
				React.createElement(
					'div',
					{ className: 'button', onClick: function onClick() {
							return _this7._attemptLogin();
						} },
					'sign in'
				)
			);
		}
	}]);

	return LoginWindow;
}(React.Component);
