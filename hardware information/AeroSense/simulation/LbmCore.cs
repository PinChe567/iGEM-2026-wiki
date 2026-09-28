// Double-precision D3Q19 BGK accelerator. Same equations and BC as airflow_lbm.py.
// Build: csc /optimize+ /out:LbmCore.exe LbmCore.cs
// Input binary: N, maxsteps, drho, dx (mm); q-major neighbour indices; port arrays.
// All values little-endian; output rho, ux, uy, uz as doubles, plus convergence CSV.
using System; using System.IO; using System.Globalization;
class LbmCore {
 static int[,] c={{0,0,0},{1,0,0},{-1,0,0},{0,1,0},{0,-1,0},{0,0,1},{0,0,-1},{1,1,0},{-1,-1,0},{1,-1,0},{-1,1,0},{1,0,1},{-1,0,-1},{1,0,-1},{-1,0,1},{0,1,1},{0,-1,-1},{0,1,-1},{0,-1,1}};
 static double[] w={1.0/3,1.0/18,1.0/18,1.0/18,1.0/18,1.0/18,1.0/18,1.0/36,1.0/36,1.0/36,1.0/36,1.0/36,1.0/36,1.0/36,1.0/36,1.0/36,1.0/36,1.0/36,1.0/36};
 static void Macro(double[] f,int n,int i,out double r,out double ux,out double uy,out double uz){r=ux=uy=uz=0;for(int q=0;q<19;q++){double v=f[q*n+i];r+=v;ux+=c[q,0]*v;uy+=c[q,1]*v;uz+=c[q,2]*v;}ux/=r;uy/=r;uz/=r;}
 static int[] Arr(BinaryReader br){int len=br.ReadInt32();int[] a=new int[len];for(int i=0;i<len;i++)a[i]=br.ReadInt32();return a;}
 static void Main(string[] args){CultureInfo.CurrentCulture=CultureInfo.InvariantCulture;
 int n,max; double drho,dx;int[] links,ins,outs,bi,bo;double[] init,initVel;
 using(var br=new BinaryReader(File.OpenRead(args[0]))){n=br.ReadInt32();max=br.ReadInt32();drho=br.ReadDouble();dx=br.ReadDouble();links=Arr(br);ins=Arr(br);outs=Arr(br);bi=Arr(br);bo=Arr(br);init=new double[n];for(int i=0;i<n;i++)init[i]=br.ReadDouble();initVel=new double[3*n];if(br.BaseStream.Position<br.BaseStream.Length)for(int i=0;i<3*n;i++)initVel[i]=br.ReadDouble();}
 double[] f=new double[n*19],post=new double[n*19],next=new double[n*19],prev=new double[n*3];
 for(int q=0;q<19;q++)for(int i=0;i<n;i++){double x=initVel[3*i],y=initVel[3*i+1],z=initVel[3*i+2];double cu=c[q,0]*x+c[q,1]*y+c[q,2]*z;f[q*n+i]=w[q]*init[i]*(1+3*cu+4.5*cu*cu-1.5*(x*x+y*y+z*z));}
 double uscale=0.15/dx;double dt=0.1*Math.Pow(dx*.001,2)/(1.8e-5/1.2); int stable=0,step=0;
 using(var csv=new StreamWriter(args[1]+"_convergence.csv")){csv.WriteLine("step,velocity_relative_change_over_200_steps,mass_flux_imbalance,max_Mach,Q_in_mL_min");
 for(step=1;step<=max;step++){
 for(int i=0;i<n;i++){double r,ux,uy,uz;Macro(f,n,i,out r,out ux,out uy,out uz);double uu=ux*ux+uy*uy+uz*uz;for(int q=0;q<19;q++){int k=q*n+i;double cu=c[q,0]*ux+c[q,1]*uy+c[q,2]*uz;double eq=w[q]*r*(1+3*cu+4.5*cu*cu-1.5*uu);post[k]=f[k]-(f[k]-eq)/.8;}}
 for(int k=0;k<next.Length;k++)next[k]=post[links[k]];
 var swap=f;f=next;next=swap;
 for(int side=0;side<2;side++){int[] face=side==0?ins:outs,near=side==0?bi:bo;double target=side==0?1+drho:1;
 for(int j=0;j<face.Length;j++){double r,ux,uy,uz;Macro(f,n,near[j],out r,out ux,out uy,out uz);double uu=ux*ux+uy*uy+uz*uz;
 for(int q=0;q<19;q++){double cu=c[q,0]*ux+c[q,1]*uy+c[q,2]*uz;double basis=w[q]*(1+3*cu+4.5*cu*cu-1.5*uu);f[q*n+face[j]]=(target-r)*basis+f[q*n+near[j]];}}}
 if(step%200==0){double diff=0,norm=0,vmax=0,qi=0,qo=0;
 for(int i=0;i<n;i++){double r,ux,uy,uz;Macro(f,n,i,out r,out ux,out uy,out uz);diff+=Math.Pow(ux-prev[i],2)+Math.Pow(uy-prev[n+i],2)+Math.Pow(uz-prev[2*n+i],2);norm+=ux*ux+uy*uy+uz*uz;vmax=Math.Max(vmax,Math.Sqrt(ux*ux+uy*uy+uz*uz));prev[i]=ux;prev[n+i]=uy;prev[2*n+i]=uz;}
 foreach(int i in bi){double r,x,y,z;Macro(f,n,i,out r,out x,out y,out z);qi+=r*x;}foreach(int i in bo){double r,x,y,z;Macro(f,n,i,out r,out x,out y,out z);qo+=r*x;}
 double change=Math.Sqrt(diff/Math.Max(norm,1e-300)),imb=Math.Abs(qi-qo)/Math.Max(Math.Abs(qi),Math.Abs(qo));
 csv.WriteLine(step+","+change.ToString("R")+","+imb.ToString("R")+","+(vmax*Math.Sqrt(3)).ToString("R")+","+(qi*uscale*Math.Pow(dx*.001,2)*6e7).ToString("R"));csv.Flush();
 if(step%2000==0)Console.WriteLine("step "+step+" change "+change+" mass "+imb);
 if(double.IsNaN(change)||vmax>.2)throw new Exception("Unstable LBM");
 if(change<2e-5&&imb<.002)stable++;else stable=0;if(stable>=3)break;
 }} }
 using(var bw=new BinaryWriter(File.Create(args[1]+".bin"))){bw.Write(Math.Min(step,max));bw.Write(stable>=3);for(int i=0;i<n;i++){double r,x,y,z;Macro(f,n,i,out r,out x,out y,out z);bw.Write(r);bw.Write(x);bw.Write(y);bw.Write(z);}}
 Console.WriteLine("Finished nodes "+n+" step "+step+" converged "+(stable>=3));
 }
}
