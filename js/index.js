/*var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        console.log('Received Device Ready Event');
        //console.log('calling setup push');
        //app.setupPush();

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

*/

$(document).ready(function() {
    // are we running in native app or in a browser?
    window.isphone = false;
    if(document.URL.indexOf("http://") === -1 
        && document.URL.indexOf("https://") === -1) {
        window.isphone = true;
    }
    if( window.isphone ) {
        document.addEventListener("deviceready", onDeviceReady, false);
    } else {
        onDeviceReady();
    }
});

function onDeviceReady() {
      console.log('ready');
      $.mobile.ignoreContentEnabled = true;
      //$.mobile.keepNative = "select,input";
      $.mobile.crossDomainPages  = true;
      
      /*document.addEventListener("online", onOnline, false);
      document.addEventListener("offline", onOffline , false);*/

      $(document).on( "click", ".btn-connexion", function(e){
            e.preventDefault();
            var logged_in=false;
            $.each($.cookie(), function( index, value ){
                  if (index.indexOf('wordpress_logged_in_') >= 0) {
                        url = 'http://preprod.facile2soutenir.fr/mobile/?cookie_name=' + encodeURIComponent(index) + '&cookie=' + encodeURIComponent(value);
                        logged_in = true;
                        document.location.href=url;
                        //window.open(url, '_blank', 'location=yes');
                  }
            });
            if (logged_in == false) $('body').pagecontainer('change', '#connexion');
      }); 

      
      $(document).on('pageinit', '#news',function(){
            fetch_posts('recentes');
              
            $(document).on( "click", "#btn-recentes", function(){
                  $(this).addClass('bouton-bleu').removeClass('bouton-inverse');
                  $('#btn-toutes').addClass('bouton-inverse').removeClass('bouton-bleu');
                  $('#btn-une').addClass('bouton-inverse').removeClass('bouton-bleu');
                        fetch_posts('recentes');
            });
              
            $(document).on( "click", "#btn-une", function(){
                  $(this).addClass('bouton-bleu').removeClass('bouton-inverse');
                  $('#btn-toutes').addClass('bouton-inverse').removeClass('bouton-bleu');
                  $('#btn-recentes').addClass('bouton-inverse').removeClass('bouton-bleu');
                        fetch_posts('une');
            });
              
            $(document).on( "click", "#btn-toutes", function(){
                  $(this).addClass('bouton-bleu').removeClass('bouton-inverse');
                  $('#btn-une').addClass('bouton-inverse').removeClass('bouton-bleu');
                  $('#btn-recentes').addClass('bouton-inverse').removeClass('bouton-bleu');
                        fetch_posts('toutes');
            });
              
              
            $(document).on( "click", ".lien-news-detail", function(){
                  activenews = $(this).parent();
                  activenews.addClass('news-active');
                  $('.news').not(activenews).removeClass('news-active');
            });
              
      
              
      });
      
      $(document).on('pagebeforeshow', '#news-detail', function(){clean_newsdetail();});
      
      $(document).on('pageshow', '#news-detail',function(){
            var post_id = $( ".news-active .lien-news-detail" ).attr('id');
            linkurl = "https://preprod.facile2soutenir.fr/json/get_post/?id=" + post_id;
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
      linkurl = "https://preprod.facile2soutenir.fr/json/get_posts/";

      if (requete=='recentes') {
            linkurl += '?count=5'; //&status=publish&date_format=%27d/Y%27",  
      } 
      if (requete=='une') {
            linkurl = "https://preprod.facile2soutenir.fr/json/get_category_posts";
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
            url:"https://preprod.facile2soutenir.fr/json/user/generate_auth_cookie/?",
            data: dataString,
            crossDomain: true,
            cache: false,
            success: function(data){
                  console.log(data);

                  if (data.status=="ok") {
                        var cookie=data.cookie;
                        var cookie_name=data.cookie_name;
                        var user_id=data.user.id;
                        url = 'http://preprod.facile2soutenir.fr/mobile/?user_id=' + user_id + '&cookie_name=' + encodeURIComponent(cookie_name) + '&cookie=' + encodeURIComponent(cookie);
                        $.cookie(cookie_name, cookie, { expires: 365*5, path: '/' });
                        //$('body').pagecontainer('change', '#news');
                        document.location.href=url;
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
function display_network_state (state){
      $('.network_state').html('<i style="color:#46e446;" class="fas fa-toggle-on fa-2x"></i>'); //toggle-off  //power-off
      $('.network_state').html('<i style="color:#ff1100" class="fas fa-toggle-on fa-flip-horizontal fa-2x"></i>');
}

function onOnline() {
        console.log("got connection");
        alert('got connection');
        var connexion = checkConnection();
        console.log("connexion");
}
function onOffline() {
        console.log("lost connection");
        alert("lost connection");
}

function checkConnection() {
        var networkState = navigator.network.connection.type;
        var states = {};
        states[Connection.UNKNOWN]  = 'Unknown connection';
        states[Connection.ETHERNET] = 'Ethernet connection';
        states[Connection.WIFI]     = 'WiFi connection';
        states[Connection.CELL_2G]  = 'Cell 2G connection';
        states[Connection.CELL_3G]  = 'Cell 3G connection';
        states[Connection.CELL_4G]  = 'Cell 4G connection';
        states[Connection.NONE]     = 'No network connection';
        console.log('Connection : ' + Connection);
        console.log('Connection type: ' + states[networkState]);
        return networkState;
}
*/

