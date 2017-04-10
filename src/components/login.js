import "babel-polyfill";
import React, { Component } from 'react';
import duel from 'dueljs';
import fdp from './fdp';

export default class LoginWindow extends Component {
	constructor(props) {
		super(props);
		
		this.state = {
			username: '',
			password: '',
			error: null
		};


	}

	componentDidMount () {

	}
	
	_updateValue(e, property) {
		// update state property based on input value
		this.setState({
			[property]: e.target.value,
			error: null
		});
	}
	
	_attemptLogin(e) {
		if(!fdp.master){
				setTimeout(function(){fdp.becomeMaster()},1);
			}
		// press enter to call
		if (e && e.key != 'Enter')
			return;
		
		var username = this.state.username;
		var password = this.state.password;

		
		
		if (username != '' && password != '') {
			// send creds to node context
			

				
					
						fdp.login(username, password).then(function(status,err){
							 //some type of error
							let msgObj = {};
							 //status is set by resolve in index.js...
								if (status == 1){

									// called passed in function that changes parent component's state to change view from login -> app
									this.props.login();

									// DISPLAY APP!!!
									// pass state back up to app.js so app js can display appWindow
								}
								else if (status == 403){
									console.log('1BAD LOGIN INCORRECT CREDS');
									// incorrect username/pw
									msgObj.error = 'Incorrect username or password';
									this.setState({
										error: msgObj.error
									});

								} 
								else {
									console.log('1BAD LOGIN SERVER FAILURE');
									// status == 0 aka server failure...
									msgObj.error = "server failure";
									this.setState({
										error: msgObj.error
									});
									
								}

							
						}).catch(function(reason){
							console.log("login fail ",reason);
						});
					
				

			
			

				
		}
		else if(username != '' && password == ''){
			let msgObj = {};
			msgObj.error = 'Enter your password.';
							this.setState({
								error: msgObj.error
							});
		}
		else if(username == '' && password != ''){
			let msgObj = {};
			msgObj.error = 'Enter your username.';
							this.setState({
								error: msgObj.error
							});
		}
		else{
			let msgObj = {};
			msgObj.error = 'Please enter your username and password.';
			this.setState({
				error: msgObj.error
			});
		}


	}



	
	render() {
		if (this.state.error) {
			var error = (<div className="incorrect_cred">{this.state.error}</div>);

		}
		
		return(
			<div id="login">
				<div className="logintop">
					<img className="loginlogo" src="./FonalityLogo.png" />
				</div>

				<div className="label">Sign in with your <strong>HUD</strong> account</div>
				
				<input 
					className="input" 
					type="text" 
					placeholder="username" 
					value={this.state.username}
					onFocus={(e)=>this._becomeMaster(e)}
					onChange={(e) => this._updateValue(e, 'username')} 
					onKeyPress={(e) => this._attemptLogin(e)}
				/>
				
				<input 
					className="input" 
					type="password" 
					placeholder="password" 
					value={this.state.password}
					onChange={(e) => this._updateValue(e, 'password')} 
					onKeyPress={(e) => this._attemptLogin(e)}
				/>

				{error}

				<div className="button" onClick={() => this._attemptLogin()}>sign in</div>
			</div>
		);
	}
}