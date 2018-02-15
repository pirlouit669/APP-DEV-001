var app = {
    
    initialize: function() { // Application Constructor
        this.bindEvents();
    },
    bindEvents: function() { // Bind Event Listeners : Bind any events that are required on startup. Common events are: 'load', 'deviceready', 'offline', and 'online'.
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    onDeviceReady: function() { // deviceready Event Handler: The scope of 'this' is the event. In order to call the 'receivedEvent' function, we must explicitly call 'app.receivedEvent(...);'
        ready();
        //app.setupPush(); //console.log('calling setup push');
    },
    setupPush: function() {
        console.log('calling push init');
        var push = PushNotification.init({
            "android": {
                "senderID": "XXXXXXXX"
            },
            "browser": {},
            "ios": {
                "sound": true,
                "vibration": true,
                "badge": true
            },
            "windows": {}
        });
        console.log('after init');

        push.on('registration', function(data) {
            console.log('registration event: ' + data.registrationId);

            var oldRegId = localStorage.getItem('registrationId');
            if (oldRegId !== data.registrationId) {
                // Save new registration ID
                localStorage.setItem('registrationId', data.registrationId);
                // Post registrationId to your app server as the value has changed
            }

            var parentElement = document.getElementById('registration');
            var listeningElement = parentElement.querySelector('.waiting');
            var receivedElement = parentElement.querySelector('.received');

            listeningElement.setAttribute('style', 'display:none;');
            receivedElement.setAttribute('style', 'display:block;');
        });

        push.on('error', function(e) {
            console.log("push error = " + e.message);
        });

        push.on('notification', function(data) {
            console.log('notification event');
            navigator.notification.alert(
                data.message,         // message
                null,                 // callback
                data.title,           // title
                'Ok'                  // buttonName
            );
       });
    }
};

function ready () {
      console.log('ready');
      var F2S_cookie = '';
      $.each($.cookie(), function( index, value ){
            if (index.indexOf('wordpress_logged_in_') >= 0) {
                  F2S_cookie = value;
                  console.log('cookie ok');
            } 
      });
      
      $.mobile.ignoreContentEnabled = true;
      //$.mobile.keepNative = "select,input";
      $.mobile.crossDomainPages  = true;
      
      
      
      $("#menu-left").panel().enhanceWithin();
      
      try{
            checkConnection();
      }catch (e) {
            alert("Oupps une erreur c'est produite : "+e);
      }
      $(document).on( "click", ".btn-connexion", function(e){
            e.preventDefault();
            var logged_in=false;
            $.each($.cookie(), function( index, value ){
                  if (index.indexOf('wordpress_logged_in_') >= 0) {
                        url = 'http://www.facile2soutenir.fr/mobile/?cookie_name=' + encodeURIComponent(index) + '&cookie=' + encodeURIComponent(value);
                        logged_in = true;
                        console.log(value);
                        //console.log(encodeURIComponent(value));
                        //console.log('logged in');
                        $.mobile.navigate('#accueil');
                        //$('body').pagecontainer('change', '#accueil');
                        //url = 'http://www.facile2soutenir.fr/test';
                        //document.location.href=url;
                        //window.open(url, '_blank', 'location=yes');
                  } 
            });
            console.log('not logged in');
            if (logged_in == false) $('body').pagecontainer('change', '#connexion');
      });
      
      //***************
      //GESTION DE LA RECHERCHE AJAX
      //***************
      
      $(document).on( "focus", ".form-container-inactif", function(e){
            $(this).toggleClass('form-container-actif');
            $(this).toggleClass('form-container-inactif');
            $('.recherche_fermer').show();
      });
      $(document).on( "blur", ".form-container-actif", function(e){
            console.log('focus');
            $(this).toggleClass('form-container-actif');
            $(this).toggleClass('form-container-inactif');
            $('.recherche_fermer').hide();
            //$('.recherche_reponse').html('');
            $('#recherche').val('');
      });
      
      $(document).mouseup(function (e){
            var container = $(".recherche_reponse");
            if (!container.is(e.target) // if the target of the click isn't the container...
                 && container.has(e.target).length === 0) // ... nor a descendant of the container
            {
                  jQuery('.recherche_reponse').html('');
            }
      });
      
      $('#marchands').on( "click", ".recherche_fermer", function(e){
            $(this).toggleClass('form-container-actif');
            $(this).toggleClass('form-container-inactif');
            $('.recherche_fermer').hide();
            $('.recherche_reponse').html('');
            $('#recherche').val('');
      }); 
      $('#recherche').on('input', function() {
            var keyword = $(this).val();
            if ( keyword.length>2){
                  $('.recherche_fermer').show();
                  $('.recherche_encours').show();
                  $.ajax({
                        url: "http://www.facile2soutenir.fr/wp-admin/admin-ajax.php",
                        cache:false,
                        data: {'action':'am_recherche_marchands', 'keyword' : keyword},
                        success:function(data) {
                              //console.log(data);
                              //$('.ui-content').prepend('<div class="recherche_reponse" style="display:none;">'+data+'</div>');
                              $('.recherche_reponse').html(data);
                              $('.recherche_encours').hide();
                              $( ".mlien" ).on( "click", function(e) {
                                        console.log('mlien click');
                                        videmarchand(); // vide les infos marchands initiales.
                                        var mid=$(this).attr('id'); // r�cup�re l'ID du marchand
                                        console.log('mid recupere : ' + mid)
                                        $( ".marchand-lien-externe" ).attr('id', mid); // positionne l'ID du marchand dans le champ ID de mobile bouton pour que la page mobile marchand puisse le recuperer
                              });                              
                        },
                        complete : function() {
                              $('.recherche_reponse').slideDown('slow');
                        }
                        
                  });  
            } else { // efface les r�sultats si le nb de caract�re devient <3
                  $('.recherche_reponse').html('');   
            }
            if ( keyword.length==0){
                  $('.recherche_fermer').css('display', 'none');
            }
      });     
      //<div><a class="marchand-fav" data-role="button" data-inline="true" data-iconpos="notext" data-icon="star"></a></div>
      // POPULATE detail marchand
      /*$( ".mlien" ).on( "click", function(e) {
            console.log('mlien click');
		videmarchand(); // vide les infos marchands initiales.
            var mid=$(this).attr('id'); // r�cup�re l'ID du marchand
            console.log('mid recupere : ' + mid)
            $( ".marchand-lien-externe" ).attr('id', mid); // positionne l'ID du marchand dans le champ ID de mobile bouton pour que la page mobile marchand puisse le recuperer
      });*/
    
    
    
      $(document).on('pageinit', '#dons', function(){get_user_dons (10);});
      $(document).on( 'click', '#get_user_dons', function(e){get_user_dons (10);});
  
      $(document).on('pageinit', '#marchands', function(){get_marchands (10);});
      $(document).on( 'click', '#get_marchands', function(e){get_marchands (4);});

     
      $(document).on( 'click', '#get_notifications',function(){contenu_notifications(10, 'toutes');});
      $(document).on('pageinit', '#notifications', function(){
            console.log('init notifications');
            contenu_notifications(10, 'toutes');
            $(document).on( "click", "#btn-toutes", function(){
                  console.log('toutes');
                  $(this).addClass('bouton-bleu').removeClass('bouton-inverse');
                  $('#btn-achats').addClass('bouton-inverse').removeClass('bouton-bleu');
                  $('#btn-actus').addClass('bouton-inverse').removeClass('bouton-bleu');
                  contenu_notifications(10, 'toutes');
            });              
            $(document).on( "click", "#btn-achats", function(){
                  console.log('achats');
                  $(this).addClass('bouton-bleu').removeClass('bouton-inverse');
                  $('#btn-toutes').addClass('bouton-inverse').removeClass('bouton-bleu');
                  $('#btn-actus').addClass('bouton-inverse').removeClass('bouton-bleu');
                  contenu_notifications(10, 'achats');
            });
            $(document).on( "click", "#btn-actus", function(){
                  console.log('actus');
                  $(this).addClass('bouton-bleu').removeClass('bouton-inverse');
                  $('#btn-toutes').addClass('bouton-inverse').removeClass('bouton-bleu');
                  $('#btn-achats').addClass('bouton-inverse').removeClass('bouton-bleu');
                  contenu_notifications(10, 'actus');
            });
            /*$(document).on( "click", ".lien-news-detail", function(){
                  activenews = $(this).parent();
                  activenews.addClass('news-active');
                  $('.news').not(activenews).removeClass('news-active');
            });*/
      });
      
      $(document).on('pageinit', '#profil', function(){
            contenu_profil();
            
            
            
            
            
            
            
            
      });
      $(document).on( 'click', '#contenu_profil', function(e){contenu_profil();});
      


      jQuery(document).on('pageshow', '#details-marchand',function(){
            var mid = jQuery( ".marchand-lien-externe" ).attr('id'); // recupere l'id du marchand dans le champ ID de mobile bouton
        
      // colorie l'icone favori
            /*if (jQuery.inArray( mid, marchands_favoris )>-1) {
                  jQuery( ".mobile-fav" ).addClass('favori');
            } else {
                  jQuery( ".mobile-fav" ).removeClass('favori');
            }*/
      
      	
            $.ajax({ // recupere les infos d�taill�es du marchand
                  url: "http://www.facile2soutenir.fr/wp-admin/admin-ajax.php",
                  dataType: 'json',
                  cache: false,
                  data: {
                        'action':'am_get_marchand_info',
                        'mid' : mid
                  },
                  success:function(marchand){
                        jQuery( ".contenu-marchand").removeClass('waiting');
                        
                        $("#header-marchand-nom").html(marchand['nom']);
                        $("#marchand-details-logo").attr('src', marchand['logo']);
                        $( ".marchand-lien-externe" ).attr('href', '/go/' + marchand['lien']+ '?webapp='+mid); // weba^pp
                        if (marchand['conditions']!='') {      
                              $(".marchand-warning").html(marchand['conditions']);
                              $(".marchand-warning").show();
                        } else {
                              $(".marchand-warning").hide();
                        } 
                        
                        jQuery(".marchand-collecte").html(marchand['collecte']);
                        $('.encours').fadeOut();
                        jQuery(".marchand-container").fadeIn();
                  },
                  error: function(erreur){
                  }
            });
      });

      
      $(document).on('pagebeforeshow', '#news-detail', function(){clean_newsdetail();});
      $(document).on('pageshow', '#news-detail',function(){
            var post_id = $( ".news-active .lien-news-detail" ).attr('id');
            linkurl = "http://www.facile2soutenir.fr/json/get_post/?id=" + post_id;
                  $.ajax({
                  type: "POST",
                  url:linkurl,
                  crossDomain: true,
                  cache: false,
                  success: function(data){
                        $('.encours').hide();
                        var post = data['post'];
                        var post_id = post['id'];
                        var titre = post['title'];
                        var date = post['date'];
                        var img = post['thumbnail_images']['full']['url'];
                        var content = post['content'];
                        $('#news-detail-title').html(titre);
                        $('#news-detail-date').html(date);
                        $('#news-detail-contenu').html(content);
                        $('#news-detail .news-main-top').css('background-image', 'linear-gradient( rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.75) ), url('+ img +')');		
                  },
            });
      });
      
      
      
      function get_user_dons(nombre, type) {
            //console.log('getting');
            $.ajax({
                  url: "http://www.facile2soutenir.fr/wp-admin/admin-ajax.php",
                  cache:false,
                  data: {'action':'am_get_user_dons', 'cookie' : F2S_cookie, 'type' : type, 'nombre' : nombre},
                  success:function(resultat) {
                        //console.log(resultat);
                        $('#user-dons-container').html(resultat);
                  },
                  error:function(erreur) {
                        console.log(erreur);
                  }
            });
      }
      function contenu_notifications(nombre, type) {
            $.ajax({
                  url: "http://www.facile2soutenir.fr/wp-admin/admin-ajax.php",
                  cache:false,
                  data: {'action':'am_contenu_notifications', 'cookie' : F2S_cookie, 'type' : type, 'nombre' : nombre},
                  success:function(resultat) {
                        //console.log(resultat);
                        $('#notifications-container').html(resultat);
                  },
                  error:function(erreur) {
                        console.log(erreur);
                  }
            });
      }     
      function contenu_profil() {
            $.ajax({
                  url: "http://www.facile2soutenir.fr/wp-admin/admin-ajax.php",
                  cache:false,
                  data: {'action':'am_contenu_profil', 'cookie' : F2S_cookie},
                  success:function(resultat) {
                        $('#user-profil').html(resultat);
                  },
                  error:function(erreur) {
                        console.log(erreur);
                  },
                  complete:function(){
                        $( "#mform-choix-cause" ).trigger('create');
                        $( "#choix-cause-input" ).textinput({clearBtn: true});
                        $( "#don-auto" ).flipswitch(); // switch don auto
            
                        // ************** LISTENER changement don auto
                        $("#don-auto").change(function () {
                              console.log(jQuery(this).val());
                              $( ".texte-auto" ).toggleClass('hide');
                              $.ajax({
                                    url: "https://www.facile2soutenir.fr/wp-admin/admin-ajax.php",
                                    cache:false,
                                    data: {
                                          'action':'am_update_don_auto',
                                          'auto' : $(this).val(),
                                          'cookie' : F2S_cookie,
                                    },
                                    success:function(data) {
                                          console.log(data);
                                    }
                              });  
                        });
                        
                        // ************** LISTENER liste des asso
                        $( "#liste-causes" ).on( "filterablebeforefilter", function ( e, data ) {
                              var jQueryul = $( this ),
                              jQueryinput = $( data.input ),
                              value = jQueryinput.val(),
                              html = "";
                              jQueryul.html( "" );
                              $( "#btn-choix-cause").removeClass('btn-choix-cause-actif');
                              $( "#choix-cause-id").val("");
                              if (!value) $('#choix-cause-erreur').hide();
                              if ( value && value.length >= 2 ) {
                                    jQueryul.append( '<div class="encours"><i class="fas fa-spinner fa-spin fa-2x"></i></div>');
                                    jQueryul.listview( "refresh" );
                                    $.ajax({
                                          url: "https://www.facile2soutenir.fr/wp-admin/admin-ajax.php",
                                          dataType: "json",
                                          data: {
                                                action: 'am_recherche_causes',
                                                q: jQueryinput.val()
                                          }
                                    })
                                    .then( function ( response ) {
                                          $.each( response, function ( i, val ) {
                                                html += "<li>" + val + "</li>";
                                          });
                                          jQueryul.html( html );
                                          jQueryul.listview( "refresh" );
                                          jQueryul.trigger( "updatelayout");
                                    });
                              }
                        });
                        
                        // ************** LISTENER click choix asso
                        $(document).on( "click", "#liste-causes li", function(){
                              var bloc=jQuery(this).children('.mbloc-cause');
                              var cause_id = bloc.attr('id');
                              var cause_nom=jQuery(this).find('.nom-cause').text();
                              jQuery('#choix-cause-input').val(cause_nom);
                              jQuery('#choix-cause-id').val(cause_id);
                              jQuery('#liste-causes').html( "" );
                              jQuery('#choix-cause-erreur').hide();
                              jQuery( "#btn-choix-cause").addClass('btn-choix-cause-actif');
                              jQuery( "#btn-choix-cause").fadeIn();
                        });
                        
                        $( "#choix-cause-input" ).blur(function() {
                              console.log('blur');
                              if (!$( "#choix-cause-id").val()) {
                                    //jQuery('#mform-choix-cause .ui-input-search').addClass("cause-incorrecte");
                                    
                                    if ($(this).val()) $('#choix-cause-erreur').show();
                                    $("#btn-choix-cause").removeClass('btn-choix-cause-actif');
                              } else {
                                    $('#choix-cause-erreur').hide();
                                    $( "#btn-choix-cause").addClass('btn-choix-cause-actif');
                              }
                        });
                        
                        $( "#btn-choix-cause" ).on( "click", function(e) {
                              $('#mform-choix-cause').append('<div class="encours"><i class="fas fa-spinner fa-spin fa-2x"></i></div>');
                              $.ajax({
                                    type: 'POST', 
                                    url: 'https://www.facile2soutenir.fr/wp-admin/admin-ajax.php',
                                    cache:false,
                                    dataType: "json",
                                    data: {
                                          action : 'am_get_cause_info',
                                          cause_id : $('#choix-cause-id').val(),
                                    }, 
                                    success: function (resultat) {
                                          $('.cause_fav_nom').html(resultat['nom']);
                                          $('.cause_fav_logo').attr('src', resultat['logo']);
                                          maj_affichage_favorite();
                                    }
                              });
                        });
                        
                        
                        $( "#voirplus" ).on( "click", function(e) {
                              var i=0;
                              jQuery( ".achats-container .achat:hidden" ).each(function( index ) {
                                    i++;
                                    if (i<=10) {
                                          $(this).show('slow');
                                    }
                              });
                              if (i<10) $( "#voirplus" ).hide();
                        });
                        
                        
                        function maj_affichage_favorite() {
                              console.log('maj affich favo');
                              console.log($('#choix-cause-user').val());
                              console.log($('#choix-cause-id').val());
                              $.ajax({
                                    type: 'POST', 
                                    url: 'https://www.facile2soutenir.fr/wp-admin/admin-ajax.php',
                                    cache:false,
                                    data: {
                                          action : 'am_choix_cause_favorite',
                                          uid : $('#choix-cause-user').val(),
                                          cid : $('#choix-cause-id').val(),
                                          cookie : F2S_cookie,
                                    }, 
                                    success: function (resultat) {
                                          console.log('maj ok');
                                          $('#mform-choix-cause').hide();
                                          $('.cause_fav').slideDown( "slow", function() {
                                                $('#don-auto').val('oui').flipswitch("refresh");
                                          });
                                          
                                    }
                              });
                  
                              
                              $.ajax({
                                    url: "https://www.facile2soutenir.fr/wp-admin/admin-ajax.php",
                                    cache:false,
                                    data: {
                                          'action':'am_update_don_auto',
                                          'uid': $('#choix-cause-user').val(),
                                          'auto' : 'oui',
                                          'cookie' : F2S_cookie,
                                    },
                                    success:function(data) {
                                          console.log('update_don_auto ok');
                                          console.log(data);
                                    }
                              });
                              
                        }
                        
                        
                        
                        
                        
                        
                  }
            });
      }
      function get_marchands (nombre, categorie) { // 3eme param pour "a partir de ..." ?
            //console.log (nombre);
            $.ajax({
                  url: "http://www.facile2soutenir.fr/wp-admin/admin-ajax.php",
                  cache:false,
                  data: {'action':'am_get_marchands', 'nombre' : nombre, 'categorie' : categorie},
                  success:function(resultat) {
                        //console.log(resultat);
                        $('.marchands-top').html(resultat)/*.enhanceWithin()*/;
                        $( ".mlien" ).on( "click", function(e) {
                              console.log('mlien click');
                              videmarchand(); // vide les infos marchands initiales.
                              var mid=$(this).attr('id'); // r�cup�re l'ID du marchand
                              console.log('mid recupere : ' + mid)
                              $( ".marchand-lien-externe" ).attr('id', mid); // positionne l'ID du marchand dans le champ ID de mobile bouton pour que la page mobile marchand puisse le recuperer
                        });
                  },
                  error:function(erreur) {
                        console.log(erreur);
                  }
            });
      }

}

function checkConnection() {
      var networkState = navigator.connection.type;
      
      var states = {};
      states[Connection.UNKNOWN]  = 'Unknown connection';
      states[Connection.ETHERNET] = 'Ethernet connection';
      states[Connection.WIFI]     = 'WiFi connection';
      states[Connection.CELL_2G]  = 'Cell 2G connection';
      states[Connection.CELL_3G]  = 'Cell 3G connection';
      states[Connection.CELL_4G]  = 'Cell 4G connection';
      states[Connection.NONE]     = 'No network connection';
      
      console.log('Connection type: ' + states[networkState]);
}
function vibre () {
      console.log('vibre');
      navigator.vibrate(1000);
}
function clean_newsdetail() {
      $('#news-detail-title').html('');
      $('#news-detail-date').html('');
      $('#news-detail-contenu').html('<div class="encours"><i class="fas fa-spinner fa-spin fa-3x"></i></div>');
      $('#news-detail .news-main-top').css('background-image', 'linear-gradient( rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.75) )');  
}
function fetch_posts(requete){
      var dataString = "";
      $('#news-container').html('<div class="encours"><i class="fas fa-spinner fa-spin fa-3x"></i></div>');
      linkurl = "http://www.facile2soutenir.fr/json/get_posts/";

      if (requete=='actus') {
            linkurl += '?count=5'; //&status=publish&date_format=%27d/Y%27",  
      } 
      if (requete=='achats') {
            linkurl = "http://www.facile2soutenir.fr/json/get_category_posts";
            linkurl += '?category_id=254';
      } 
      if (requete=='toutes') {
            linkurl += '?count=10';
      }
      $.ajax({
            type: "POST",
            url:linkurl,
            data: dataString,
            crossDomain: true,
            cache: false,
            success: function(data){
			$('.encours').hide();
                  var posts = data['posts'];
                  $.each(posts, function() {
                        var post_id = this['id'];
                        var titre = this['title'];
                        var date = this['date'];
                        var img = this['thumbnail_images']['full']['url'];
                        $('#news-container').append('<div class="news""><a href="#news-detail" id="'+post_id+'" class="lien-news-detail lien-full" data-transition="slide"></a><div class="voir-news"><i class="fas fa-caret-right fa-lg"></i></div><div class="news-image-container"><img src="'+img+'"></div><div class="news-contenu"><div class="news-title">'+titre+'</div><div class="news-date">'+date+'</div></div></div>');
                  });
            }
      });   
}
function videmarchand(){// vide les infos marchands initiales.
      $("#header-marchand-nom").html('');
      $("#marchand-details-logo").attr('src', '');
      $('#details-marchand .ui-content').prepend('<div class="encours"><i class="fas fa-spinner fa-spin fa-3x"></i></div>');
      $(".marchand-container").hide();
}
function login(){
      $('.status .erreur').remove();
      var username = $("#username").val();
      var password = $("#password").val();
      var dataString = "username="+username+"&password="+password+"&insecure=cool"; // insecure=cool pour connection over http
      var url;
      if ( username== "") {erreur_login ('usernamevide'); return false; }
      if ( password== "") {erreur_login ('passwordvide'); return false; }
      $('.status').prepend('<div class="encours"><i class="fas fa-spinner fa-spin fa-3x"></i></div>');
      $.ajax({
            type: "POST",
            url:"http://www.facile2soutenir.fr/json/user/generate_auth_cookie/?",
            data: dataString,
            crossDomain: true,
            cache: false,
            success: function(data){
                  console.log(data);
                  if (data.status=="ok") {
                        var cookie=data.cookie;
                        var cookie_name=data.cookie_name;
                        var user_id=data.user.id;
                        url = 'http://www.facile2soutenir.fr/mobile/?user_id=' + user_id + '&cookie_name=' + encodeURIComponent(cookie_name) + '&cookie=' + encodeURIComponent(cookie);
                        $.cookie(cookie_name, cookie, { expires: 365*5, path: '/' });
// F2S_cookie = cookie; marche pas
                        console.log(cookie);
                        console.log(encodeURIComponent(cookie));

                        $.mobile.navigate('#accueil');
                        //$('body').pagecontainer('change', '#accueil');
                        //url = 'http://www.facile2soutenir.fr/test';
                        //document.location.href=url;
                        //window.open(url, '_blank', 'location=yes');
                  } else {
                        erreur_login ('mdp');
                  }
                  
            },
            complete: function () {
                  $('.status .encours').remove();
            }
      });
}
function erreur_login (erreur){
      if (erreur=='mdp') {
            $('.status').prepend('<div class="erreur"><p>Oups...<br>Votre email ou votre mot de passe semble incorrect</p><p><i class="fas fa-frown"></p></div>');
      }
      if (erreur=='usernamevide') {
            $('.status').prepend('<div class="erreur"><p>Ca ne serait pas plus sympa si nous faisions connaissance ?</p></div>');
      }
      if (erreur=='passwordvide') {
            $('.status').prepend('<div class="erreur"><p>Je suis navr&#233;, mais je risque de me faire gronder si je vous laisse entrer sans mot de passe...</p></div>');
      }
      
}