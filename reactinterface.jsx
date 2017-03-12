var Player = function(id, name, played, notplayed){
  this.id = id;
  this.name = name;
  this.repeatedwith = [];
  this.played = [];
  this.notplayed = [];
}

var Place = function(id,player){
  this.id = id;
  this.locked = false;
  this.player = player;
}

var Group = function(id,displayname){
  this.id = id;
  this.cache = [];
  this.displayname = displayname ? displayname:'Group '+(id+1);
  this.places = [new Place(0),new Place(1)];
  this.placescount = 2;
}

var Cycle = function(id,displayname){
  this.id = id;
  this.displayname = displayname ? displayname:'Cycle '+(id+1);
  this.groups = [new Group(0),new Group(1)];
  this.groupscount = 2;
}

var Round = function(id,simulations,players,displayname){
  this.id = id;
  this.simulations = simulations;
  this.players = players;
  this.displayname = displayname ? displayname:'Round '+(id+1);
  this.cycles = [new Cycle(0)];
  this.cyclescount = 1;
}

var Stage = function(registeredplayers){
  this.roundscount = 0;
  this.rounds = [];
  this.playerscount = 0;
  var self = this;
  //create list of players with porperties
  this.players = _.map(registeredplayers,function(name,index){
    self.playerscount++;
    return new Player(self.playerscount-1,name);
  });
  var self = this;
  _.each(this.players,function(player,index){
    player.notplayed = self.players.slice();
  });
  this.addRound = function(id,simulations,players,displayname){
    var theid = id ? id:this.roundscount;
    var plays = players ?players:this.players;
    this.rounds.push(new Round(theid,simulations,plays,displayname));
    this.roundscount++;
  }
}

//initial config
var registerednames = ['Adrian','Betty','Carlos','Daniel','Eva','Fred'];
var newstage = new Stage(registerednames);
newstage.addRound(null,100);
obj = {
  stage:newstage
};
var tree = new Baobab({stage:{players:[],rounds:[]}});
tree.set('stage',newstage);


var worker = new Worker('worker.js');

var  EditableText = React.createClass({
  componentWillReceiveProps: function(nextProps){
    this.setState({cont:nextProps.content})
  },
  getInitialState: function(){
    return {cont:this.props.content,editing:false,justchanged:false};
  },
  edit: function(){
    this.setState({justchanged:true})
    this.setState({editing:true});
  },
  submit: function(e){
    e.preventDefault();
    this.setState({editing:false});
    if(!this.state.cont){
      this.state.cont = 'player';
      this.setState({cont:'player'});
    }
    this.props.onchange(this.state.cont);
  },
  changeCont: function(e) {
    this.setState({
      cont: e.target.value
    });
  },
  componentDidUpdate: function(prevProps, prevState){
    if(this.state.justchanged){
      this.setState({justchanged:false});
      React.findDOMNode(this.refs.textinput).select();
    }
  },
  render: function() {
    var autosize = '{ "space": 40 }';
    if(this.state.editing){
      return (
        <form onSubmit={this.submit} >
        <input type='text' ref='textinput'className={this.props.classnames} onDoubleClick={this.edit} value={this.state.cont} onChange={this.changeCont} onBlur={this.submit}/>
        </form>
      )
    }else{
      return (<p className={this.props.classnames} onDoubleClick={this.edit}>{this.state.cont}</p>)
      }
  }
});

var  But = React.createClass({
  render: function() {
    var butclass;
    var iconclass;
    if(this.props.category == 'add'){
      butclass = '';
      iconclass = 'icon-plus';
    }else if(this.props.category == 'remove'){
      butclass = '';
      iconclass = 'icon-remove';
    }
    return (
      <button className={'inline-block smallbut'+butclass} onClick={this.props.click}><i className={iconclass}></i></button>
    )
  }
});

var GenerateBut = React.createClass({
  getInitialState: function() {
    return {status:0, classes:['green'], message:'Generate!'};
  },
  handleClick: function(event) {
    if(this.state.status == 0){

      this.setState({status:1});
      this.setState({message:(<span><i className="icon-spinner icon-spin"></i> Loading</span>)});
      var self = this;

      var args = [this.props.curs.get()];
      var callback = function(e) {
        var result = e.data.result;
        if (e.data.status == 1) {
          self.setState({message:(<span><i className="icon-refresh"></i> Shuffle</span>)});
          self.setState({status:0});
          self.props.curs.up().set(self.props.curs.get().id,result);
            worker.removeEventListener('message', callback , false);
        }
      };
      worker.addEventListener('message', callback , false);
      worker.postMessage({
        'cmd': 'createRound',
        'args': args
      });

    }
  },
  render: function() {
    var theclass = this.state.classes.join(' ');
    return (
        <button className={theclass} onClick={this.handleClick}>{this.state.message}</button>
    )
  }
});

var PlayerClass = React.createClass({
  changeName: function(newname) {
    this.props.curs.set('name',newname);
  },
  removePlayer: function(){
    this.props.curs.remove();
  },
  render: function() {
    var divclasses = ['box','inline-block','playerbox'];
    if(!this.props.curs.get()){
      return (
        <div className={divclasses.join(' ')}><small>empty</small></div>
      )
    }else{
      if(this.props.rep){
        divclasses = divclasses.concat(['red']);
      }else{
        divclasses = divclasses.concat(['blue']);
      }
    return (
      <div className={divclasses.join(' ')}>
      <div className="row pad-left pad-right">
      <EditableText content={this.props.curs.get().name} onchange={this.changeName}/>
      </div>
      <div className='inline-block double-pad-left pull-right'>
      <But click={this.removePlayer} category='remove'/>
      </div>
      </div>
    )
    }
  }
});

var PlaceClass = React.createClass({
  changeName: function(newname){
    this.props.curs.select('player').set('name',newname);
  },
  removePlace: function(){
    this.props.curs.remove();
  },
  toggleLock: function(){
    this.props.curs.set('locked',!this.props.curs.get().locked);
  },
  render: function() {
    var divclasses = ['box','inline-block','playerbox'];
    if(!this.props.curs.get().player){
      return (
        <div className={divclasses.join(' ')}><small>empty</small></div>
      )
    }else{
      if(this.props.rep){
        divclasses = divclasses.concat(['red']);
      }else{
        divclasses = divclasses.concat(['blue']);
      }
    return (
      <div className={divclasses.join(' ')}>
      <div className="row pad-left pad-right">
      <EditableText content={this.props.curs.get().player.name} onchange={this.changeName}/>
      </div>
      <div className='inline-block double-pad-left'>
      <But click={this.removePlace} category='remove'/>
      </div>
      <button className='inline-block smallbut' onClick={this.toggleLock}><i className={this.props.curs.get().locked ? 'icon-lock':'icon-unlock-alt'}></i></button>
      </div>
    )
    }
  }
});

var GroupClass = React.createClass({
  changeName: function(newname){
    this.props.curs.set('displayname',newname);
  },
  removeGroup: function(){
    this.props.curs.remove();
  },
  addPlace: function(){
    this.props.curs.select('places').push(new Place(this.props.curs.get().placescount));
    this.props.curs.set('placescount',this.props.curs.get().placescount+1);
  },
  isRep: function (who){
    var rep = false;
    var cache = this.props.curs.get().cache;
    var players = _.pluck(this.props.curs.get().places, 'player');
    var inthegroup = _.filter(cache, function(player){
      return _.find(players,function(pla){
        return pla ? (pla.id == player.id):false;
      });
    });
    _.each(inthegroup, function(player) {
      if (_.find(player.played, function(pla) {
          return pla == who;
        })) {
          //it is repeated
        who.repeatedwith = _.union(who.repeatedwith, [player]);
        player.repeatedwith = _.union(player.repeatedwith, [who]);
        rep = true;
      }
    });
    return rep;
  },
  render: function() {
    var places = this.props.curs.select('places');
    var self = this;
    return (
      <div className='success box inline-block'>
      <div className="row pad-left pad-right">
        <div className='inline-block'><EditableText content={this.props.curs.get().displayname} onchange={this.changeName}/></div>
        <div className='inline-block double-pad-left'>
        <But click={this.removeGroup} category='remove'/>
        </div>
      </div>
      {places.get().map(function(place,index){
            return(<PlaceClass curs={places.select(index)} rep={self.isRep(place.player)} num={index} key={place.id} />)
        })}
        <But click={this.addPlace} category='add'/>
      </div>
    )
  }
});

var CycleClass = React.createClass({
  changeName: function(newname){
    this.props.curs.set('displayname',newname);
  },
  removeCycle: function(){
    this.props.curs.remove();
  },
  addGroup: function(){
    this.props.curs.select('groups').push(new Group(this.props.curs.get().groupscount));
    this.props.curs.set('groupscount',this.props.curs.get().groupscount+1);
  },
  render: function() {
    var groups = this.props.curs.select('groups');
    return (
      <div className='alert box inline-block'>
      <div className="row pad-left pad-right">
        <div className='inline-block'><EditableText content={this.props.curs.get().displayname} onchange={this.changeName}/></div>
        <div className='inline-block double-pad-left'>
        <But click={this.removeCycle} category='remove'/>
        </div>
      </div>
      {groups.get().map(function(group,index){
            return(<GroupClass curs={groups.select(index)} num={index} key={group.id} />)
        })}
        <But click={this.addGroup} category='add'/>
      </div>
    )
  }
});

var RoundClass = React.createClass({
  changeName: function(newname){
    this.props.curs.set('displayname',newname);
  },
  removeRound: function(){
    this.props.curs.remove();
  },
  addCycle: function(){
    this.props.curs.select('cycles').push(new Cycle(this.props.curs.get().cyclescount));
    this.props.curs.set('cyclescount',this.props.curs.get().cyclescount+1);
  },
  addPlayer: function(){
    this.props.curs.select('players').push(new Player(this.props.curs.up().up().select('playerscount').get(),'new player'));
    this.props.curs.up().up().set('playerscount', this.props.curs.up().up().select('playerscount').get()+1);
  },
  render: function() {
    var cycles = this.props.curs.select('cycles');
    var self = this;
    return (
      <div className='info box'>
        <div className="row pad-left pad-right">
          <div className='inline-block'><EditableText content={this.props.curs.get().displayname} onchange={this.changeName}/></div>
          <div className='inline-block double-pad-left'>
            <But click={this.removeRound} category='remove'/>
          </div>
          <div className='inline-block double-pad-left'>
            <GenerateBut curs={this.props.curs}/>
          </div>
        </div>
        <div className="row pad-left">
          <div className='inline-block'><h5>Players: </h5></div>
          <div className=' double-pad-left double-pad-down'>
          {this.props.curs.select('players').get().map(function(player,index){
            return(<PlayerClass curs={self.props.curs.select('players').select(index)} rep={false} num={index} key={player.id} />)
            })}
            <But click={this.addPlayer} category='add'/>
            </div>
        </div>
        <div className="row pad-left double-pad-top">
      {cycles.get().map(function(cycle,index){
            return (<CycleClass curs={cycles.select(index)} num={index} key={cycle.id} />)
        })}
        <But click={this.addCycle} category='add'/>
        </div>
      </div>
    )
  }
});

var StageClass = React.createClass({
  mixins: [tree.mixin],
  cursor: ['stage'],
  addRound: function(){
    this.cursor.get().addRound(null,1);
    this.forceUpdate();
  },
  render: function() {
    var rounds = this.cursor.select('rounds');
    return (
      <div id='stage' className='box'>
      <But click={this.addRound} category='add'/>
      {rounds.get().map(function(round,index){
            return (<RoundClass curs={rounds.select(index)} num={index} key={round.id} />)
        })}
      </div>
    )
  }
});

var App = React.createClass({
  render: function() {
    return (
      <div>
      <h2 className='pad-top pad-left'>RoundRobin Generator</h2>
      <div className="row double-pad-top">
        <StageClass />
      </div>
      </div>
    )
  }
});

React.render(
  <App />,
  document.getElementById('app')
);

worker.addEventListener('message', function(e){
  console.log(e.data);
}, false);
