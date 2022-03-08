// $(document).ready(function () {
    /**
 *Global Options. These are supposed to be changed, to match the video
*/
let options = {
    banner_name        : 'Mbogi ya madenge - 15s',  //Change This 
    format             : 'Audio',
    default_click_url  : '',                         //Change This
    click_selectors    : [ '.container-bg' ],
    hover_selectors    : [ '.container-bg' ],
    hover_seconds      : 5,               //number of seconds to hover to track a banner hover event
};



let campaign_id = null, creative_id = null ,site_domain = '' ,click_url = '' ,unique_id = '', tag = null;

// Add Click and Hover tracking events to all selectors that match.

// options.click_selectors.forEach(el => {
//   document.querySelector(el).style.cursor = 'pointer';
//   document.querySelector(el).addEventListener('click', handleClickEvent, false);
// });

options.hover_selectors.forEach(el => {
  document.querySelector(el).addEventListener('mouseover', handleHoverEvent, false);
  document.querySelector(el).addEventListener('mouseout', handleHoverOutEvent, false);
});

//Generate UUID string, to uniquely identify this impression.
unique_id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);return v.toString(16);});

//==========================================================================================================================
// Get Query Params, in case they are not being passed via DSP Iframe testing.

var searchParams = new URLSearchParams(window.location.search);

function hasQueryString(param){
    if(searchParams.has(param)){
      return searchParams.getAll(param)[0]
    } else {
      return null;
    }
}

campaign_id = hasQueryString("campaign_id") || null;
click_url = hasQueryString("click_url") || options.default_click_url;
creative_id = hasQueryString("creative_id") || null;
site_domain = hasQueryString("site_domain") || null;
tag = hasQueryString("tag") || null;
if(tag) options.banner_name = `${options.banner_name} - ${tag}`;


window.addEventListener("message", function(msg) {
    campaign_id = msg.data.campaign_id || null;
    creative_id = msg.data.creative_id || null;
    site_domain = msg.data.site_domain || ((window.location != window.parent.location) ? document.referrer : document.location.href);
    site_domain = decodeURIComponent(site_domain);
    click_url   = msg.data.click_url;
    if(click_url == '' || click_url == null){
      click_url = options.default_click_url;
    }
}, false);

function handleClickEvent(){
      sendBannerEngagementEvent('click');
      window.open(click_url, '_blank');
  }

  let hoverEventStarted = false;
  let hoverTracked = false;
  var sec = options.hover_seconds;
  var timer = null;
  function timerFunction(){
    if(hoverEventStarted){
        sec--;
        console.log(`${sec} secs`)
        if (sec < 1) {
            sendBannerEngagementEvent('hovered_5_seconds');
            hoverTracked = true;
            resetTimer();
        }
      } 
  }

  function resetTimer(){
    clearInterval(timer);
    sec = options.hover_seconds;
  }

  function handleHoverEvent(){
    if(!hoverTracked){
      if(!hoverEventStarted){
        hoverEventStarted = true;
        timer = setInterval(timerFunction, 1000);
      }
    }
  }

  function handleHoverOutEvent(){
    hoverEventStarted = false;
    resetTimer();
  }


// ====================================================
    let audioElement = document.createElement('audio');
    audioElement.setAttribute('src',$('.active-song').attr('data-src'));
    $("#muteBtn").attr("src","mute_2.svg");
    $('#playBtn').attr("src","pause-button.svg");
    audioElement.autoplay=true;
    audioElement.muted = true;
    audioElement.loop = false;
    $('.player').addClass('play');
    $('#ad-title').addClass('ad-title-play');

    let userHasToggledSound = false;

    var tl = new TimelineMax();
    tl.to('.player__albumImg', 3, {
        rotation: '360deg',
        repeat: -1,
        ease: Power0.easeNone
    }, '-=0.2');
    tl.play();

    $('.player__play').click(function () {

        if ($('.player').hasClass('play')) {
            $('.player').removeClass('play');
            $('#playBtn').attr("src","play-button.svg");
            $('.music-notes').addClass('music-notes-pause');
            audioElement.pause();
            sendBannerEngagementEvent('audio-paused');
            TweenMax.to('.player__albumImg', 0.2, {
                scale: 1,
                ease: Power0.easeNone
            })
            tl.pause();
        } else {
            $('.player').addClass('play');
            $('#playBtn').attr("src","pause-button.svg");
            $('.music-notes').removeClass('music-notes-pause');
            audioElement.play();
            sendBannerEngagementEvent('audio-resume');
            TweenMax.to('.player__albumImg', 0.2, {
                scale: 1.1,
                ease: Power0.easeNone
            })
            tl.resume();
        }

    });


    let quartileTimestamps = []; 
    let quartiles = []; 
    let duration = null;
    let audioAdComplete = false;
    audioElement.addEventListener('loadedmetadata', onAudioMetadataLoaded);

    function onAudioMetadataLoaded(){
        console.log(audioElement.duration)
        console.log('audio metadata loaded');
        duration = audioElement.duration;
        quartileTimestamps = [ duration / 4, duration / 2, duration*0.75, duration ];
        quartiles = [ 'adfirstquartile', 'admidpoint', 'adthirdquartile', 'adcomplete' ];

        audioElement.addEventListener("timeupdate", timeUpdate);
        audioElement.play();
    }
    

    var playhead = document.getElementById("playhead");
    

    function timeUpdate(){

        var currentTime = audioElement.currentTime;
        var percentage = (currentTime / duration) * 100;
        console.log(`${currentTime} / ${duration}`);
        playhead.style.width = percentage + '%';

        if(!audioAdComplete) {
            if(currentTime >= quartileTimestamps[0] || currentTime == quartileTimestamps[0]){
                sendBannerEngagementEvent(quartiles[0]);
                quartileTimestamps.splice(0, 1);
                quartiles.splice(0, 1);
            }
        }
        
    }

    audioElement.addEventListener('ended', onAudioEnded);
    function onAudioEnded(){
        if(!audioAdComplete){
            audioAdComplete = true;
          }
          audioElement.play();
    }

    function updateInfo() {
        $('.player__author').text($('.active-song').attr('data-author'));
        $('.player__song').text($('.active-song').attr('data-song'));
    }
    updateInfo();

    $('.player__next').click(function () {

        if ($('.player .player__albumImg.active-song').is(':last-child')) {
            $('.player').addClass('play');
            $('.music-notes').removeClass('music-notes-pause');
            $('#playBtn').attr("src","pause-button.svg");
            $('.player__albumImg.active-song').removeClass('active-song');
            $('.player .player__albumImg:first-child').addClass('active-song');
             TweenMax.to('.player__albumImg', 0.2, {
                scale: 1.1,
                ease: Power0.easeNone
            })
            tl.resume();

            audioElement.addEventListener("timeupdate", timeUpdate);
        } else {
            $('.player__albumImg.active-song').removeClass('active-song').next().addClass('active-song');
            audioElement.addEventListener("timeupdate", timeUpdate);
        }
        updateInfo();
        audioElement.setAttribute('src', $('.active-song').attr('data-src'));
        audioElement.play();
        sendBannerEngagementEvent('audio-replay');
    });


        $('.player__prev').click(function () {
            if(!userHasToggledSound){
                userHasToggledSound = true;
                audioElement.currentTime = 0;
              }

            if (audioElement.muted == true) {
                $('#unmutetext').addClass('unmute-text-hidden');
                $("#muteBtn").attr("src","speaker.svg");
                audioElement.muted = false;
                sendBannerEngagementEvent('audio-unmuted');
            } else {
                $('#unmutetext').removeClass('unmute-text-hidden');
                $("#muteBtn").attr("src", "mute_2.svg");
                audioElement.muted = true;
                sendBannerEngagementEvent('audio-muted');
            }
        });

         $('.unmute-text').click(function () {
        if (audioElement.muted == true) {
            $('#unmutetext').addClass('unmute-text-hidden');
            $("#muteBtn").attr("src","speaker.svg");
            audioElement.muted = false;
        } else {
            $('#unmutetext').removeClass('unmute-text-hidden');
            $("#muteBtn").attr("src", "mute_2.svg");
            audioElement.muted = true;
        }
    });


    //============================================
  function sendBannerEngagementEvent(event){
    console.log('Creating engagement event ' + event);

    let data = {
        "banner_id": creative_id,
        "banner_name": options.banner_name,
        "format": options.format,
        "unique_id": unique_id,
        "event": event,
        "site_domain": site_domain
    };

    console.log(data);

    (async () => {
    const rawResponse = await fetch('https://dxp.mediapal.net/api/banner_engagements/create', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    const content = await rawResponse.json();
    console.log(content);
  })();
  }


// });
