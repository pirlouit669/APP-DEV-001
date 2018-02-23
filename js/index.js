var app = {
    
    initialize: function() { // Application Constructor
        this.bindEvents();
    },
    bindEvents: function() { // Bind Event Listeners : Bind any events that are required on startup. Common events are: 'load', 'deviceready', 'offline', and 'online'.
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    onDeviceReady: function() { // deviceready Event Handler: The scope of 'this' is the event. In order to call the 'receivedEvent' function, we must explicitly call 'app.receivedEvent(...);'
        alert('calling setup push');
        app.setupPush();
        ready();
    },
    setupPush: function() {
        alert('inside setup push');
        var push = PushNotification.init({
            "android": {
                "senderID": "1005363421918"
            },
            "browser": {},
            "ios": {
                "sound": true,
                "vibration": true,
                "badge": true
            },
            "windows": {}
        });

        push.on('registration', function(data) {
            alert('registration event: ' + data.registrationId);
            //document.getElementById("regId").innerHTML = data.registrationId;
            
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
            
            // mise à jour dans la database
            var ajaxurl = "https://www.facile2soutenir.fr/wp-admin/admin-ajax.php";
            var rid = data.registrationId;
            $.ajax({
                  url: ajaxurl,
                  data: {
                        'action':'am_test_push',
                        'rid': rid,
                  },
                  success:function(resultat) {
                        //$( "#log").append('<br>Ajax est toujours un succes');
                        alert ('Ajax est toujours un succes');
                  },
                  error:function(error) {
                        alert('erreur :' + error);
                  },
            });
            
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
      alert('ready');
      $.mobile.crossDomainPages  = true;
      
      // gestion du cookie
            var F2S_cookie = '';
            $.each($.cookie(), function( index, value ){if (index.indexOf('wordpress_logged_in_') >= 0) {F2S_cookie = value;}});
      
      //mise en page
            $.mobile.ignoreContentEnabled = true;      //$.mobile.keepNative = "select,input";
      
      // initilisation de panel left      
            contenu_panel_left();
            $("#menu-left").panel().enhanceWithin();
      
      // check internet       //try{checkConnection();}catch (e) {alert("Oupps une erreur c'est produite : "+e);}
            checkConnection();
      
      // gestion connexion
            $(document).on( "click", ".btn-connexion", function(e){
                  e.preventDefault();
                  var logged_in=false;
                  $.each($.cookie(), function( index, value ){
                        if (index.indexOf('wordpress_logged_in_') >= 0) {
                              url = 'http://www.facile2soutenir.fr/mobile/?cookie_name=' + encodeURIComponent(index) + '&cookie=' + encodeURIComponent(value);
                              logged_in = true;
                              $.mobile.navigate('#accueil');
                        } 
                  });
                  console.log('not logged in');
                  if (logged_in == false) $('body').pagecontainer('change', '#connexion');
            });
      
      // Ajout des nombres rouges
            maj_nombres_rouges();
      
      
      
      $('#details-marchand').prepend('<div class="encours"><i class="fas fa-spinner fa-spin fa-3x"></i></div>');
      
      
      
      //***************
      //GESTION DE LA RECHERCHE AJAX
      //***************
      
      $(document).on( "click", ".form-container-inactif", function(e){
            $(this).toggleClass('form-container-actif');
            $(this).toggleClass('form-container-inactif');
            $('.recherche_fermer').show();
      });
      $(document).on( "blur", ".form-container-actif", function(e){
            $(this).toggleClass('form-container-actif');
            $(this).toggleClass('form-container-inactif');
            $('.recherche_fermer').hide();
            //$('.recherche_reponse').html('');
            $('.recherche_input').val('');
      });    
      $(document).mouseup(function (e){
            var container = $(".recherche_reponse");
            if (!container.is(e.target) // if the target of the click isn't the container...
                 && container.has(e.target).length === 0  // ... nor a descendant of the container
                 || $('.no-result').is(e.target))
            {
                  jQuery('.recherche_reponse').html('');
            }
      });    
      $('#marchands').on( "click", ".recherche_fermer", function(e){ // ????
            $(this).toggleClass('form-container-actif');
            $(this).toggleClass('form-container-inactif');
            $('.recherche_fermer').hide();
            $('.recherche_reponse').html('');
            $('.recherche_input').val('');
      }); 
      $('.recherche_input').on('input', function() {
            var keyword = $(this).val();
            if ( keyword.length>2){
                  $('.recherche_fermer').show();
                  $('.recherche_encours').show();
                  $.ajax({
                        url: "http://www.facile2soutenir.fr/wp-admin/admin-ajax.php",
                        cache:false,
                        data: {'action':'am_recherche_marchands', 'keyword' : keyword},
                        success:function(data) {
                              //$('.ui-content').prepend('<div class="recherche_reponse" style="display:none;">'+data+'</div>');
                              $('.recherche_reponse').html(data);
                              $('.recherche_encours').hide();
                              $( ".mlien" ).on( "click", function(e) {
                                        console.log('mlien click');
                                        videmarchand(); // vide les infos marchands initiales.
                                        var mid=$(this).attr('id'); // récupère l'ID du marchand
                                        $('.marchand-nom').text($(this).attr('title'));
                                        console.log('mid recupere : ' + mid)
                                        $( ".marchand-lien-externe" ).attr('id', mid); // positionne l'ID du marchand dans le champ ID de mobile bouton pour que la page mobile marchand puisse le recuperer
                              });                              
                        },
                        complete : function() {
                              $('.recherche_reponse').slideDown('slow');
                        }
                        
                  });  
            } else { // efface les résultats si le nb de caractère devient <3
                  $('.recherche_reponse').html('');   
            }
            if ( keyword.length==0){
                  $('.recherche_fermer').css('display', 'none');
            }
      });     

      //***************
      // PAGES INIT 
      //***************
      
      $(document).on('pageinit', '#accueil', function(){contenu_accueil();});
      $(document).on('pageinit', '#aide', function(){contenu_aide();});
      $(document).on('pageshow', '#details-ticket',function(){
            $('#details-ticket').prepend('<div class="encours"><i class="fas fa-spinner fa-spin fa-3x"></i></div>');
            var tid=$( ".ticket_actif" ).attr('id');
            $.ajax({ // recupere les infos détaillées du ticket
                  url: "http://www.facile2soutenir.fr/wp-admin/admin-ajax.php",
                  cache: false,
                  data: {
                        'action':'am_get_ticket_details',
                        'ticket_id' : tid
                  },
                  success:function(resultat){
                        $(".encours").fadeOut();
                        $("#ticket-container").html(resultat);
                        //$("#ticket-container").fadeIn();
                        $( "#form_nouvelle_reponse" ).trigger('create');
                        $('#submit_nouvelle_reponse').on('click', {ticket_id: tid, cookie: F2S_cookie}, nouvelle_reponse);
                        
                        function nouvelle_reponse(event){
                              if(event.handled !== true) {
                                    event.handled = true;
                                    if($('#contenu_nouvelle_reponse').val().length > 0 ){
                                          contenu = $('#contenu_nouvelle_reponse').val();
                                          $.ajax({
                                                url: "http://www.facile2soutenir.fr/wp-admin/admin-ajax.php",
                                                data: {
                                                      action : 'am_post_ticket',
                                                      cookie : event.data.cookie,
                                                      parent_id : event.data.ticket_id,
                                                      contenu : contenu
                                                },
                                                type: 'post',                   
                                                async: 'true',
                                                dataType: 'json',
                                                beforeSend: function() {
                                                      // show ajax spinner
                                                },
                                                complete: function() {
                                                      // hide ajax spinner
                                                },
                                                success: function (result) {
                                                      $('#ticket_nouvelle_reponse_msg').html('<div class="ticket_message"><p>Merci pour votre message.</p><p>Nous reviendrons vers vous aussi vite que possible !</p></div>');
                                                      ligne = '<tr class="wpas-reply-single new-reply" style="display:none;" valign="top"><td><div class="wpas-user-profile">'+result['avatar']+'</div></td>';
                                                      ligne += '<td> <div class="wpas-reply-meta">';
                                                      ligne += '<div class="wpas-reply-user"><span class="wpas-profilename">'+result['login']+'</span></div>';
                                                      ligne += '<div class="wpas-reply-time"><span class="wpas-human-date">'+result['date']+'</span></div>';
                                                      ligne += '</div>';
                                                      ligne += '<div class="wpas-reply-content">' + texte + '</div></td></tr>';
                                                      $('#details-ticket #table-replies tbody').append(ligne);
                                                      $('.new-reply').fadeIn(1000, function () {
                                                            $('#ticket_nouvelle_reponse').fadeOut(function(){ $('#ticket_nouvelle_reponse_msg').fadeIn() });
                                                      });
                                                },
                                                error: function (request,error) {               
                                                      alert('Oups... Erreur de reseau... Ca n\'est (sans doute) pas de notre faute. Voulez-vous reessayer ?');
                                                }
                                          });                   
                                    } else {
                                          alert('hmmm... vous n\'avez rien d\'autre a dire ?');
                                    }
                              }
                              return false;
                        }
                        
                        /*$(document).on('click', '#submit_nouvelle_reponse', {param1: tid, param2: "World"}, function(e) { // catch the form's submit event
                              if(e.handled !== true) {
                                    e.handled = true;
                                    if($('#contenu_nouvelle_reponse').val().length > 0 ){
                                          $('#form_nouvelle_reponse').prop('disabled', true);
                                          console.log('3 tid : ' + tid);
                                          console.log('3 cookie : ' + F2S_cookie);
                                          console.log(e.data.param1);
                                          console.log(e.param1);
                                          $.ajax({
                                                url: "http://www.facile2soutenir.fr/wp-admin/admin-ajax.php",
                                                data: {
                                                      action : 'am_post_ticket',
                                                      cookie : F2S_cookie,
                                                      parent : tid,
                                                      texte : $('#contenu_nouvelle_reponse').val()
                                                },
                                                type: 'post',                   
                                                async: 'true',
                                                dataType: 'json',
                                                beforeSend: function() {
                                                      // show ajax spinner
                                                },
                                                complete: function() {
                                                      // hide ajax spinner
                                                },
                                                success: function (result) {
      console.log(result);
                                                },
                                                error: function (request,error) {               
                                                      alert('Oups... Erreur de reseau... Ca n\'est (sans doute) pas de notre faute. Voulez-vous reessayer ?');
                                                }
                                          });                   
                                    } else {
                                          alert('hmmm... vous n\'avez rien d\'autre a dire ?');
                                    }
                                    
                              }
                        return false; // cancel original event to prevent form submitting
                        }); */   
                        
                        
                  },
                  error: function(erreur){
                        console.log('ERREUR' + erreur);
                  }
            });
      });
      $(document).on('pageinit', '#soutenir', function(){contenu_soutenir(10);});
      $(document).on('pageinit', '#don', function(){contenu_don();});
      $(document).on('pageinit', '#notifications', function(){contenu_notifications(10, 'toutes');});
      $(document).on('pageinit', '#profil', function(){contenu_profil();});
      $(document).on('pageshow', '#details-marchand',function(){
            var mid = $( ".marchand-lien-externe" ).attr('id'); // recupere l'id du marchand dans le champ ID de mobile bouton
        
      // colorie l'icone favori
            /*if (jQuery.inArray( mid, marchands_favoris )>-1) {
                  jQuery( ".mobile-fav" ).addClass('favori');
            } else {
                  jQuery( ".mobile-fav" ).removeClass('favori');
            }*/
      
      	
            $.ajax({ // recupere les infos détaillées du marchand
                  url: "http://www.facile2soutenir.fr/wp-admin/admin-ajax.php",
                  dataType: 'json',
                  cache: false,
                  data: {
                        'action':'am_get_marchand_info',
                        'mid' : mid
                  },
                  success:function(marchand){
                        
                        $("#header-marchand-nom").html(marchand['nom']);
                        $("#marchand-details-logo").attr('src', marchand['logo']);
                        $( ".marchand-lien-externe" ).attr('href', 'http://www.facile2soutenir.fr/go/' + marchand['lien']+ '?webapp='+mid); // weba^pp
                        if (marchand['conditions']!='') {      
                              $(".marchand-warning").html(marchand['conditions']);
                              $(".marchand-warning").show();
                        } else {
                              $(".marchand-warning").hide();
                        } 
                        $(".marchand-collecte").html(marchand['collecte']);
                        
                        $('#details-marchand .encours').fadeOut(function(){ $('#details-marchand .ui-content').fadeIn() });
                        //$('.encours').fadeOut();
                        //$(".marchand-container").fadeIn();
                        
                        
                        $( ".mobile-fav" ).on( "click", function(e) {
                              jQuery( this ).toggleClass( "marchand-favori" );
                              jQuery.ajax({
                                    url: "http://www.facile2soutenir.fr/wp-admin/admin-ajax.php",
                                    data: {
                                          'action':'am_toggle_marchand_favori',
                                          'mid' : mid
                                    },
                                    success:function(resultat) {},
                              });
                        });
                  },
                  error:function(erreur) {console.log('ERREUR' + erreur);},
                  
            });
      });
      $(document).on('pagebeforeshow', '#nointernet', function (e, data) {contenu_nointernet(data);});
      //$(document).on('pageshow', '#nointernet', function(){contenu_nointernet();});
      
      $(document).on( 'click', '#get_accueil', function(e){contenu_accueil();});
      $(document).on( 'click', '#get_aide', function(e){contenu_aide();});
      $(document).on( 'click', '#get_soutenir', function(e){contenu_soutenir(10);});
      $(document).on( 'click', '#contenu_don', function(e){contenu_don();});
      $(document).on( 'click', '#get_notifications',function(){contenu_notifications(10, 'toutes');});
      $(document).on( 'click', '#contenu_profil', function(e){contenu_profil();});
      
      function contenu_panel_left() {
            $.ajax({
                  url: "http://www.facile2soutenir.fr/wp-admin/admin-ajax.php",
                  cache:false,
                  data: {'action':'am_contenu_panel_left', 'cookie' : F2S_cookie},
                  success:function(resultat) {
                        $('#panel-container').html(resultat);
                  },
                  complete:function() {
                        $( ".lien-categorie" ).on( "click", function(e) {
                              var slug=jQuery(this).attr('id');
                              //$( ".liste-marchands" ).attr('id', slug);
                              //$.mobile.navigate('#accueil');
                              contenu_liste_marchands ('', slug);
                        });
                        $( ".mlien" ).on( "click", function(e) {
                              videmarchand(); // vide les infos marchands initiales.
                              var mid=$(this).attr('id'); // récupère l'ID du marchand
                              $( ".marchand-lien-externe" ).attr('id', mid); // positionne l'ID du marchand dans le champ ID de mobile bouton pour que la page mobile marchand puisse le recuperer
                        });
                  }
            });
      } 
      function contenu_accueil() {
            $('#accueil-container').html('');
            $('#accueil').prepend('<div class="encours"><i class="fas fa-spinner fa-spin fa-3x"></i></div>');
            $.ajax({
                  url: "http://www.facile2soutenir.fr/wp-admin/admin-ajax.php",
                  cache:false,
                  data: {'action':'am_contenu_accueil', 'cookie' : F2S_cookie},
                  success:function(resultat) {
                        $('.encours').fadeOut();
                        $('#accueil-container').html(resultat);
                  },
                  complete:function() {
                        $( ".lien-categorie" ).on( "click", function(e) {
                              var slug=jQuery(this).attr('id');
                              contenu_liste_marchands ('', slug);
                        });
                        $( ".mlien" ).on( "click", function(e) {
                              videmarchand(); // vide les infos marchands initiales.
                              var mid=$(this).attr('id'); // récupère l'ID du marchand
                              $('.marchand-nom').text($(this).attr('title'));
                              $( ".marchand-lien-externe" ).attr('id', mid); // positionne l'ID du marchand dans le champ ID de mobile bouton pour que la page mobile marchand puisse le recuperer
                        });
                  }
            });
      }
      function contenu_soutenir(nombre, type) {
            $('#soutenir').prepend('<div class="encours"><i class="fas fa-spinner fa-spin fa-3x"></i></div>');
            
            $.ajax({
                  url: "http://www.facile2soutenir.fr/wp-admin/admin-ajax.php",
                  cache:false,
                  data: {'action':'am_contenu_soutenir', 'cookie' : F2S_cookie, 'type' : type, 'nombre' : nombre},
                  success:function(resultat) {
                        $('.encours').fadeOut();
                        $('#soutenir-container').html(resultat);
                        $('.nav-soutenir .number_container').fadeOut();
                  },
                  error:function(erreur) {console.log('ERREUR' + erreur);}
            });
      }
      function contenu_notifications(nombre, type) {
            $('#notifications').prepend('<div class="encours"><i class="fas fa-spinner fa-spin fa-3x"></i></div>');
            
            $.ajax({
                  url: "http://www.facile2soutenir.fr/wp-admin/admin-ajax.php",
                  cache:false,
                  data: {'action':'am_contenu_notifications', 'cookie' : F2S_cookie, 'type' : type, 'nombre' : nombre},
                  success:function(resultat) {
                        $('.encours').fadeOut();
                        $('#notifications-container').html(resultat);
                        $('.nav-notifications .number_container').fadeOut();
                        $(document).on( "click", "#btn-toutes", function(){
                              /*$(this).addClass('bouton-bleu').removeClass('bouton-inverse');
                              $('#btn-achats').addClass('bouton-inverse').removeClass('bouton-bleu');
                              $('#btn-actus').addClass('bouton-inverse').removeClass('bouton-bleu');*/
                              contenu_notifications(10, 'toutes');
                        });              
                        $(document).on( "click", "#btn-achats", function(){
                              /*$(this).addClass('bouton-bleu').removeClass('bouton-inverse');
                              $('#btn-toutes').addClass('bouton-inverse').removeClass('bouton-bleu');
                              $('#btn-actus').addClass('bouton-inverse').removeClass('bouton-bleu');*/
                              contenu_notifications(10, 'achats');
                        });
                        $(document).on( "click", "#btn-actus", function(){
                              /*$(this).addClass('bouton-bleu').removeClass('bouton-inverse');
                              $('#btn-toutes').addClass('bouton-inverse').removeClass('bouton-bleu');
                              $('#btn-achats').addClass('bouton-inverse').removeClass('bouton-bleu');*/
                              contenu_notifications(10, 'actus');
                        });
                  }
            });
      }
      function contenu_aide() {
            $('#aide').prepend('<div class="encours"><i class="fas fa-spinner fa-spin fa-3x"></i></div>');
            
            $.ajax({
                  url: "http://www.facile2soutenir.fr/wp-admin/admin-ajax.php",
                  cache:false,
                  data: {'action':'am_contenu_aide', 'cookie' : F2S_cookie},
                  success:function(resultat) {
                        $('.encours').fadeOut();
                        $('#aide-container').html(resultat);
                        $('.nav-aide .number_container').fadeOut();
                        $(".ticket_link").on( "click", function(e){
                              $(this).parents().find('a').removeClass("ticket_actif");
                              videticket();
                              $(this).addClass('ticket_actif');
                              $('.ticket-titre').text($(this).text());
                        });
                        
                        $( "#form_nouvelle_demande" ).trigger('create');
                        $('#submit_nouvelle_demande').on('click', {cookie: F2S_cookie}, nouvelle_demande);
                        
                        function nouvelle_demande(event){
                              if(event.handled !== true) {
                                    event.handled = true;
                                    if($('#contenu_nouvelle_demande').val().length > 0 ){
                                          titre=$('#titre_nouvelle_demande').val();
                                          contenu = $('#contenu_nouvelle_demande').val();
                                          
                                          $.ajax({
                                                url: "http://www.facile2soutenir.fr/wp-admin/admin-ajax.php",
                                                data: {
                                                      action : 'am_post_ticket',
                                                      cookie : event.data.cookie,
                                                      contenu : contenu,
                                                      titre : titre
                                                },
                                                type: 'post',                   
                                                async: 'true',
                                                dataType: 'json',
                                                beforeSend: function() {// show ajax spinner
                                                },
                                                complete: function() {
                                                      // hide ajax spinner
                                                },
                                                success: function (result) {                                                      
                                                      $('#ticket_nouvelle_demande_msg').html('<div class="ticket_message"><p>Merci pour votre message.</p><p>Nous reviendrons vers vous aussi vite que possible !</p></div>');
                                                            ligne = '<tr style="display:none;" class="new-demande"><td><span class="wpas-label status-new">nouveau</span>';
                                                            ligne += '<td><div id="'+result['ticket_id']+'" class="ticket_link">'+ titre +' (#' + result['ticket_id'] + ')</div></td>';
                                                            ligne += '<td>'+result['date']+'</td></tr>';
                                                            $('.wpas-ticket-details-header tbody').append(ligne);
                                                            $('.new-demande').fadeIn(1000, function () {
                                                                  $('#ticket_nouvelle_demande').fadeOut(function(){ $('#ticket_nouvelle_demande_msg').fadeIn() });
                                                      });
                                                },
                                                error: function (request,error) {               
                                                      alert('Oups... Erreur de reseau... Ca n\'est (sans doute) pas de notre faute. Voulez-vous reessayer ?');
                                                }
                                          });                   
                                    } else {
                                          alert('hmmm... vous n\'avez rien d\'autre a dire ?');
                                    }
                              }
                              return false;
                        }   
                  }
            });
      }   
      function contenu_profil() {
            $('#profil').prepend('<div class="encours"><i class="fas fa-spinner fa-spin fa-3x"></i></div>');
            $('.nav-profil .number_container').fadeOut();
            $.ajax({
                  url: "http://www.facile2soutenir.fr/wp-admin/admin-ajax.php",
                  cache:false,
                  data: {'action':'am_contenu_profil', 'cookie' : F2S_cookie},
                  success:function(resultat) {
                        $('.encours').fadeOut();
                        $('#user-profil').html(resultat);
                        $('.nav-soutenir .number_container').fadeOut();
                  },
                  error:function(erreur) {console.log('ERREUR' + erreur);},
                  complete:function(){
                        $( "#mform-choix-cause" ).trigger('create');
                        $( "#choix-cause-input" ).textinput({clearBtn: true});
                        $( "#don-auto" ).flipswitch(); // switch don auto
            
                        // ************** LISTENER changement don auto
                        $("#don-auto").change(function () {
                              $( ".texte-auto" ).toggleClass('hide');
                              $.ajax({
                                    url: "https://www.facile2soutenir.fr/wp-admin/admin-ajax.php",
                                    cache:false,
                                    data: {
                                          'action':'am_update_don_auto',
                                          'auto' : $(this).val(),
                                          'cookie' : F2S_cookie,
                                    },
                                    success:function(data) {}
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
                              jQuery( "#liste-achats .achat:hidden" ).each(function( index ) {
                                    i++;
                                    if (i<=10) {
                                          $(this).show('slow');
                                    }
                              });
                              if (i<10) $( "#voirplus" ).hide();
                        });
                        
                        
                        function maj_affichage_favorite() {
                              //console.log($('#choix-cause-user').val());
                              //console.log($('#choix-cause-id').val());
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
                                          //console.log('update_don_auto ok');
                                          //console.log(data);
                                    }
                              });
                              
                        }
                        
                        
                        
                        
                        
                        
                  }
            });
      }
      function contenu_don() {
            $.ajax({
                  url: "http://www.facile2soutenir.fr/wp-admin/admin-ajax.php",
                  cache:false,
                  data: {'action':'am_contenu_don', 'cookie' : F2S_cookie},
                  success:function(resultat) {
                        $('#user-don-container').html(resultat);
                  },
                  error:function(erreur) {console.log('ERREUR' + erreur);},
                  complete:function(){
                        $( "#mform-don" ).trigger('create');
                        $( "#choix-cause-don-input" ).textinput({clearBtn: true});
            

                        // ************** LISTENER liste des asso
                        $( "#liste-causes-don" ).on( "filterablebeforefilter", function ( e, data ) {
                              var jQueryul = $( this ),
                              jQueryinput = $( data.input ),
                              value = jQueryinput.val(),
                              html = "";
                              jQueryul.html( "" );
                              $( "#btn-don").removeClass('btn-don-actif');
                              $( "#don-cause").val("");
                              //if (!value) $('#choix-cause-erreur-dons').hide();
                              if ( value && value.length >= 0.5 ) {
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
                        $(document).on( "click", "#liste-causes-don li", function(){
                              var bloc=jQuery(this).children('.mbloc-cause');
                              var cause_id = bloc.attr('id');
                              var cause_nom=jQuery(this).find('.nom-cause').text();
                              jQuery('#choix-cause-don-input').val(cause_nom);
                              jQuery('#don-cause').val(cause_id);
                              jQuery('#liste-causes-don').html( "" );
                              jQuery('#choix-cause-don-input').removeClass("cause-incorrecte");
                              jQuery('#cause-erreur-don').hide().text('Oups...');
                              if (!jQuery('#don-montant').hasClass("valeur-incorrecte")) {
                                    jQuery( "#btn-don").addClass('btn-don-actif');
                              }
                        });
                        
                        $( "#choix-cause-don-input" ).blur(function() {
                              if (!jQuery( "#don-cause").val()) {
                                    jQuery(this).addClass("cause-incorrecte");
                                    jQuery('#cause-erreur-don').text('Oups... je ne trouve pas cette cause').show();
                                    jQuery( "#btn-don").removeClass('btn-don-actif');
                              } else {
                                    jQuery(this).removeClass("cause-incorrecte");
                                    jQuery('#cause-erreur-don').hide().text('Oups...');
                                    
                                    if (!jQuery('#don-montant').hasClass("valeur-incorrecte")) {
                                          jQuery( "#btn-don").addClass('btn-don-actif');
                                    }
                              }
                        });
                        
                        jQuery( "#don-montant" ).blur(function() {
                              var dispo = parseFloat(jQuery('.disponible').html().replace(",", "."));
                              if (!jQuery.isNumeric(jQuery(this).val())) {
                                     jQuery(this).addClass("valeur-incorrecte");
                                     jQuery('#don-erreur').text('Oups... la valeur du don est incorrecte').show();
                                     jQuery( "#btn-don").removeClass('btn-don-actif');
                              } else {
                                    if (jQuery(this).val() > dispo) {
                                          jQuery(this).addClass("valeur-incorrecte");
                                          jQuery('#don-erreur').text('Oups... c\'est un petit peu trop par rapport au montant disponible').show();
                                          jQuery( "#btn-don").removeClass('btn-don-actif');
                                    } else {
                                          jQuery(this).removeClass("valeur-incorrecte");
                                          jQuery('#don-erreur').hide().text('Oups...');
                                          
                                          if (jQuery( "#don-cause").val()>0 && jQuery( "#don-montant").val() >0) {
                                                jQuery( "#btn-don").addClass('btn-don-actif');
                                          }
                                    }
                              }
                              
                        });
                        
                       jQuery(document).on('click', '.btn-don-actif', function() {    
                              //var data = jQuery("#mform-don").serialize();
                              //console.log(data);
                              if ( !jQuery("#don-montant").hasClass("valeur-incorrecte")) {
                                    jQuery.ajax({
                                          type: 'POST', 
                                          url: 'https://www.facile2soutenir.fr/wp-admin/admin-ajax.php',
                                          dataType: 'json',
                                          cache:false,
                                          data: {
                                                action : 'don_mob',
                                                montant : jQuery('#don-montant').val(),
                                                user_id : jQuery('#don-user').val(),
                                                cause_id : jQuery('#don-cause').val(),
                                                //formData : data // Convert a form to a JSON string representation
                                          },            
                                          complete: function() { // This callback function will trigger on data sent/received complete
                                                //console.log('complete');
                                          },
                                          success: function (resultat) {
                                                //console.log(resultat);
                                                //console.log(resultat['message']);
                                                //console.log(resultat['disponible']);
                                                 jQuery('.remerciements-message').html(resultat['message']);
                                                 jQuery('.remerciements-don').show('slow');
                                                 jQuery('.disponible').html(resultat['disponible']);
                                                 
                                                 var targetOffset = jQuery(".remerciements-don").offset().top;
                                                 jQuery('html, body').animate({ scrollTop: targetOffset }, 1000);
                                    
                                                 jQuery('#remerciements-logo').attr('src', resultat['logo']);
                                                 cleandon();
                                          },
                                          error: function (request,error) { // This callback function will trigger on unsuccessful action
                                                //console.log('error');
                                                //console.log(request);
                                                //console.log(error);f
                                                //alert('Oups, petit probleme...');
                                          }
                                    });
                              }
                              else { alert ('le montant du don est incorrect');}
                        });
                        
                        
                  }
            });
      }
      function contenu_liste_marchands (nombre, categorie) { // 3eme param pour "a partir de ..." ?
            $('#liste_marchands_container').html('<div class="encours"><i class="fas fa-spinner fa-spin fa-3x"></i></div>');
            $.ajax({
                  url: "http://www.facile2soutenir.fr/wp-admin/admin-ajax.php",
                  cache:false,
                  data: {'action':'am_contenu_liste_marchands', 'nombre' : nombre, 'categorie' : categorie},
                  success:function(resultat) {
                        $('#liste_marchands_container .encours').fadeOut();
                        $('#liste_marchands_container').html(resultat);
                        
                        $( ".mlien" ).on( "click", function(e) {
                              videmarchand(); // vide les infos marchands initiales.
                              var mid=$(this).attr('id'); // récupère l'ID du marchand
                              $('.marchand-nom').text($(this).attr('title'));
                              //console.log('mid recupere : ' + mid)
                              $( ".marchand-lien-externe" ).attr('id', mid); // positionne l'ID du marchand dans le champ ID de mobile bouton pour que la page mobile marchand puisse le recuperer
                        });
                  },
                  error:function(erreur) {console.log('ERREUR' + erreur);}
            });
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
      function update_nr(type, nombre){
           /* if (type=='accueil') block=$('.ui-footer .ui-block-a');
            if (type=='aide') block=$('.ui-footer .ui-block-b');
            if (type=='soutenir') block=$('.ui-footer .ui-block-c');
            if (type=='notifications') block=$('.ui-footer .ui-block-d');
            if (type=='profil') block=$('.ui-footer .ui-block-e');*/
            block=$('.nav-'+type);
            if(block.find('.number_container').length == 0) block.prepend('<div class="number_container"><div class="number"></div></div>');
            block.find('.number').html(nombre);
            if (nombre>0) block.find('.number_container').show();
            else block.find('.number_container').hide();
            
      }
      function contenu_nointernet(data) {
            var previous = data.prevPage.attr('id');
            vibre();
            var refreshIntervalId = setInterval(function () {
                  if (checkConnection()!=false) {
                        clearInterval(refreshIntervalId);
                        $('.connexion-off').hide();
                        $('.connexion-on').fadeIn();
                        setTimeout(function() {
                              $.mobile.changePage($('#'+previous));
                        }, 3000);
                  }
                  //connectionStatus = navigator.onLine ? 'online' : 'offline';
            }, 5000);
      } 
}

function checkConnection() {
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
            $.mobile.changePage($('#nointernet'), 'flip', false, true);
            return false;
      } else {
            return states[networkState];
      }
      
      
}
function vibre () {
      navigator.vibrate(1000);
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
      $('#details-marchand .ui-content').hide();
      $('#details-marchand .encours').show();
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
                  //console.log(data);
                  if (data.status=="ok") {
                        var cookie=data.cookie;
                        var cookie_name=data.cookie_name;
                        var user_id=data.user.id;
                        url = 'http://www.facile2soutenir.fr/mobile/?user_id=' + user_id + '&cookie_name=' + encodeURIComponent(cookie_name) + '&cookie=' + encodeURIComponent(cookie);
                        $.cookie(cookie_name, cookie, { expires: 365*5, path: '/' });
// F2S_cookie = cookie; marche pas
                        //console.log(cookie);
                        //console.log(encodeURIComponent(cookie));

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



      /*
       *$(document).on('pageinit', '#liste_marchands', function(){contenu_liste_marchands (10);});
      $(document).on( 'click', '#contenu_liste_marchands', function(e){contenu_liste_marchands (4);});
      
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
      */
