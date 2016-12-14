class LoginWindow extends React.Component {
	constructor() {
		super();
		
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
		// press enter to call
		if (e && e.key != 'Enter')
			return;
		
		var username = this.state.username;
		var password = this.state.password;
		
		
		if (username != '' && password != '') {
			// send creds to node context
				login(username, password).then((status,err)=>{
					 //some type of error

					let msgObj = {};

					 //status is set by resolve in index.js...


						if (status == 403){

							// incorrect username/pw
							msgObj.error = 'incorrect credentials';
							this.setState({
								error: msgObj.error
							});

						} 
						else {

							// status == 0 aka server failure...
							msgObj.error = "server failure";
							this.setState({
								error: msgObj.error
							});
							
						}

					
				});
				
		}
	}
	
	render() {
		if (this.state.error) {
			var error = (<div className="incorrect_cred">{this.state.error}</div>);

		}
		
		return(
			<div id="login">
				<div className="label">Sign in with your <strong>HUD</strong> account</div>
				
				<input 
					className="input" 
					type="text" 
					placeholder="username" 
					value={this.state.username}
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