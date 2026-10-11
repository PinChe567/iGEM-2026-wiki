// AeroSense , mm. Original PCB datum retained. Nonbiological fit prototype.
// Canonical fallback CAD builder: OpenSCAD 2021.01 CGAL.
// Select part="cap", "body", "gas", "gas_open" or "plate"; print_pose=true only for body/cap.
part="well";
print_pose=false;
$fn=64;
hole_d=1.6; nx=4; ny=3; inlet_gap=1.5;
zin=64.2+inlet_gap; zroof=zin+3.3;
zliq=43+150/(4.7*3.4);
module box(w,d,h,x=0,y=0,z=0){translate([x-w/2,y-d/2,z])cube([w,d,h]);}
module cyl(r,h,x=0,y=0,z=0){translate([x,y,z])cylinder(h=h,r=r);}
module hcyl(r,h,x,y,z){translate([x,y,z])rotate([0,90,0])cylinder(h=h,r=r);}
module roundbox(w,d,h,r=4,z=0){
 union(){box(w-2*r,d,h,z=z);box(w,d-2*r,h,z=z);
 for(i=[-1,1])for(j=[-1,1])cyl(r,h,i*(w/2-r),j*(d/2-r),z);}
}
module plate(){difference(){box(14,11,1.2,z=63);
 for(i=[0:nx-1])for(j=[0:ny-1])cyl(hole_d/2,1.6,-4.8+i*9.6/(nx-1),-3.4+j*6.8/(ny-1),62.8);}}
module gas_open(){union(){box(14,11,zroof-61.8,z=60);
 for(sx=[-1,1])for(sy=[-1,1])box(4.7,3.4,60-zliq,sx*3.3,sy*2.65,zliq);
 hcyl(1.2,16.1,-23,0,zin);hcyl(1.2,16.1,6.9,0,61.5);}}
module gas(){difference(){gas_open();plate();}}
module cap(){difference(){
 union(){roundbox(32,26,zroof-58.9,2,58.9);
 difference(){roundbox(38,32,zroof-56.8,2,56.8);roundbox(34,28,zroof-55,1,56);}
 for(y=[-19,19]){cyl(4,4,0,y,58.9);box(8,8,4,0,sign(y)*15.5,58.9);}
 hcyl(1.7,8,-23,0,zin);hcyl(2,1,-21.5,0,zin);
 hcyl(1.7,8,15,0,61.5);hcyl(2,1,20.5,0,61.5);}
 gas();
 for(y=[-19,19]){cyl(1.7,7,0,y,58);cyl(4.3,2.9,0,y,56);}
}}
module body(){difference(){union(){import("inputs/body_input.stl",convexity=20);
 // Fill the old through-bores only inside the existing 3 mm side walls.
 for(s=[-1,1])box(3,6.4,6.4,s*55.5,0,58.8);}
 hcyl(3.1,10,-62,0,zin);hcyl(3.1,10,52,0,61.5);
}}
if(part=="cap")translate(print_pose?[23,23,-56.8]:[0,0,0])cap();
if(part=="body")translate(print_pose?[57,52,-3]:[0,0,0])body();
if(part=="gas")gas();
if(part=="gas_open")gas_open();
if(part=="plate")plate();

// Flat culture-contact floor. Uniform 0.5 mm bottom; PCB keepouts are retained below the well.
sx=1; sy=1;
module well_ne(){difference(){union(){
 box(5.8,4.5,15.8,3.3,2.65,42.5);
 box(6.5,5.2,1.5,3.65,3,56.8);}
 box(4.7,3.4,16,3.3,2.65,43);
}}
module well(){scale([sx,sy,1])well_ne();}
if(part=="well")well();
if(part=="well_section")intersection(){well();box(20,20,30,4,10+2.65,35);}
if(part=="cap_section")intersection(){cap();box(60,30,30,0,15,50);}
