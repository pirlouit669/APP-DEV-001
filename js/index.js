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
      $(document).on('pagebeforeshow', '#nointernet', function (e, data) {
            previous=data.prevPage.attr('id');
      });
      
      
}


function offline() { // ne fonctionne pas si placé dans ready
      $('.connexion-on').hide();
      $('.connexion-off').show();
      $.mobile.changePage($('#nointernet'), 'pop', false, true);
}
function online() { // ne fonctionne pas si placé dans ready
      $('.connexion-off').hide();
      $('.connexion-on').fadeIn();
      setTimeout(function() {
            $.mobile.changePage($('#'+previous));
      }, 3000);
}

function videmarchand(){// vide les infos marchands initiales.
      $("#header-marchand-nom").html('');
      $("#marchand-details-logo").attr('src', '');
      $('#details-marchand .ui-content').hide();
      $('#details-marchand .encours').show();
      $( ".mobile-fav" ).removeClass( "marchand-favori" );
      //$(".marchand-container").hide();
      //$('#details-marchand').prepend('<div class="encours"><i class="fas fa-spinner fa-spin fa-3x"></i></div>');
      
}
function videticket(){// vide les infos ticket initiales.
      $('#ticket-details').prepend('<div class="encours"><i class="fas fa-spinner fa-spin fa-3x"></i></div>');
      $('#ticket_nouvelle_reponse').show();
      $('ticket_nouvelle_reponse_msg').hide();
      $('#ticket-container').html('');
      //$('#ticket-container').hide();
}