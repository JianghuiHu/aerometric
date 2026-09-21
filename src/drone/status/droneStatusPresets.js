export const DRONE_STATUS_PRESETS = Object.freeze({
  online: Object.freeze({ id:'online', light:{color:'#3ba9ff',intensity:2,breathing:false}, statusField:{visible:true,color:'#3ba9ff',speed:.55,range:1.8,intensity:.4}, hover:{enabled:true,amplitude:.024,speed:.45}, rotor:{autoStart:false} }),
  mission: Object.freeze({ id:'mission', light:{color:'#2bbe6d',intensity:2.2,breathing:false}, statusField:{visible:true,color:'#2bbe6d',speed:.85,range:2,intensity:.55}, hover:{enabled:true,amplitude:.032,speed:.55}, rotor:{autoStart:true,speed:12} }),
  notice: Object.freeze({ id:'notice', light:{color:'#f2b84b',intensity:2.3,breathing:false}, statusField:{visible:true,color:'#f2b84b',speed:1,range:1.9,intensity:.58}, hover:{enabled:true,amplitude:.027,speed:.5}, rotor:{autoStart:false} }),
  warning: Object.freeze({ id:'warning', light:{color:'#eb4d4d',intensity:2.8,breathing:true,breathingSpeed:1.2}, statusField:{visible:true,color:'#eb4d4d',speed:1.35,range:2.15,intensity:.68}, hover:{enabled:true,amplitude:.028,speed:.6}, rotor:{autoStart:false} }),
  custom: Object.freeze({ id:'custom', light:{color:'#8e6cff',intensity:2,breathing:false}, statusField:{visible:true,color:'#8e6cff',speed:.8,range:2,intensity:.55}, hover:{enabled:true,amplitude:.026,speed:.5}, rotor:{autoStart:false} }),
});
export function cloneStatusPreset(id) {
  const preset = DRONE_STATUS_PRESETS[id]; if (!preset) throw new Error(`Unknown drone status: ${id}`);
  return structuredClone(preset);
}
