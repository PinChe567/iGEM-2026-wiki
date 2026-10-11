// Optional accessible two-piece gas cap. Replaces one operating part with two.
// Same nominal internal gas domain as baseline  when gasket is compressed to 0.6 mm.
include <model.scad>
part="split_lower";
module seal_ring(){difference(){box(22,19,.61,z=63.6);box(15,12,.8,z=63.5);}}
module locators(clearance=0,height=1.2){
 cyl(1.5+clearance,height,-12,8,64.2);
 cyl(1.5+clearance,height,10,-8,64.2);
}
module lower(){union(){difference(){intersection(){cap();box(70,70,64.2-50,z=50);}seal_ring();
 // Upper screw-ear bridges nest into these pockets; their underside seats at Z62.9.
 // 0.15 mm lateral clearance avoids an interference fit in brittle resin.
 for(y=[-19,19])box(8.3,8.3,1.5,0,sign(y)*15.5,62.9);
 }locators();}}
module upper(){difference(){union(){
 // 0.0001 mm CSG offset excludes coincident zero-thickness remnants of the plate.
 intersection(){cap();box(70,70,20,z=64.2001);}
 for(y=[-19,19]){cyl(4,2,0,y,62.9);box(8,8,2,0,sign(y)*15.5,62.9);}}
 locators(.15,1.4);
 for(y=[-19,19])cyl(1.7,4,0,y,62.8);
}}
if(part=="split_lower")lower();
if(part=="split_upper")upper();
if(part=="split_intersection")intersection(){lower();upper();}
