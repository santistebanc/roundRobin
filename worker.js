importScripts('underscore.js');
importScripts('roundrobin.js');

self.addEventListener('message', function(e) {
  var data = e.data;
  switch (data.cmd) {
    case 'createRound':
      self.postMessage({status:0,msg:'WORKER STARTED: create round '});
      var final;
        final = createRound.apply(this,data.args);
        final.then(function(result){
          self.postMessage({status:1,msg:'WORKER FINISHED: create round ',result:result});
        });
      break;
    case 'stop':
      self.postMessage('WORKER STOPPED: ');
      self.close(); // Terminates the worker
      break;
    default:
      self.postMessage('Unknown command: ' + data.cmd);
  };
}, false);
