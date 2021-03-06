document.addEventListener('deviceready', ready_local, false);
var previous="landing";
var runinphonegap = navigator.userAgent.match(/(ios|iPhone|iPod|iPad|Android|BlackBerry|IEMobile)/);
var F2S_cookie = '';
var ready_ok = false;
function ready_local() {
      // gestion connectivite au lancement de l'app
      var networkState = navigator.connection.type;
      if (networkState != 'none') { first_load(); }
      else {$.mobile.changePage($('#nointernet'), 'pop', false, true);}
      
      // gestion de la deco / reco
      document.addEventListener("online", online, false);
      document.addEventListener("offline", offline, false);
      
      //initialisation du swipe de la landing page
      var mySwiper = new Swiper ('.swiper-container', {
            pagination: {
              el: '.swiper-pagination',
            },
      });
}
function first_load() {
      maj_nombres_rouges();
      $(document).on( "click", ".btn-connexion", function(e){
            e.preventDefault();
            if (F2S_cookie.trim()) $('body').pagecontainer('change', '#accueil');
            else $('body').pagecontainer('change', '#connexion');
      });
      $(document).on( "click", "#btn-connexion-fb", function(e){
            connexion_facebook();
      }); 
      $(document).on('pagecreate', '#connexion',function(){
            $(document).on( "click", "#btn-login", function(e){ login();});
            $(document).on( "click", "#btn-mdp-perdu", function(e){ mdp_perdu();});
            $(document).on( "click", "#btn-inscription", function(e){ inscription();});
      }); 
      $(document).on('pagebeforeshow', '#connexion',function(){
            $('#connexion-status').html('');
      });   
      $(document).on('pagebeforeshow', '#nointernet', function (e, data) {
            previous=data.prevPage.attr('id');
      }); 
      $(document).on( "click", ".retour-landing", function(e){
            e.preventDefault();
            $.mobile.navigate('#landing');
            window.location.reload();
      });
      ready_ok=true;
}
function offline() {
      $('.connexion-on').hide();
      $('.connexion-off').show();
      $.mobile.changePage($('#nointernet'), 'pop', false, true);
}
function online() {
      $('.connexion-off').hide();
      $('.connexion-on').fadeIn();
      if (!ready_ok) {
            $.mobile.changePage($('#'+previous));
            window.location.reload();
      }
      else {
            setTimeout(function() {
                  $.mobile.changePage($('#'+previous));
            }, 3000);
      }
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
      });  
}
function videmarchand(){// vide les infos marchands initiales.
      $("#header-marchand-nom").html('');
      $("#marchand-details-logo").attr('src', '');
      $('#details-marchand .ui-content').hide();
      $('#details-marchand .encours').show();
      $( ".mobile-fav" ).removeClass( "marchand-favori" );
}
function videticket(){// vide les infos ticket initiales.
      $('#ticket-details').prepend('<div class="encours"><i class="fas fa-spinner fa-spin fa-3x"></i></div>');
      $('#ticket_nouvelle_reponse').show();
      $('ticket_nouvelle_reponse_msg').hide();
      $('#ticket-container').html('');
}
function vibre () {
      navigator.vibrate(1000);
}
