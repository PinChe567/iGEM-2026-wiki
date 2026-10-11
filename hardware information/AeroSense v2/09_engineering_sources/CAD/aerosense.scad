// AeroSense compact, eight operating prints. mm. Optical-face-up datum.
// The vendor PCB is not a certified STEP model. Openings are intentionally accessible.
part="base"; sx=1; sy=1; $fn=48;
// CFD-selected shelf projects inward from the inlet-side wall, below the gas ports.
deflector="shelf"; deflector_width=8; deflector_bottom=58.2; shelf_end=-0.2;
module box(w,d,h,x=0,y=0,z=0){translate([x-w/2,y-d/2,z])cube([w,d,h]);}
module cyl(r,h,x=0,y=0,z=0){translate([x,y,z])cylinder(r=r,h=h);}
module xcyl(r,h,x=0,y=0,z=0){translate([x,y,z])rotate([0,90,0])cylinder(r=r,h=h);}
module roundbox(w,d,h,r=4,y=-2,z=0){hull(){for(i=[-1,1])for(j=[-1,1])cyl(r,h,i*(w/2-r),y+j*(d/2-r),z);}}
module hexnut(z,x,y,sideopen=false){translate([x,y,z])rotate([0,0,30])cylinder(r=3.3,h=2.7,$fn=6);if(sideopen)box(6,10,2.7,x,y+4,z);}
module screw_posts(h,z){difference(){for(p=[[-30,-51.8],[30,47.8]])cyl(3.9,h,p[0],p[1],z);box(100.6,90.6,2.6,0,0,37.5);}}
module base(){difference(){union(){
 difference(){roundbox(108,108,39,z=3);roundbox(103.2,103.2,40,r=2,z=6);}
 // Built-in feet leave underside fan inlet open on a table.
 for(x=[-47,47])for(y=[-48,44])cyl(4,3,x,y,0);
 // PCB pillars include side-entry nuts, never tap brittle resin.
 for(x=[-45,45])for(y=[-40,40])cyl(4.7,32,x,y,6);
 screw_posts(36,6);
 // Corner cradle stabilizes the fan; only two diagonal screws are required.
 for(x=[-1,1])for(y=[-1,1]){
 box(2,9,10,-27+x*21.3,-5+y*16,6);box(9,2,10,-27+x*16,-5+y*21.3,6);
 }
 // Captive nuts load the full 3 mm floor, rather than a thin pocket roof.
 for(p=[[-43,-21],[-11,11]])cyl(4.5,2.7,p[0],p[1],0.3);
 // Tongue excludes light through the enclosure joint.
 difference(){roundbox(104.4,104.4,1.5,r=2,z=41.8);roundbox(100.4,100.4,1.7,r=1,z=41.7);}
 } 
 for(x=[-45,45])for(y=[-40,40]){cyl(1.7,35,x,y,6);hexnut(33.5,x,y,true);}
 for(p=[[-30,-51.8],[30,47.8]]){cyl(1.7,37,p[0],p[1],6);hexnut(33.2,p[0],p[1],true);}
 // Fan intake and finger guard are part of the base.
 difference(){union(){for(x=[-42,-37,-32,-27,-22,-17,-12])box(3,32,8,x,-5,0);}for(p=[[-43,-21],[-11,11]])cyl(4.5,10,p[0],p[1],-1);}
 for(p=[[-43,-21],[-11,11]]){cyl(1.7,20,p[0],p[1],0);hexnut(0.3,p[0],p[1]);}
 // Exhaust lies below the PCB, separated from the sample gas chamber.
 for(y=[-27,-19,-11,17,25,33])box(8,4,6,53,y,15);
 for(y=[-35,-27,-19,3,11])box(9,4,6,-53,y,15);
 // Actual board interfaces: J2 front; SW1 right in the optical-view datum.
 box(20,10,12,31.5,-54,28.5);
 box(10,23,13,53,7,27.5);
 // ESP32 antenna keep-out in front edge. No metal insert in this window.
 box(23,12,12.6,3.5,-50,27);
 // UART cable and reset/boot service access underneath.
 box(22,12,8,26,-23.5,0);
 for(p=[[-17.8,-30.1],[20,-30.1]])cyl(3,8,p[0],p[1],0);
}}
module well_ne(){difference(){union(){box(5,3.8,13,3.3,2.65,42.5);box(5.7,4.5,1.3,3.65,3.0,54.2);}box(4,2.8,14,3.3,2.65,43);}}
module well(){scale([sx,sy,1])well_ne();}
module well_slot(sx,sy){scale([sx,sy,1]){box(5.3,4.1,20,3.3,2.65,40);box(6,4.8,3,3.65,3,54.2);}}
module shield_block(){difference(){box(20,18,11.3,0,0,44.2);for(i=[-1,1])for(j=[-1,1])well_slot(i,j);}}
module filter_seat(){difference(){box(6.4,5.4,1.4,0,0,40.8);box(5.4,4.4,2,0,0,41.1);box(4.8,3.8,3,0,0,40);box(1.9,4,0.6,3.6,1.3,40.7);}}
module hood(){difference(){union(){
 difference(){roundbox(108,108,22,z=42);roundbox(103.2,103.2,24,r=2,z=41);}
 shield_block();
 // Corner guides locate both gaskets and the removable compression plate.
 for(i=[-1,1])for(j=[-1,1]){
  box(3,3,1.3,i*9.8,j*8.8,54.2);
  box(1.4,3,2,i*10.9,j*8.2,55.5);
  box(3,1.4,2,i*9.2,j*9.9,55.5);
 }
 // Structural bridges join the black sleeve to the outer shell high above optics.
 box(104,3,3,0,7.5,49);box(104,3,3,0,-7.5,49);
 box(3,104,3,8.5,-2,49);box(3,104,3,-8.5,-2,49);
 // Optical filter tray cantilever, with opening under the active detector.
 filter_seat();box(5.3,0.6,1.2,-5.7,0,40.9);box(2,2,10,-8.5,0,40.9);
 screw_posts(22,42);
 } 
 // Matching tongue clearance and screw channels.
 difference(){roundbox(104.8,104.8,1.5,r=2,z=41.9);roundbox(100,100,1.7,r=1,z=41.8);}
 for(p=[[-30,-51.8],[30,47.8]])cyl(1.8,24,p[0],p[1],41);
 // Sample hoses pass through dedicated slots; no fan airflow enters the plenum.
 for(s=[-1,1])box(8,7,7,s*53,0,57.3);
}}
module plenum(){union(){box(14.8,12,5.2,0,0,57.3);for(i=[-1,1])for(j=[-1,1])box(4,2.8,2.0,i*3.3,j*2.65,55.3);xcyl(1.2,12,-18,0,60.8);xcyl(1.2,12,6,0,60.8);}}
module compression_plate(){difference(){box(20,18,1.2,0,0,56.1);for(i=[-1,1])for(j=[-1,1])box(4,2.8,2,i*3.3,j*2.65,55.9);}}
module impact(){
 if(deflector=="wall" || deflector=="hood")box(1.2,deflector_width,62.5-deflector_bottom,-4.2,0,deflector_bottom);
 if(deflector=="hood" || deflector=="shelf")box(shelf_end+7.4,deflector_width,1.2,(shelf_end-7.4)/2,0,deflector_bottom);
}
module gas_cap(){union(){difference(){union(){box(18.4,15.6,6.1,0,0,57.9);xcyl(1.7,10,-18,0,60.8);xcyl(2,0.8,-16.8,0,60.8);xcyl(1.7,10,8,0,60.8);xcyl(2,0.8,16,0,60.8);}plenum();}impact();}}
module lid(){difference(){union(){roundbox(108,108,2,z=64);gas_cap();
 // Lid reinforcement remains outside the gas volume and cleanable from below.
 for(y=[-12,12])box(100,2.4,5,0,y,59);
 for(x=[-12,12])box(2.4,100,5,x,-2,59);
 // Perimeter lip locates the lift-off lid without a hinge or extra latch.
 difference(){roundbox(102.8,102.8,1.2,r=2,z=62.8);roundbox(100.4,100.4,1.4,r=1,z=62.7);}
 }for(p=[[-30,-51.8],[30,47.8]])cyl(1.8,9,p[0],p[1],59);
 // Lip clears the hood's screw pillars; the solid top still bears on them.
 for(p=[[-30,-51.8],[30,47.8]])cyl(4.15,1.3,p[0],p[1],62.7);
 // Preserve the gas bores where reinforcement ribs cross the barbs.
 xcyl(1.2,12,-18,0,60.8);xcyl(1.2,12,6,0,60.8);
}}
if(part=="base")base();
if(part=="hood")hood();
if(part=="lid")lid();
if(part=="well")well();
if(part=="compression_plate")compression_plate();
if(part=="gas")difference(){plenum();impact();}
if(part=="assembly"){color("#303842")base();color("#25282b")hood();color("#495361")lid();color("#697e89")compression_plate();for(i=[-1,1])for(j=[-1,1])color([0.2,0.8,0.9,0.4])scale([i,j,1])well_ne();}
if(part=="coupon"){difference(){box(26,20,2,z=0);for(x=[-8,0,8])cyl(1.5+(x+8)/80,3,x,0,-.1);}for(i=[0:2])box(1.2+i*.4,15,5,-8+i*8,0,2);}
