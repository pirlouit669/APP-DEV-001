var previous="connexion";
var runinphonegap = navigator.userAgent.match(/(ios|iPhone|iPod|iPad|Android|BlackBerry|IEMobile)/);
var F2S_cookie = '';
document.addEventListener('deviceready', ready_local, false);




function ready_local() {
      maj_nombres_rouges();         // Ajout des nombres rouges
      checkConnection();            // check internet       //try{checkConnection();}catch (e) {alert("Oupps une erreur c'est produite : "+e);}
      $(document).on( "click", ".btn-connexion", function(e){
            e.preventDefault();
            if (F2S_cookie.trim()) $('body').pagecontainer('change', '#accueil');      // trim pour ignorer les espaces
            else $('body').pagecontainer('change', '#connexion');
      });
      $(document).on( "click", "#btn-connexion-fb", function(e){connexion_facebook();}); 
      $(document).on('pageinit', '#connexion',function(){
            $(document).on( "click", "#btn-login", function(e){ login();});
            $(document).on( "click", "#btn-mdp-perdu", function(e){ mdp_perdu();});
            $(document).on( "click", "#btn-inscription", function(e){ inscription();});
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
function update_nr(type, nombre){
            block=$('.nav-'+type);
            if(block.find('.number_container').length == 0) block.prepend('<div class="number_container"><div class="number"></div></div>');
            block.find('.number').html(nombre);
            if (nombre>0) block.find('.number_container').show();
            else block.find('.number_container').hide();
      }
function maj_nombres_rouges(){
      $.ajax({ 
            url: "http://www.facile2soutenir.fr/wp-admin/admin-ajax.php",
            dataType: 'json',
            cache: false,
            data: {
                  'action':'am_get_nombres_rouges',
                  'cookie' : F2S_cookie,
            },
            success:function(nombre){
                  update_nr('accueil', nombre['marchands']);
                  update_nr('aide', nombre['aide']);
                  update_nr('soutenir', nombre['soutenir']);
                  update_nr('notifications', nombre['notifications']);
                  update_nr('profil', nombre['transactions']);
            },
            error: function(erreur){
            }
      });  
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
function vibre () {
      navigator.vibrate(1000);
}
