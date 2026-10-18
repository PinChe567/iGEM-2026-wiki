/* Original simulation movies: attach the file only when a reader asks to play. */
document.querySelectorAll('[data-model-video]').forEach((figure) => {
  const video=figure.querySelector('video');
  if (!video) return; // Official iGEM iframes provide their own playback controls.
  const button=figure.querySelector('button');
  const status=figure.querySelector('[data-model-video-status]');
  let loading=false;
  async function play(){
    if(loading)return;
    loading=true;
    if(!video.hasAttribute('src')){video.src=video.dataset.src;video.load();}
    try{await video.play();button.hidden=true;status.textContent='Use the native video controls to pause, seek or expand.';}
    catch{button.hidden=false;status.textContent='Select Play to start, or open the original MP4 below.';}
    finally{loading=false;}
  }
  button.addEventListener('click',play);
  video.addEventListener('play',()=>{if(!video.hasAttribute('src'))play();else button.hidden=true;});
  video.addEventListener('error',()=>{button.hidden=false;status.textContent='This browser could not play the file. The original MP4 and static figures remain available.';});
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{
    if(!entries[0].isIntersecting&&!video.paused)video.pause();
  },{threshold:.05}).observe(video);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();});
});
