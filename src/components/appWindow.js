import React, { Component } from 'react';

export default class AppWindow extends Component {
  // data requirements
  // static propTypes = {
  //   locations: React.PropTypes.object.isRequired,
  //   settings: React.PropTypes.object.isRequired,
  //   quickinbox: React.PropTypes.object.isRequired,
  //   avatars: React.PropTypes.object.isRequired,
  //   mycalls: React.PropTypes.array.isRequired
  // }
  
  constructor(props) {
    super(props);
    // initial feed data from main.js
    // this.state = this.props;
    console.log('0 INITIAL props - ', props);


  }

  componentWillReceiveProps() {
    // console.log('1 props - ', this.props);
    this.setState({
      settings: this.props.settings,
      locations: this.props.locations,
    })
    // this.setState({
    //   fdpImage: this.props.fdpImage,
    //   location_status: this.props.location_status,
    //   locations: this.props.locations,
    //   me: this.props.me,
    //   quickinbox: this.props.quickinbox,
    //   settings: this.props.settings
    // })
    console.log('2 state after setting props - ', this.state);
  }

  // THIS IS JUST AN EXAMPLE OF WHAT COULD BE RENDERED REFER TO HUDN LOGIC 
  
  render() {
    // pass feed data down the chain as props
    if (this.state && this.state.locations &&  this.state.locations[this.state.settings.current_location] && this.state.locations[this.state.settings.current_location].name){
    return(
        <div id="basic" > 
          <div>
            <span>Location:</span>
            <span className="my_location" >
              <i className="material-icons">{this.state.locations[this.state.settings.current_location].name}</i>
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
    else {
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

