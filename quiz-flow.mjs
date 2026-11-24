export function createQuizAdvance({advance,enabled=true,delay=3500,schedule=setTimeout,cancel=clearTimeout}){
 let selected=false,disposed=false,timer=null;
 const stop=()=>{if(timer!==null){cancel(timer);timer=null;}};
 const next=()=>{if(disposed)return;stop();disposed=true;advance();};
 const arm=()=>{stop();if(enabled&&selected&&!disposed)timer=schedule(()=>{if(!disposed&&enabled&&selected)next();},delay);};
 return {answer(){if(disposed||selected)return false;selected=true;arm();return true;},toggle(){if(disposed)return enabled;enabled=!enabled;arm();return enabled;},next,dispose(){stop();disposed=true;},get enabled(){return enabled;}};
}
