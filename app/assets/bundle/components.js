"use strict";

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

		console.log("APP PROPS DATA", _this.state);
		return _this;
	}

	// THIS IS JUST AN EXAMPLE OF WHAT COULD BE RENDERED REFER TO HUDN LOGIC 

	// data requirements


	_createClass(AppWindow, [{
		key: "render",
		value: function render() {
			var _this2 = this;

			// pass feed data down the chain as props
			return React.createElement(
				"div",
				{ id: "basic" },
				React.createElement(
					"div",
					null,
					React.createElement(
						"span",
						null,
						"Location:"
					),
					React.createElement(
						"span",
						{ className: "my_location" },
						React.createElement(
							"i",
							{ className: "material-icons" },
							"expand_more"
						)
					)
				),
				React.createElement(
					"div",
					{ className: "calling" },
					React.createElement("input", {
						className: "number",
						type: "text",
						placeholder: "ENTER NUMBER OR EXT.",
						value: this.state.phone,
						onChange: function onChange(e) {
							return _this2._updateValue(e, 'phone');
						},
						onKeyPress: function onKeyPress(e) {
							return _this2._callNumber(e);
						},
						onInput: function onInput(e) {
							return _this2._restrictInput(e);
						}
					}),
					React.createElement(
						"i",
						{ onClick: function onClick() {
								return _this2._callNumber();
							} },
						"call"
					)
				)
			);
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

var LoginWindow = function (_React$Component2) {
	_inherits(LoginWindow, _React$Component2);

	function LoginWindow() {
		_classCallCheck(this, LoginWindow);

		var _this3 = _possibleConstructorReturn(this, (LoginWindow.__proto__ || Object.getPrototypeOf(LoginWindow)).call(this));

		_this3.state = {
			username: '',
			password: '',
			error: null
		};

		return _this3;
	}

	_createClass(LoginWindow, [{
		key: "componentDidMount",
		value: function componentDidMount() {}
	}, {
		key: "_updateValue",
		value: function _updateValue(e, property) {
			var _setState;

			// update state property based on input value
			this.setState((_setState = {}, _defineProperty(_setState, property, e.target.value), _defineProperty(_setState, "error", null), _setState));
		}
	}, {
		key: "_attemptLogin",
		value: function _attemptLogin(e) {
			var _this4 = this;

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
						_this4.setState({
							error: msgObj.error
						});
					} else {

						// status == 0 aka server failure...
						msgObj.error = "server failure";
						_this4.setState({
							error: msgObj.error
						});
					}
				});
			}
		}
	}, {
		key: "render",
		value: function render() {
			var _this5 = this;

			if (this.state.error) {
				var error = React.createElement(
					"div",
					{ className: "incorrect_cred" },
					this.state.error
				);
			}

			return React.createElement(
				"div",
				{ id: "login" },
				React.createElement(
					"div",
					{ className: "label" },
					"Sign in with your ",
					React.createElement(
						"strong",
						null,
						"HUD"
					),
					" account"
				),
				React.createElement("input", {
					className: "input",
					type: "text",
					placeholder: "username",
					value: this.state.username,
					onChange: function onChange(e) {
						return _this5._updateValue(e, 'username');
					},
					onKeyPress: function onKeyPress(e) {
						return _this5._attemptLogin(e);
					}
				}),
				React.createElement("input", {
					className: "input",
					type: "password",
					placeholder: "password",
					value: this.state.password,
					onChange: function onChange(e) {
						return _this5._updateValue(e, 'password');
					},
					onKeyPress: function onKeyPress(e) {
						return _this5._attemptLogin(e);
					}
				}),
				error,
				React.createElement(
					"div",
					{ className: "button", onClick: function onClick() {
							return _this5._attemptLogin();
						} },
					"sign in"
				)
			);
		}
	}]);

	return LoginWindow;
}(React.Component);

var fdp = new FDP();

function login(username, password) {

	return new Promise(function (resolve, reject) {

		fdp.login(username, password).then(function (status) {
			// make sure login window is still open
			// success -> proceed...

			if (status == 1) {
				console.log("SYNC STARTED");
				//NEED TO RENDER app.jsx now but app.jsx needs to be modified.
			} else {
				//some type of error
				resolve(status);
			}
		});
	});
}
fdp.init();
