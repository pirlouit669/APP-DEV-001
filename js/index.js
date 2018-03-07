function checkConnection() { // depre ?
      var networkState = navigator.connection.type;
      
      var states = {};
      states[Connection.UNKNOWN]  = 'Connexion inconnue';
      states[Connection.ETHERNET] = 'Connexion filaire';
      states[Connection.WIFI]     = 'Connexion Wifi';
      states[Connection.CELL_2G]  = 'Connexion 2G';
      states[Connection.CELL_3G]  = 'Connexion 3G';
      states[Connection.CELL_4G]  = 'Connexion 4G';
      states[Connection.NONE]     = 'Pas de Connexion';
      
      
      console.log('Connexion : ' + states[networkState]);
      
      if (networkState== 'Connection.NONE') {
            $.mobile.changePage($('#nointernet'), 'pop', false, true); //flip
            return false;
      } else {
            return states[networkState];
      } 
}


document.addEventListener('deviceready', readylocal, false);
function readylocal () {
      alert('local ready');
}