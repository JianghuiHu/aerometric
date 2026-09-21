import * as THREE from 'three';

const LANDING_X=-2.5,LANDING_Z=-2.5;
const CRUISE_XZ=[
  [-2.5,-2.5],[-2.5,-6],[2.5,-6],[6,-6],[6,-2.5],[6,2.5],
  [2.5,2.5],[2.5,6],[-2.5,6],[-6,6],[-6,2.5],[-6,-2.5],[-2.5,-2.5]
];

class PolylineCurve3 extends THREE.Curve{
  constructor(points){super();this.points=points;this.lengths=[0];for(let i=1;i<points.length;i++)this.lengths.push(this.lengths.at(-1)+points[i].distanceTo(points[i-1]));this.total=this.lengths.at(-1);}
  segmentAt(t){const distance=THREE.MathUtils.clamp(t,0,1)*this.total;let index=1;while(index<this.lengths.length-1&&this.lengths[index]<distance)index++;const start=this.lengths[index-1],span=this.lengths[index]-start;return{index,alpha:span?(distance-start)/span:0};}
  getPoint(t,target=new THREE.Vector3()){const {index,alpha}=this.segmentAt(t);return target.copy(this.points[index-1]).lerp(this.points[index],alpha);}
  getTangent(t,target=new THREE.Vector3()){const {index}=this.segmentAt(t);return target.copy(this.points[index]).sub(this.points[index-1]).normalize();}
}

/** Map-scale, road-aligned flight loop. Visual points describe the drone's lowest clearance point. */
export class FlightRouteController{
  constructor(parent,{groundResolver=()=>-.045,duration=76}={}){
    this.root=new THREE.Group();this.root.name='FlightRouteRoot';this.root.visible=false;parent.add(this.root);this.duration=Math.max(61,duration);this.groundResolver=groundResolver;
    const material=new THREE.MeshBasicMaterial({color:0x35d8ff,transparent:true,opacity:.86,toneMapped:false,fog:false}),halo=material.clone();halo.opacity=.12;
    this.tube=new THREE.Mesh(new THREE.BufferGeometry(),material);this.glow=new THREE.Mesh(new THREE.BufferGeometry(),halo);this.tube.name='FlightRouteCore';this.glow.name='FlightRouteGlow';
    const padMaterial=new THREE.MeshBasicMaterial({color:0x35d8ff,transparent:true,opacity:.58,side:THREE.DoubleSide,toneMapped:false,fog:false}),discMaterial=new THREE.MeshBasicMaterial({color:0x35d8ff,transparent:true,opacity:.1,side:THREE.DoubleSide,depthWrite:false,toneMapped:false,fog:false});
    this.ring=new THREE.Mesh(new THREE.RingGeometry(.34,.43,48),padMaterial);this.disc=new THREE.Mesh(new THREE.CircleGeometry(.33,48),discMaterial);this.ring.name='LandingPadRing';this.disc.name='LandingPadDisc';for(const mesh of [this.ring,this.disc])mesh.rotation.x=-Math.PI/2;
    this.marker=new THREE.Mesh(new THREE.SphereGeometry(.055,12,8),new THREE.MeshBasicMaterial({color:0xbaf5ff,toneMapped:false,fog:false}));this.marker.name='FlightRouteMarker';for(const mesh of [this.glow,this.tube,this.disc,this.ring,this.marker])mesh.userData.status_light=true;
    this.root.add(this.glow,this.tube,this.disc,this.ring,this.marker);this.materials=[material,halo,padMaterial,discMaterial,this.marker.material];this.staticGeometries=[this.ring.geometry,this.disc.geometry,this.marker.geometry];this.padMaterial=padMaterial;this.enabled=false;this.time=0;this.target=null;this.basePosition=new THREE.Vector3();this.baseQuaternion=new THREE.Quaternion();this.targetBottom=new THREE.Vector3();this.point=new THREE.Vector3();this.tangent=new THREE.Vector3();this.yAxis=new THREE.Vector3(0,1,0);this.refreshGround();
  }
  refreshGround(){
    this.groundY=Number(this.groundResolver(LANDING_X,LANDING_Z));if(!Number.isFinite(this.groundY))this.groundY=-.045;this.cruiseY=this.groundY+1.85;
    this.padPoint=new THREE.Vector3(LANDING_X,this.groundY+.003,LANDING_Z);this.takeoffPoint=new THREE.Vector3(LANDING_X,this.cruiseY,LANDING_Z);this.cruisePoints=CRUISE_XZ.map(([x,z])=>new THREE.Vector3(x,this.cruiseY,z));this.cruiseCurve=new PolylineCurve3(this.cruisePoints);
    const visualPoints=[this.padPoint,this.takeoffPoint,...this.cruisePoints.slice(1),this.padPoint];this.visualCurve=new PolylineCurve3(visualPoints);
    this.tube.geometry.dispose();this.glow.geometry.dispose();this.tube.geometry=new THREE.TubeGeometry(this.visualCurve,320,.022,6,false);this.glow.geometry=new THREE.TubeGeometry(this.visualCurve,320,.065,6,false);
    for(const mesh of [this.ring,this.disc])mesh.position.set(LANDING_X,this.groundY+.012,LANDING_Z);this.marker.position.copy(this.padPoint);
    return this.groundY;
  }
  bind(object){if(this.target)this.resetTarget();this.target=object??null;if(object){this.basePosition.copy(object.position);this.baseQuaternion.copy(object.quaternion);object.updateWorldMatrix(true,true);const box=new THREE.Box3().setFromObject(object,true),center=box.getCenter(new THREE.Vector3());this.targetBottom.set(center.x,box.min.y,center.z);}}
  setEnabled(enabled){const next=Boolean(enabled);if(next===this.enabled)return;this.enabled=next;this.root.visible=next;this.time=0;if(next){this.refreshGround();this.applyPoint(this.padPoint);}else this.resetTarget();}
  resetTarget(){if(this.target){this.target.position.copy(this.basePosition);this.target.quaternion.copy(this.baseQuaternion);}}
  applyPoint(point){if(!this.target)return;this.target.position.set(this.basePosition.x+point.x-this.targetBottom.x,this.basePosition.y+point.y-this.targetBottom.y,this.basePosition.z+point.z-this.targetBottom.z);this.marker.position.copy(point);}
  update(delta){
    if(!this.enabled||!this.target)return;this.time=(this.time+Math.min(delta,.05))%this.duration;
    const landed=4,takeoff=8,cruise=this.duration-20,descent=8,t=this.time;
    if(t<landed){this.point.copy(this.padPoint);this.tangent.set(0,1,0);}
    else if(t<landed+takeoff){this.point.copy(this.padPoint).lerp(this.takeoffPoint,(t-landed)/takeoff);this.tangent.set(0,1,0);}
    else if(t<landed+takeoff+cruise){const progress=(t-landed-takeoff)/cruise;this.cruiseCurve.getPoint(progress,this.point);this.cruiseCurve.getTangent(progress,this.tangent);}
    else{this.point.copy(this.takeoffPoint).lerp(this.padPoint,(t-landed-takeoff-cruise)/descent);this.tangent.set(0,-1,0);}
    this.applyPoint(this.point);if(Math.abs(this.tangent.y)<.5){const yaw=Math.atan2(this.tangent.x,this.tangent.z);this.target.quaternion.copy(this.baseQuaternion).multiply(new THREE.Quaternion().setFromAxisAngle(this.yAxis,yaw));}
    this.padMaterial.opacity=.48+.12*Math.sin(this.time*2.2);
  }
  dispose(){this.resetTarget();this.root.removeFromParent();this.tube.geometry.dispose();this.glow.geometry.dispose();this.staticGeometries.forEach(item=>item.dispose());this.materials.forEach(item=>item.dispose());}
}
