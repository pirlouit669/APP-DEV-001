
var openFB = (function () {
alert('openFB');
      var loginURL = 'https://www.facebook.com/dialog/oauth',
          logoutURL = 'https://www.facebook.com/logout.php',

    // By default we store fbtoken in sessionStorage. This can be overridden in init()
            tokenStore = window.sessionStorage,

    // The Facebook App Id. Required. Set using init().
            fbAppId,

            context = window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/")),

            baseURL = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '') + context,

    // Default OAuth redirect URL. Can be overriden in init()
            oauthRedirectURL = baseURL + '/oauthcallback.html',

    // Default Cordova OAuth redirect URL. Can be overriden in init()
            cordovaOAuthRedirectURL = "https://www.facebook.com/connect/login_success.html",

    // Default Logout redirect URL. Can be overriden in init()
            logoutRedirectURL = baseURL + '/logoutcallback.html',

    // Because the OAuth login spans multiple processes, we need to keep the login callback function as a variable
    // inside the module instead of keeping it local within the login function.
            loginCallback,

    // Indicates if the app is running inside Cordova
            runningInCordova,

    // Used in the exit event handler to identify if the login has already been processed elsewhere (in the oauthCallback function)
            loginProcessed;
            
    
    //if (navigator.userAgent.match(/(ios|iPhone|iPod|iPad|Android|BlackBerry|IEMobile)/)) {}
            runningInCordova = true;
     //

    /*
            
    document.addEventListener("deviceready", function () {
            runningInCordova = true;
    }, false);
    */

    /**
     * Initialize the OpenFB module. You must use this function and initialize the module with an appId before you can
     * use any other function.
     * @param params - init paramters
     *  appId: (Required) The id of the Facebook app,
     *  tokenStore: (optional) The store used to save the Facebook token. If not provided, we use sessionStorage.
     *  loginURL: (optional) The OAuth login URL. Defaults to https://www.facebook.com/dialog/oauth.
     *  logoutURL: (optional) The logout URL. Defaults to https://www.facebook.com/logout.php.
     *  oauthRedirectURL: (optional) The OAuth redirect URL. Defaults to [baseURL]/oauthcallback.html.
     *  cordovaOAuthRedirectURL: (optional) The OAuth redirect URL. Defaults to https://www.facebook.com/connect/login_success.html.
     *  logoutRedirectURL: (optional) The logout redirect URL. Defaults to [baseURL]/logoutcallback.html.
     *  accessToken: (optional) An already authenticated access token.
     */
    function init(params) {
alert('OpenFB init');      
            if (params.appId) {
                  fbAppId = params.appId;
            } else {
                  throw 'appId parameter not set in init()';
            }
    
            if (params.tokenStore) {
                  tokenStore = params.tokenStore;
            }
    
            if (params.accessToken) {
                  tokenStore.fbAccessToken = params.accessToken;
            }
    
            loginURL = params.loginURL || loginURL;
            logoutURL = params.logoutURL || logoutURL;
            oauthRedirectURL = params.oauthRedirectURL || oauthRedirectURL;
            cordovaOAuthRedirectURL = params.cordovaOAuthRedirectURL || cordovaOAuthRedirectURL;
            logoutRedirectURL = params.logoutRedirectURL || logoutRedirectURL;

    }

    /**
     * Checks if the user has logged in with openFB and currently has a session api token.
     * @param callback the function that receives the loginstatus
     */
      function getLoginStatus(callback) {
            var token = tokenStore.fbAccessToken,
                  loginStatus = {};
            if (token) {
                  loginStatus.status = 'connected';
                  loginStatus.authResponse = {accessToken: token};
            } else {
                  loginStatus.status = 'unknown';
            }
            if (callback) callback(loginStatus);
      }

    /**
     * Login to Facebook using OAuth. If running in a Browser, the OAuth workflow happens in a a popup window.
     * If running in Cordova container, it happens using the In-App Browser. Don't forget to install the In-App Browser
     * plugin in your Cordova project: cordova plugins add org.apache.cordova.inappbrowser.
     *
     * @param callback - Callback function to invoke when the login process succeeds
     * @param options - options.scope: The set of Facebook permissions requested
     * @returns {*}
     */
      function login(callback, options) {

            var loginWindow,
                startTime,
                scope = '',
                redirectURL = runningInCordova ? cordovaOAuthRedirectURL : oauthRedirectURL;

                
alert('redirectURL : ' + redirectURL);
//redirectURL = oauthRedirectURL;
                
                
            if (!fbAppId) {
                  return callback({status: 'unknown', error: 'Facebook App Id not set.'});
            }

        // Inappbrowser load start handler: Used when running in Cordova only
            function loginWindow_loadStartHandler(event) {
                  var url = event.url;
alert('url : ' + url);                  
                  if (url.indexOf("access_token=") > 0 || url.indexOf("error=") > 0) {
                        // When we get the access token fast, the login window (inappbrowser) is still opening with animation
                        // in the Cordova app, and trying to close it while it's animating generates an exception. Wait a little...
                        var timeout = 600 - (new Date().getTime() - startTime);
                        setTimeout(function () {
                              loginWindow.close();
                        }, timeout > 0 ? timeout : 0);
                        oauthCallback(url);
                  }
            }

        // Inappbrowser exit handler: Used when running in Cordova only
            function loginWindow_exitHandler() {
                  console.log('exit and remove listeners');
                  // Handle the situation where the user closes the login window manually before completing the login process
                  if (loginCallback && !loginProcessed) loginCallback({status: 'user_cancelled'});
                  loginWindow.removeEventListener('loadstop', loginWindow_loadStopHandler);
                  loginWindow.removeEventListener('exit', loginWindow_exitHandler);
                  loginWindow = null;
                  console.log('done removing listeners');
            }

            if (options && options.scope) {
                  scope = options.scope;
            }

            loginCallback = callback;
            loginProcessed = false;
    
            startTime = new Date().getTime();
            loginWindow = window.open(loginURL + '?client_id=' + fbAppId + '&redirect_uri=' + redirectURL +
                '&response_type=token&scope=' + scope, '_blank', 'location=no,clearcache=yes');
    
            // If the app is running in Cordova, listen to URL changes in the InAppBrowser until we get a URL with an access_token or an error
            if (runningInCordova) {
                  loginWindow.addEventListener('loadstart', loginWindow_loadStartHandler);
                  loginWindow.addEventListener('exit', loginWindow_exitHandler);
            }
            // Note: if the app is running in the browser the loginWindow dialog will call back by invoking the
            // oauthCallback() function. See oauthcallback.html for details.
    
      }

      /**
      * Called either by oauthcallback.html (when the app is running the browser) or by the loginWindow loadstart event
      * handler defined in the login() function (when the app is running in the Cordova/PhoneGap container).
      * @param url - The oautchRedictURL called by Facebook with the access_token in the querystring at the ned of the
      * OAuth workflow.
      */
      function oauthCallback(url) {
            // Parse the OAuth data received from Facebook
            var queryString,
                  obj;

            loginProcessed = true;
            if (url.indexOf("access_token=") > 0) {
                  queryString = url.substr(url.indexOf('#') + 1);
                  obj = parseQueryString(queryString);
                  tokenStore.fbAccessToken = obj['access_token'];
                  if (loginCallback) loginCallback({status: 'connected', authResponse: {accessToken: obj['access_token']}});
            } else if (url.indexOf("error=") > 0) {
                  queryString = url.substring(url.indexOf('?') + 1, url.indexOf('#'));
                  obj = parseQueryString(queryString);
                  if (loginCallback) loginCallback({status: 'not_authorized', error: obj.error});
            } else {
                  if (loginCallback) loginCallback({status: 'not_authorized'});
            }
      }

    /**
     * Logout from Facebook, and remove the token.
     * IMPORTANT: For the Facebook logout to work, the logoutRedirectURL must be on the domain specified in "Site URL" in your Facebook App Settings
     *
     */
    function logout(callback) {
        var logoutWindow,
            token = tokenStore.fbAccessToken;

        /* Remove token. Will fail silently if does not exist */
        tokenStore.removeItem('fbtoken');

        if (token) {
            logoutWindow = window.open(logoutURL + '?access_token=' + token + '&next=' + logoutRedirectURL, '_blank', 'location=no,clearcache=yes');
            if (runningInCordova) {
                setTimeout(function() {
                    logoutWindow.close();
                }, 700);
            }
        }

        if (callback) {
            callback();
        }

    }

    /**
     * Lets you make any Facebook Graph API request.
     * @param obj - Request configuration object. Can include:
     *  method:  HTTP method: GET, POST, etc. Optional - Default is 'GET'
     *  path:    path in the Facebook graph: /me, /me.friends, etc. - Required
     *  params:  queryString parameters as a map - Optional
     *  success: callback function when operation succeeds - Optional
     *  error:   callback function when operation fails - Optional
     */
    function api(obj) {

        var method = obj.method || 'GET',
            params = obj.params || {},
            xhr = new XMLHttpRequest(),
            url;

        params['access_token'] = tokenStore.fbAccessToken;

        url = 'https://graph.facebook.com' + obj.path + '?' + toQueryString(params);

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    if (obj.success) obj.success(JSON.parse(xhr.responseText));
                } else {
                    var error = xhr.responseText ? JSON.parse(xhr.responseText).error : {message: 'An error has occurred'};
                    if (obj.error) obj.error(error);
                }
            }
        };

        xhr.open(method, url, true);
        xhr.send();
    }

    /**
     * Helper function to de-authorize the app
     * @param success
     * @param error
     * @returns {*}
     */
    function revokePermissions(success, error) {
        return api({method: 'DELETE',
            path: '/me/permissions',
            success: function () {
                success();
            },
            error: error});
    }

    function parseQueryString(queryString) {
        var qs = decodeURIComponent(queryString),
            obj = {},
            params = qs.split('&');
        params.forEach(function (param) {
            var splitter = param.split('=');
            obj[splitter[0]] = splitter[1];
        });
        return obj;
    }

    function toQueryString(obj) {
        var parts = [];
        for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
                parts.push(encodeURIComponent(i) + "=" + encodeURIComponent(obj[i]));
            }
        }
        return parts.join("&");
    }

    // The public API
    return {
        init: init,
        login: login,
        logout: logout,
        revokePermissions: revokePermissions,
        api: api,
        oauthCallback: oauthCallback,
        getLoginStatus: getLoginStatus
    }

}());

var app = {
    
      initialize: function() { // Application Constructor
            this.bindEvents();
      },
      bindEvents: function() { // Bind Event Listeners : Bind any events that are required on startup. Common events are: 'load', 'deviceready', 'offline', and 'online'.
            document.addEventListener('deviceready', this.onDeviceReady, false);
            
      },
      onDeviceReady: function() { // deviceready Event Handler: The scope of 'this' is the event. In order to call the 'receivedEvent' function, we must explicitly call 'app.receivedEvent(...);'
            app.setupPush();
            document.addEventListener("offline", offline, false);
            document.addEventListener("online", online, false);
            ready();
            delete window.open; // a cause de inapp browser qui override window.open ce qui fait planter le login facebook
            window.open = browserDefault;
      },
      setupPush: function() {
            var push = PushNotification.init({
                  "android": {
                        "senderID": "1005363421918",
                        "sound": true,
                        "vibration": true,
                  },
                  "browser": {},
                  "ios": {
                        "senderID": "1005363421918",// macdonst : if you don't provide the GCM Sender ID to the ios options then it will use APNS by default.
                        "fcmSandbox": false,
                        "sound": true,
                        "vibration": true,
                        "badge": true,
                        /*"categories": {
                              "invite": {
                                    "yes": {
                                          "callback": "accept", "title": "D\'accord", "foreground": true, "destructive": false
                                    },
                                    "no": {
                                          "callback": "reject", "title": "Non merci", "foreground": true, "destructive": false
                                    },
                                    "maybe": {
                                          "callback": "maybe", "title": "Peut-être", "foreground": true, "destructive": false
                                    }
                              },
                              "delete": {
                                    "yes": {
                                          "callback": "doDelete", "title": "Delete", "foreground": true, "destructive": true
                                    },
                                    "no": {
                                          "callback": "cancel", "title": "Cancel", "foreground": true, "destructive": false
                                    }
                              }
                        }*/
                  },
                  "windows": {}
            });
        
      push.on('registration', function(data) {
            var rid = data.registrationId;
            console.log('registration event: ' + rid);

            $("#affichage-rid").html(rid);
            
            
            var oldRegId = localStorage.getItem('registrationId');
            if (oldRegId !== rid) {
                  // Save new registration ID
                  localStorage.setItem('registrationId', rid);
                  // Post registrationId to your app server as the value has changed
                  // mise à jour dans la database
                  $.ajax({
                        url: "https://www.facile2soutenir.fr/wp-admin/admin-ajax.php",
                        data: {
                              //'action':'am_test_push',
                              'action':'am_registration_push',
                              'rid': rid,
                        },
                  });
            }
      });


        push.on('error', function(e) {
            console.log("push error = " + e.message);
            // balancer dans database error
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

var previous="connexion";
function offline() {
      $('.connexion-on').hide();
      $('.connexion-off').show();
      $.mobile.changePage($('#nointernet'), 'pop', false, true);
}
function online() {
      $('.connexion-off').hide();
      $('.connexion-on').fadeIn();
      setTimeout(function() {
            $.mobile.changePage($('#'+previous));
      }, 3000);
}


function ready () {
      
      alert('before open FB init');
      openFB.init({appId: '204764659934740'});
      alert('after open FB init');
      window.dispo = 0;

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
            checkConnection(); // depre ?
      
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
                  
                  if (logged_in == false) {
                        console.log('not logged in');
                        $('body').pagecontainer('change', '#connexion');
                  }
            });
      
      // Ajout des nombres rouges
            maj_nombres_rouges();
      
      
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
      
      /*$(document).on('pageinit', '#landing', function(){
            $( "#btn-connexion-fb" ).on( "click", function(e) {
                  connexion_facebook();
            });
      });*/
      
      
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
                              console.log ('nouvelle reponse');
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
                                                      console.log(result);
                                                      $('#ticket_nouvelle_reponse_msg').html('<div class="ticket_message"><p>Merci pour votre message.</p><p>Nous reviendrons vers vous aussi vite que possible !</p></div>');
                                                      ligne = '<tr class="wpas-reply-single new-reply" style="display:none;" valign="top"><td><div class="wpas-user-profile">'+result['avatar']+'</div></td>';
                                                      ligne += '<td> <div class="wpas-reply-meta">';
                                                      ligne += '<div class="wpas-reply-user"><span class="wpas-profilename">'+result['login']+'</span></div>';
                                                      ligne += '<div class="wpas-reply-time"><span class="wpas-human-date">'+result['date']+'</span></div>';
                                                      ligne += '</div>';
                                                      ligne += '<div class="wpas-reply-content">' + contenu + '</div></td></tr>';
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
      $(document).on('pageinit', '#planter', function(){contenu_planter();});
      $(document).on('pageinit', '#notifications', function(){contenu_notifications(10, 'toutes');});
      $(document).on('pageinit', '#profil', function(){contenu_profil();});
      $(document).on('pageinit', '#details-marchand', function(){
            $('#details-marchand').prepend('<div class="encours"><i class="fas fa-spinner fa-spin fa-3x"></i></div>');
            $(document).on( 'click', '.marchand-lien-externe', function(e){contenu_accueil();});
      });
      $(document).on('pageshow', '#details-marchand',function(){
            var mid = $( ".marchand-lien-externe" ).attr('id'); // recupere l'id du marchand dans le champ ID de mobile bouton
            console.log('mid en cours : ' + mid);
      // colorie l'icone favori
            /*if (jQuery.inArray( mid, marchands_favoris )>-1) {
                  jQuery( ".mobile-fav" ).addClass('favori');
            } else {
                  jQuery( ".mobile-fav" ).removeClass('favori');
            }*/
      
      	
            $.ajax({ // recupere les infos détaillées du marchand
                  url: "http://www.facile2soutenir.fr/wp-admin/admin-ajax.php",
                  cache: false,
                  dataType: 'json',
                  data: {'action':'am_contenu_details_marchand', 'mid' : mid, 'cookie' : F2S_cookie},
                  success:function(marchand){

                        $("#header-marchand-nom").html(marchand['nom']);
                        $('#marchand-infos').html(marchand['infos']);
                        $( ".marchand-lien-externe" ).attr('href', 'http://www.facile2soutenir.fr/go/' + marchand['lien']+ '?webapp='+mid); // weba^pp
                        if (marchand['isfav']==true) $( ".mobile-fav" ).addClass( "marchand-favori" );
                        
                        $('#details-marchand .encours').fadeOut(function(){ $('#details-marchand .ui-content').fadeIn() });
                        //$('.encours').fadeOut();
                        //$(".marchand-container").fadeIn();

                        $( ".mobile-fav" ).on( "click", function(e) {
                              if(e.handled !== true) {
                                    e.handled = true;
                                    jQuery( this ).toggleClass( "marchand-favori" );
                                    mid = $( ".marchand-lien-externe" ).attr('id');
                                    jQuery.ajax({
                                          url: "http://www.facile2soutenir.fr/wp-admin/admin-ajax.php",
                                          data: {
                                                'action':'am_toggle_marchand_favori',
                                                'mid' : mid
                                          },
                                          success:function(resultat) {
                                                var nb = parseInt($.trim($('#nb_marchands_favoris').html()));                                              
                                                if ($( ".mobile-fav" ).hasClass( "marchand-favori" ))  { // ajout
                                                      /*nb2=nb+1;
                                                      $('#nb_marchands_favoris').html(nb2);
                                                      nouveau='<li><a title="' + marchand['nom'] + '" class="mlien mbloc-2" id="' + mid + '" href="#details-marchand" data-transition="slide"  data-role="button"><div class="logo-container"><img src="' + $('#marchand-details-logo').attr('src') + '"></div></a></li>';
                                                      $('#liste-marchands-favoris').append(nouveau);*/
                                                      contenu_accueil();
                                    
                                                } else {// retrait
                                                      nb2=nb-1;
                                                      $('#liste-marchands-favoris #' +mid).remove();                                                
                                                      $('#nb_marchands_favoris').html(nb2);
                                                }
                                          },
                                    });
                              }
                        });
                  },
                  error:function(erreur) {console.log('ERREUR' + erreur);},
            });
      });
      $(document).on('pagebeforeshow', '#nointernet', function (e, data) {
      previous=data.prevPage.attr('id');
      console.log('previous : ' + previous);
            //contenu_nointernet(data);}
      });
      //$(document).on('pageshow', '#nointernet', function(){contenu_nointernet();});
      
      $(document).on( 'click', '#get_accueil', function(e){contenu_accueil();});
      $(document).on( 'click', '#get_aide', function(e){contenu_aide();});
      $(document).on( 'click', '#get_soutenir', function(e){contenu_soutenir(10);});
      $(document).on( 'click', '#get_notifications',function(){contenu_notifications(10, 'toutes');});
      $(document).on( 'click', '#get_profil', function(e){contenu_profil();});
      $(document).on( 'click', '#contenu_don', function(e){contenu_don();});
      $(document).on( 'click', '.test-internet', function () {
            $.mobile.navigate('#nointernet');
       });
      
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
                        $('.ticket_link').on( "click", function(e){
                              $(this).parents().find('a').removeClass("ticket_actif");
                              videticket();
                              $(this).addClass('ticket_actif');
                              $('.ticket-titre').text($(this).text());
                        });
                        
                        $('#form_nouvelle_demande' ).trigger('create');
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
            $('#don').prepend('<div class="encours"><i class="fas fa-spinner fa-spin fa-3x"></i></div>');
            // VIRER PREPEND
            
            $.ajax({
                  url: "http://www.facile2soutenir.fr/wp-admin/admin-ajax.php",
                  cache:false,
                  data: {'action':'am_contenu_don', 'cookie' : F2S_cookie},
                  success:function(resultat) {
                        $('.encours').fadeOut();
                        $('#user-don-container').html(resultat);
                        window.dispo = parseFloat(jQuery('.disponible').html().replace(",", "."));
                  },
                  error:function(erreur) {console.log('ERREUR' + erreur);},
                  complete:function(){
                        $( '#mform-choix-cause-don' ).trigger('create');
                        $( '#choix-cause-input-don' ).textinput({clearBtn: true});
                        $( '#mform-choix-cause-don .ui-input-search' ).append ('<div class="spinner-1" style="display:none;"><i class="fas fa-spinner fa-spin fa-lg"></i></div>');

                        // ************** LISTENER liste des asso
                        $( "#liste-causes-don" ).on( "filterablebeforefilter", function ( e, data ) {
                              var jQueryul = $( this ),
                              jQueryinput = $( data.input ),
                              value = jQueryinput.val(),
                              html = "";
                              jQueryul.html( "" );
                              $( "#btn-don").removeClass('btn-don-actif');
                              $( "#choix-cause-id-don").val("");
                              if (!value) $('#cause-erreur-don').hide();
                              if ( value && value.length >= 2 ) {
                                    $('#mform-choix-cause-don .spinner-1').show();
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
                                          $('#mform-choix-cause-don .spinner-1').hide();
                                    });
                              }
                        });
                        
                        // ************** LISTENER click choix asso
                        $(document).on( "click", "#liste-causes-don li", function(){
                              var bloc=jQuery(this).children('.mbloc-cause');
                              var cause_id = bloc.attr('id');
                              var cause_nom=$(this).find('.nom-cause').text();
                              $('#choix-cause-input-don').val(cause_nom);
                              $('#choix-cause-id-don').val(cause_id);
                              $('#liste-causes-don').html( "" );
                              $('#choix-cause-input-don').removeClass("cause-incorrecte");
                              $('#cause-erreur-don').hide().text('Oups...');
                              if (check_montant_don()==true) {
                                    $( "#btn-don").addClass('btn-don-actif');
                              }
                        });
                        
                        
                        function check_montant_don() {
                              don = $( '#don-montant' ).val();
                              console.log('montant : ' + don);
                              
                              
                              if (!$.isNumeric(don))  {
                                     $('#don-montant' ).addClass("valeur-incorrecte");
                                     $('#montant-erreur-don').text('Oups... la valeur du don est incorrecte').show();
                                     $('#btn-don').removeClass('btn-don-actif');
                                     console.log('pas numeric');
                                     return false;
                              }
                              if (don==0) {
                                     $('#don-montant' ).addClass("valeur-incorrecte");
                                     $('#montant-erreur-don').text('0 euro de don ? vous etes sur ?').show();
                                     $('#btn-don').removeClass('btn-don-actif');
                                     console.log('nul');
                                     return false;   
                              } 
                              if (don > window.dispo ) {
                                    $('#don-montant' ).addClass("valeur-incorrecte");
                                    $('#montant-erreur-don').text('Oups... c\'est un petit peu trop par rapport au montant disponible').show();
                                    $( "#btn-don").removeClass('btn-don-actif');
                                    console.log('trop');
                                     return false;   
                              }
                              console.log('don ok');
                              $('#don-montant' ).removeClass("valeur-incorrecte");
                              $('#montant-erreur-don').hide().text('Oups...');
                              return true;
                        }
                        

                        
                        $( "#choix-cause-input-don" ).blur(function() {
                              if ($( "#choix-cause-id-don").val()>0) {
                                    //console.log('cause OK');
                                    $(this).removeClass("cause-incorrecte");
                                    $('#cause-erreur-don').hide().text('Oups...');
                                    
                                    if (!$('#don-montant').hasClass("valeur-incorrecte")) {
                                          console.log('et le montant est ok ');
                                          $( "#btn-don").addClass('btn-don-actif');
                                    } else {
                                          console.log('mais le montant est pas ok ');
                                    }
                                    
                              } else {
                                    $(this).addClass("cause-incorrecte");
                                    $('#cause-erreur-don').text('Oups... je ne trouve pas cette cause').show();
                                    $( "#btn-don").removeClass('btn-don-actif');
                                    
                              }
                        });
                        
                        $( "#don-montant" ).blur(function() {
                              console.log('dispo : ' + window.dispo);
                              if (check_montant_don()==true && $( "#choix-cause-id-don").val()>0 ) $( "#btn-don").addClass('btn-don-actif');
                              //var dispo = parseFloat(jQuery('.disponible').html().replace(",", "."));
                              
                              /*if (!jQuery.isNumeric(jQuery(this).val()) || jQuery(this).val()==0) {
                                     jQuery(this).addClass("valeur-incorrecte");
                                     jQuery('#montant-erreur-don').text('Oups... la valeur du don est incorrecte').show();
                                     jQuery( "#btn-don").removeClass('btn-don-actif');
                              } else {
                                    if (jQuery(this).val() > window.dispo ) {
                                          jQuery(this).addClass("valeur-incorrecte");
                                          jQuery('#montant-erreur-don').text('Oups... c\'est un petit peu trop par rapport au montant disponible').show();
                                          jQuery( "#btn-don").removeClass('btn-don-actif');
                                    } else  {
                                          jQuery(this).removeClass("valeur-incorrecte");
                                          jQuery('#montant-erreur-don').hide().text('Oups...');
                                          if (jQuery( "#choix-cause-id-don").val()>0 && jQuery(this).val() >0) {
                                                jQuery( "#btn-don").addClass('btn-don-actif');
                                          }
                                    }
                              }*/

                        });
                        
                       $(document).on('click', '.btn-don-actif', function() {    
                              //var data = jQuery("#mform-don").serialize();
                              //console.log(data);
                              if ( !$("#don-montant").hasClass("valeur-incorrecte")) {
                                    var montant=$('#don-montant').val();
                                    var effectues = $('#don .effectues').html();
                                    $.ajax({
                                          type: 'POST', 
                                          url: 'https://www.facile2soutenir.fr/wp-admin/admin-ajax.php',
                                          dataType: 'json',
                                          cache:false,
                                          data: {
                                                action : 'am_faire_un_don',
                                                montant : montant,
                                                user_id : $('#choix-cause-user-don').val(),
                                                cause_id : $('#choix-cause-id-don').val(),
                                                //formData : data // Convert a form to a JSON string representation
                                          },            
                                          complete: function() { // This callback function will trigger on data sent/received complete
                                                //console.log('complete');
                                          },
                                          success: function (resultat) {
                                                // affichage remerciements
                                                $('.remerciements-message').html(resultat['message']);
                                                $('.remerciements-don').show('slow');
                                                var targetOffset = jQuery(".remerciements-don").offset().top;
                                                $('html, body').animate({ scrollTop: targetOffset }, 1000);
                                    
                                                // Maj des pages de l'appli
                                                $('.disponible').html(resultat['disponible']); // maj des valeurs affichées  DISPONIBLE
                                                $('.effectues').html(parseFloat(montant) + parseFloat(effectues)); // maj des valeurs affichées DONS EFFECTUES
                                                window.dispo=resultat['disponible'];
                                                contenu_soutenir(10); // ajoute ligne sur la page soutenir
                                                
                                                //reset du formulaire
                                                $('#remerciements-logo').attr('src', resultat['logo']);
                                                $('#don-montant').val('');
                                                $('#choix-cause-input-don').val('');
                                                $('#liste-causes-don').html('');
                                                $('#btn-don').removeClass('btn-don-actif');
                                                $('#choix-cause-id-don').val('');
                                          },
                                          error: function (request,error) { 
                                          }
                                    });
                              }
                              else { alert ('le montant du don est incorrect');}
                        });
                        
                        
                  }
            });
      }
      function contenu_planter() {
            //jQuery('#combier-planter').slider().textinput();
            $('#planter popup-mid').remove();
            
            $.ajax({
                  url: "http://www.facile2soutenir.fr/wp-admin/admin-ajax.php",
                  cache:false,
                  data: {'action':'am_contenu_planter', 'cookie' : F2S_cookie},
                  success:function(resultat) {
                        $('.encours').fadeOut();
                        $('#planter-container').html(resultat);
                        //window.dispo = parseFloat(jQuery('.disponible').html().replace(",", "."));
                  },
                  error:function(erreur) {console.log('ERREUR' + erreur);},
                  complete:function(){
                        
                        
                        if (parseFloat($('.disponible').html())<1) {
                              //var solde_insuffisant_planter = "<div class='popup-mid' style='display:none;'><p>Malheureusement, nous ne pouvez pas encore planter d'arbre.</p><p>Vous devez disposer d'au moins 1 euro disponible pour planter un arbre.</p></div>";                            
                              //$('#planter .popup-mid').fadeIn();
                              var solde_insuffisant_planter = "<div id='popup-solde-insuffisant-planter' data-role='popup' data-transition='slidedown' ><p>Malheureusement, nous ne pouvez pas encore planter d'arbre.</p><p>Vous devez disposer d'au moins 1 euro disponible pour planter un arbre.</p></div>";                            
                              $('#planter .ui-content').prepend(solde_insuffisant_planter);
                              $('#popup-solde-insuffisant-planter' ).popup({
                                    afterclose: function( event, ui ) {
                                          //$.mobile.navigate('#soutenir');
                                          $( ":mobile-pagecontainer" ).pagecontainer( "change", "#soutenir", { transition: "slide", reverse:true } );
                                    }
                                  });
                              $( '#myPopup' ).popup('open');     
                        }

                        $( "#apres-plantation" ).popup();
                        $( "#combier-planter" ).slider();
                        
                        /*$( "<input type='number' data-type='range' min='0' max='100' step='1' value='17'>" )
                                .appendTo( "#dynamic-slider-form" )
                                .slider()
                                .textinput()*/
                        
                        
                        // ************** CLIC PAYS
                        
                        $(".pays-container-actif .choix-pays").on( "click", function(){
                              var pays = jQuery(this).attr('id');
                        
                              $(this).addClass('choix-pays-actif');                                          // ajout de la classe actif sur le pays selectionné
                              $(this).siblings().each(function(){                                            // retrait de la classe active sur les autres pays
                                    $(this).removeClass('choix-pays-actif') ;
                              });
                              //jQuery(".choix-arbre-actif").removeClass('background-madagascar').removeClass('background-indonesie').removeClass('background-mali') ;
                              //jQuery(".choix-arbre-actif").addClass('background-' + pays);                        // Mise à jour du background sur l'arbre actif
                              $(".formearbre-container").addClass('formearbre-container-actif').removeClass('formearbre-container-inactif'); // activation etape 2
                              $(".arbre-container-a-planter").removeClass('bg-madagascar').removeClass('bg-indonesie');
                              $(".arbre-container-a-planter").addClass('bg-' + pays);
                        });
                        
                        // **************  CLIC FORME
                        $(document).on( "click", ".formearbre-container-actif .choix-arbre", function(){ 
                  
                              var forme = $(this).attr('id');
                              $(this).addClass('choix-arbre-actif');                                         // ajout de la classe actif
                              var pays = $(".choix-pays-actif").attr('id');
                              //if (typeof pays !=='undefined') {jQuery(this).addClass('background-' + pays);}      // chargement du background si pays est actif
                              var couleur = $('.couleur-active').attr('id');                                 // chargement de la couleur si couleur active
                              if (typeof couleur !== "undefined") {
                                    source = "https://www.facile2soutenir.fr/wp-content/uploads/2018/01/" + forme + '-' + couleur + '.png' ;
                                    $(this).children('img').attr('src', source);
                                    $(".arbre-a-planter").attr('src', source);                               // changement de la source de l'image sur l'arbre à planter  
                              }
                              
                              $(this).siblings().each(function(){
                                    $(this).removeClass('choix-arbre-actif') ;                               // retrait de la classe active sur les autres
                                    //jQuery(this).removeClass('background-madagascar').removeClass('background-indonesie').removeClass('background-mali') ;  // retrait des backgrounds sur les autre
                                    var forme=$(this).attr('id');
                                    var source = "https://www.facile2soutenir.fr/wp-content/uploads/2018/01/" + forme + '-generique.png' ;
                                    $(this).children('img').attr('src', source);                             // on remet les sources génériques sur les autres
                              });
                              
                              $(".color-picker").addClass('color-picker-actif');                             // activation etape 3
                              $(".color-picker").removeClass('color-picker-inactif'); 
                        });
                        
                  // **************  CLIC COULEUR
                        $(document).on( "click", ".color-picker-actif .choix-couleur li", function(){
                              jQuery(this).addClass('couleur-active');                                            // ajout de la classe actif
                              jQuery(this).siblings().each(function(){jQuery(this).removeClass('couleur-active') ;});   // retrait de la classe actif sur les autres
                              var couleur = jQuery(this).attr('id');
                              var forme = jQuery(".choix-arbre-actif").attr('id');
                              var source = "https://www.facile2soutenir.fr/wp-content/uploads/2018/01/" + forme + '-' + couleur + '.png' ;
                              jQuery(".choix-arbre-actif > img").attr('src', source);                             // changement de la source de l'image sur l'arbre actif
                              jQuery(".arbre-a-planter").attr('src', source);                                     // changement de la source de l'image sur l'arbre à planter
                              jQuery(".btn-planter").addClass('btn-planter-actif');                             // activation etape 3
                              jQuery(".btn-planter").removeClass('btn-planter-inactif'); 
                              jQuery(".arbre-container-a-planter").removeClass('grey-background');
                        });
                        
                  // ************** CLIC PLANTER
                        $(document).on( "click", ".btn-planter-actif", function(){
                              var container=$(this).closest(".arbre-container");
                  
                  
                              container.addClass("arbre-actif");                 
                              //container.addClass("background-" + lieu); 
                              
                              // recup lieu-forme-couleur
                              var lieu = $(".choix-pays-actif").attr('id');
                              if (lieu == 'indonesie') lieu_display='Indon&#233;sie';
                              if (lieu == 'mali') lieu_display='Mali';
                              if (lieu == 'madagascar') lieu_display='Madagascar';
                              var couleur = $('.couleur-active').attr('id');
                              var forme = $(".choix-arbre-actif").attr('id');
                  
                              container.find(".arbre-lieu").html(lieu_display);
                              $(this).fadeOut(500, function() {
                                    $(".arbre-a-planter").slideDown( 2000 , function() {
                                          $(".arbre-legende").show();
                                          setTimeout(  function() {    
                                                $(".arbre-date").animate({width: '100%'}, 1500, function() {});
                                          }, 1000);
                                          setTimeout(  function() {  
                                                $(".arbre-lieu").animate({width: '100%'}, 1500, function() {});
                                          }, 2000);
                                          setTimeout(  function() { 
                                                //jQuery(".arbre-remerciement").effect( 'puff', 3500);
                                                //jQuery.mobile.changePage( "#partagez", { role: "dialog" } );
                                                $( "#apres-plantation" ).popup( "open");
                                          }, 3500);
                                    }).removeClass('arbre-a-planter').addClass('arbre-plante') ;  
                              });
                              
                              $.ajax({
                                    url: "http://www.facile2soutenir.fr/wp-admin/admin-ajax.php",
                                    dataType: 'json',
                                    cache: false,
                                    data: {
                                            "action":"planter_arbre",
                                            "lieu": lieu,
                                            "couleur": couleur,
                                            "forme": forme,
                                    },
                                    success:function(resultat) {
                                          
                                          $(".message_nb_arbres").html(resultat['message']);
                                          
                                          // MAJ des pages de l'appli
                                          $(".nb_arbres_plantes").html(resultat['nb_arbres_plantes']); // maj des valeurs affichees NB ARBRES PLANTES
                                          $(".disponible").html(resultat['disponible']); // maj des valeurs affichees  DISPONIBLE
                                          contenu_soutenir(10); // ajoute ligne sur la page soutenir
                                          
                                          //maj_plantation(resultat['id'], forme, couleur, resultat['date'], lieu);
                                          //jQuery("#arbres-restants").html(Math.floor(parseFloat(resultat['disponible'])));
                                          
                                    },
                                    error:function(erreur) {console.log('ERREUR : '+ erreur);}
                              });
                  
                        });
                        
                        
                        $(document).on( "click", ".refus-partage", function(){
                              $( "#apres-plantation" ).popup( "close");
                        });

                  } // fin complete
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
function login(){
      $('#connexion-status .erreur').remove();
      var username = $("#username").val();
      var password = $("#password").val();
      var dataString = "username="+username+"&password="+password+"&insecure=cool"; // insecure=cool pour connection over http
      var url;
      if ( username== "") {erreur_login ('usernamevide'); return false; }
      if ( password== "") {erreur_login ('passwordvide'); return false; }
      $('#connexion-status').prepend('<div class="encours"><i class="fas fa-spinner fa-spin fa-3x"></i></div>');
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
                  $('#connexion-status .encours').remove();
            }
      });
}
function mdp_perdu() {
      $('#connexion-status').html('');
      $('#connexion-status').prepend('<div class="mdp-redirection" style="display:none;"><p class="msg-redirection">Vous allez etre redirig&#233; vers notre site web ou vous pourrez tr&#232;s facilement g&#233;n&#233;rer un nouveau mot de passe.</p><p class="count" id="mdp-count">5</p></div>');
      $('#connexion-status .mdp-redirection').fadeIn();
      
      var i = document.getElementById('mdp-count');
      var downloadTimer = setInterval(function(){
            i.innerHTML = parseInt(i.innerHTML)-1;
            if(parseInt(i.innerHTML) <= 0) {
                  clearInterval(downloadTimer);
                  $('#connexion-status .mdp-redirection').fadeOut(function(){ $('#connexion-status .mdp-redirection').remove();});
                  //window.location.href = "http://www.facile2soutenir.fr/accueil/reinitialisation/";
            }
      },1000);
      
}
function inscription() {

      $('#connexion-status').html('');
      $('#connexion-status').prepend('<div class="inscription-redirection" style="display:none;"><p class="msg-redirection">Vous allez etre redirig&#233; vers notre site web ou vous pourrez tr&#232;s facilement cr&#233;er un compte.</p><p class="count" id="inscription-count">5</p></div>');
      $('#connexion-status .inscription-redirection').fadeIn();
      
      var i = document.getElementById('inscription-count');
      var downloadTimer = setInterval(function(){
            i.innerHTML = parseInt(i.innerHTML)-1;
            if(parseInt(i.innerHTML) <= 0) {
                  clearInterval(downloadTimer);
                  $('#connexion-status .inscription-redirection').fadeOut(function(){ $('#connexion-status .inscription-redirection').remove();});
                  //window.location.href = "http://www.facile2soutenir.fr/accueil/inscription/"; // orig = appmobile ?
            }
      },1000);
      
}
function erreur_login (erreur){
      if (erreur=='mdp') {
            $('#connexion-status').prepend('<div class="erreur"><p>Oups...<br>Votre email ou votre mot de passe semble incorrect</p><p><i class="fas fa-frown"></p></div>');
      }
      if (erreur=='usernamevide') {
            $('#connexion-status').prepend('<div class="erreur"><p>Ca ne serait pas plus sympa si nous faisions connaissance ?</p></div>');
      }
      if (erreur=='passwordvide') {
            $('#connexion-status').prepend('<div class="erreur"><p>Je suis navr&#233;, mais je risque de me faire gronder si je vous laisse entrer sans mot de passe...</p></div>');
      }
}
function connexion_facebook() {
      alert('connexion_facebook');
      openFB.login(
            function(response) {
                  alert('response');
                  if(response.status === 'connected') {
                        var fb_token = response.authResponse.accessToken;
                        console.log('Facebook login succeeded, got access token: ' + fb_token);
                        alert(fb_token);
                        // genere le cookie en AJAX
                        
                        $.ajax({
                              url: "http://www.facile2soutenir.fr/wp-admin/admin-ajax.php",
                              cache:false,
                              dataType: "json",
                              data: {
                                    'action':'am_connexion_facebook',
                                    'fb_token' : fb_token,
                                    //'fields' : 'id,name,email,picture,link,locale,first_name,last_name'
                              },
                              success:function(resultat) {

                                    if('error' in resultat) {
                                    //if(jQuery.inArray("error", resultat) !== -1) {
                                          
                                          if (resultat['error']=='unregistered') {
                                                //$('#landing-status').prepend('<div class="connexion-info"><p>Les informations transmises par Facebook ne nous ont pas permis de vous retrouver... </p><p>Peut-etre n\'etes vous pas encoer inscrit(e) ? Dans ce cas cela vous prendra quelques secondes en cliquant ici : <a href="bouton bouton-oragne">inscription</a></p></div>');
                                                $('#landing-status').prepend("<div class='connexion-info'><p>A priori vous n'etes pas encore inscrit sur le site. Nous vous redirigeons vers la bonne page <i class='fas fa-smile fa-lg'></i></p></div><p class='count' id='fb-inscription-count'>5</p>");
                                                      var i = document.getElementById('fb-inscription-count');
                                                      var downloadTimer = setInterval(function(){
                                                            i.innerHTML = parseInt(i.innerHTML)-1;
                                                            if(parseInt(i.innerHTML) <= 0) {
                                                                  clearInterval(downloadTimer);
                                                                  //$('#landing-status .connexion-info').fadeOut(function(){ $('#landing-status .connexion-info').remove();});
                                                                  //window.location.href = "http://www.facile2soutenir.fr/accueil/inscription/"; // orig = appmobile ?
                                                            }
                                                      },1000);
                                          }
                                          if (resultat['error']=='email') {
                                                $('#landing-status').prepend('<div class="erreur"><p>Oups...<br>Facebook ne nous a pas transmis votre adresse email : nous ne pouvons donc pas vous identifier.</p><p></p></div>');
                                          }
                                          if (resultat['error']=='token') {
                                                $('#landing-status').prepend('<div class="erreur"><p>Oups... Une erreur s\'est produite.</p><p>Cela vous ennuie-t-il de r&#233;essayer ?</p>')
                                          }
                                          
                                    } else {
                                          var cookie=resultat['cookie'];
                                          var cookie_name=resultat['cookie_name'];
                                          $.cookie(cookie_name, cookie, { expires: 365*5, path: '/' });
                                          
                                          window.sessionStorage.user_id = resultat['user']['id'];
                                          window.sessionStorage.user_name = resultat['user']['username'];
                                          window.sessionStorage.user_email = resultat['user']['email'];
                                          window.sessionStorage.user_avatar = resultat['user']['avatar'];
                                          $.mobile.navigate('#accueil');
                                    }
                                    
                              },
                              complete : function() {
      
                              }
                              
                        });
                        
                        getInfo();
                  } else {
                        alert('Facebook login failed: ' + response.error);
                  }
            },
            {scope: 'email'}
      );
}
function getInfo() {
      openFB.api({
            path: '/me',
            params: {
                  fields : 'id,name,email,picture,link,locale,first_name,last_name'
            },
            success: function(data) {
                  //console.log(JSON.stringify(data));
                  window.sessionStorage.user_name = data.name;
                  window.sessionStorage.user_email = data.email;
                  window.sessionStorage.user_avatar = data.picture.data.url;
            },
            error: errorHandler});
}
function share() {
      openFB.api({
            method: 'POST',
            path: '/me/feed',
            params: {
                message: document.getElementById('Message').value || 'Testing Facebook APIs'
            },
            success: function() {
                alert('the item was posted on Facebook');
            },
            error: errorHandler});
  }
function readPermissions() {
      openFB.api({
            method: 'GET',
            path: '/me/permissions',
            success: function(result) {
                  alert(JSON.stringify(result.data));
            },
            error: errorHandler
      });
}
function revoke() {
      openFB.revokePermissions(
            function() {
                  alert('Permissions revoked');
            },
            errorHandler);
}
function logout() {
      openFB.logout(
            function() {
                  alert('Logout successful');
            },
            errorHandler);
}
function errorHandler(error) {
      alert(error.message);
}      