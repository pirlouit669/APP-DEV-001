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
/*
$(document).on('mobileinit', function () {
      console.log('mob init');
      $.mobile.ignoreContentEnabled = true;
      $.mobile.keepNative = "select,input";
      $.mobile.crossDomainPages  = true;
});*/

$(document).ready(function(){
      console.log('ready');
      $.mobile.ignoreContentEnabled = true;
      //$.mobile.keepNative = "select,input";
      $.mobile.crossDomainPages  = true;
      
      $(document).on( "click", ".btn-connexion", function(e){
            e.preventDefault();
            var logged_in=false;
            $.each($.cookie(), function( index, value ){
                  console.log('A: ' + index + ' B :' + value);
                  if (index.indexOf('wordpress_logged_in_') >= 0) {
                        url = 'http://preprod.facile2soutenir.fr/mobile/?cookie_name=' + encodeURIComponent(index) + '&cookie=' + encodeURIComponent(value);
                        console.log('c est parti mon kiki ' + url);
                        logged_in = true;
                  }
            });
            if (logged_in == false) $('body').pagecontainer('change', '#connexion');
      }); 
});

$(document).on('pageinit', '#news',function(){
      console.log('pageinit news');
      fetch_posts('recentes');

	  
	  $(document).on( "click", "#btn-recentes", function(){
            $(this).addClass('bouton-bleu2').removeClass('bouton-inverse');
            $('#btn-toutes').addClass('bouton-inverse').removeClass('bouton-bleu2');
            $('#btn-principales').addClass('bouton-inverse').removeClass('bouton-bleu2');
			fetch_posts('recentes');
      });
	  
	  
	  $(document).on( "click", "#btn-principales", function(){
            $(this).addClass('bouton-bleu2').removeClass('bouton-inverse');
            $('#btn-toutes').addClass('bouton-inverse').removeClass('bouton-bleu2');
            $('#btn-recentes').addClass('bouton-inverse').removeClass('bouton-bleu2');
			fetch_posts('principales');
      });
	  
	  $(document).on( "click", "#btn-toutes", function(){
            $(this).addClass('bouton-bleu2').removeClass('bouton-inverse');
            $('#btn-principales').addClass('bouton-inverse').removeClass('bouton-bleu2');
            $('#btn-recentes').addClass('bouton-inverse').removeClass('bouton-bleu2');
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
	console.log(post_id);
	linkurl = "https://preprod.facile2soutenir.fr/json/get_post/?id=" + post_id;
		$.ajax({
            type: "POST",
            url:linkurl,
            crossDomain: true,
            cache: false,
            success: function(data){
                  console.log(linkurl);
                  $('.encours').hide();
                  var post = data['post'];
                  var post_id = post['id'];
                  var titre = post['title'];
                  var date = post['date'];
                  $.each(post['attachments'], function() {
                          img = this['images']['full']['url'];
                  });
                  var content = post['content'];
                  
                  $('#news-detail-title').html(titre);
                  $('#news-detail-date').html(date);
                  $('#news-details-contenu').html(content);
                  $('.news-detail-main-top').css('background-image', 'linear-gradient( rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.75) ), url('+ img +')');		
            },
      });
});


function clean_newsdetail() {
      $('#news-detail-title').html('');
      $('#news-detail-date').html('');
      $('#news-details-contenu').html('<div class="encours">En cours de chargement...</div>');
      $('.news-detail-main-top').css('background-image', 'linear-gradient( rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.75) )');  
}

function fetch_posts(requete){
      var dataString = "";
      $('#news-container').html('<div class="encours">En cours de chargement...</div>');
      linkurl = "https://preprod.facile2soutenir.fr/json/get_posts/";
      //linkurl = "https://preprod.facile2soutenir.fr/json/get_recent_posts/";

      if (requete=='recentes') {
            linkurl += '?count=5'; //&status=publish&date_format=%27d/Y%27",  
      } 
      if (requete=='principales') {
            linkurl += '?count=2';
      } 
      if (requete=='toutes') {
            linkurl += '?count=10';
      }
      console.log(linkurl);
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
                        $.each(this['attachments'], function() {
                              img = this['images']['full']['url'];
                        });	
                        $('#news-container').append('<div class="news""><a href="#news-detail" id="'+post_id+'" class="lien-news-detail lien-full" data-transition="slide"></a><div class="voir-news"><i class="fas fa-caret-right fa-lg"></i></div><div class="news-image-container"><img src="'+img+'"></div><div class="news-contenu"><div class="news-title">'+titre+'</div><div class="news-date">'+date+'</div></div></div>');
                  });
            }
      });   
}

function login(){
      var username = $("#username").val();
      var password = $("#password").val();
      var dataString = "username="+username+"&password="+password+"&insecure=cool";    //JSON API Auth plugins allow by default only connections over https. In order to turn off this setting, you should send an extra parameter in the request:insecure=cool
      var url;
      $.ajax({
            type: "POST",
            url:"https://preprod.facile2soutenir.fr/json/user/generate_auth_cookie/?",
            data: dataString,
            crossDomain: true,
            cache: false,
            success: function(data){
                  var cookie=data.cookie;
                  var cookie_name=data.cookie_name;
                  var user_id=data.user.id;
                  url = 'http://preprod.facile2soutenir.fr/mobile/?user_id=' + user_id + '&cookie_name=' + encodeURIComponent(cookie_name) + '&cookie=' + encodeURIComponent(cookie);
                  $.cookie(cookie_name, cookie, { expires: 365*5, path: '/' });
                  $('body').pagecontainer('change', '#news');
                  //$('#go-shopping').attr('href',url);
                  //document.location.href=url;                  
            },
            complete: function () {
                  console.log(url);
            }
      });
}


/*
function setCookie(name,value,days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}*/
/*
function open_browser(link){
    window.open(link, '_blank', 'location=yes');
}
*///$('body').pagecontainer('change', '');