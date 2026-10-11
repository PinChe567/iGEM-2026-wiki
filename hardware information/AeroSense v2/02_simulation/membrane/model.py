"""Conservative 1D diffusion/partition screening. SI units throughout.

Unknowns u_i=c_i/K_i are gas-equivalent concentrations. At equilibrium,
u is continuous while real concentrations partition as c_i=K_i*u_i.
Each cell stores K_i*dx_i*u_i mol/m2 for a 1 mol/m3 gas reference.
Interfaces use harmonic half-cell resistance; no advection or reaction.
The symmetric finite-volume operator is propagated by an eigensystem,
so there is no time-step stability error. Spatial convergence is tested.
"""
from dataclasses import dataclass
import numpy as np

@dataclass
class Layer:
    name: str
    length_m: float
    D_m2_s: float
    K_to_gas: float
    cells: int

class Diffusion:
    def __init__(self,layers,sink=False,interface_h_m_s=float('inf'),feed=None):
        self.layers=layers;self.names=[];dx=[];D=[];K=[]
        for a in layers:
            assert a.length_m>0 and a.D_m2_s>0 and a.K_to_gas>0 and a.cells>0
            dx.extend([a.length_m/a.cells]*a.cells);D.extend([a.D_m2_s]*a.cells)
            K.extend([a.K_to_gas]*a.cells);self.names.extend([a.name]*a.cells)
        dx=np.array(dx);D=np.array(D);K=np.array(K)
        self.dx=dx;self.D=D;self.K=K;M=dx*K;half=dx/(2*D*K)
        g=1/(half[:-1]+half[1:]);g0=1/half[0];gn=1/half[-1] if sink else 0.
        # Optional two membrane/gas surface resistances, expressed in gas-
        # equivalent concentration units. They are sensitivity inputs.
        if np.isfinite(interface_h_m_s):
            assert interface_h_m_s>0
            if self.names[0]=='PDMS':g0=1/(half[0]+1/interface_h_m_s)
            for i in range(len(g)):
                if (self.names[i]=='PDMS')!=(self.names[i+1]=='PDMS'):
                    g[i]=1/(half[i]+half[i+1]+1/interface_h_m_s)
        if feed is not None:
            # Four identical wells draw from one ideally mixed plenum.
            # M_res=V_plenum/(4*A), g_feed=Q/(4*A); outlet concentration=u_res.
            M=np.r_[feed['volume_m3']/(4*feed['well_area_m2']),M]
            g=np.r_[g0,g];g0=feed['Q_m3_s']/(4*feed['well_area_m2'])
            self.names=['feed_reservoir']+self.names
        n=len(M);B=np.zeros((n,n))
        for i,v in enumerate(g):
            B[i,i]-=v;B[i+1,i+1]-=v;B[i,i+1]+=v;B[i+1,i]+=v
        B[0,0]-=g0;B[-1,-1]-=gn
        self.M=M;self.B=B;self.g0=g0;self.gn=gn;self.root=np.sqrt(M)
        H=B/self.root[:,None]/self.root[None,:]
        self.eigenvalues,self.V=np.linalg.eigh(H)
        if np.max(self.eigenvalues)>=0:raise ValueError('Operator must be dissipative')
        if sink:
            b=np.zeros(n);b[0]=g0;self.steady=np.linalg.solve(-B,b)
        else:self.steady=np.ones(n)
        self.coeff=self.V.T@(-self.root*self.steady)
    def response(self,t):
        t=np.atleast_1d(t).astype(float)
        E=np.exp(t[:,None]*self.eigenvalues)
        return self.steady+(E*self.coeff)@self.V.T/self.root
    def integral(self,t):
        t=np.atleast_1d(t).astype(float)
        E=np.expm1(t[:,None]*self.eigenvalues)/self.eigenvalues
        return t[:,None]*self.steady+(E*self.coeff)@self.V.T/self.root
    def scalar(self,t,index=-1):
        return float(self.steady[index]+np.dot(np.exp(t*self.eigenvalues)*self.coeff,self.V[index])/self.root[index])
    def time_to(self,fraction,index=-1,horizon=7*86400):
        if self.scalar(horizon,index)<fraction:return None
        lo=0.;hi=horizon
        for _ in range(55):
            mid=(lo+hi)/2
            if self.scalar(mid,index)<fraction:lo=mid
            else:hi=mid
        return (hi+lo)/2
    def mass_balance(self,t):
        u=self.response(t);integ=self.integral(t)
        stored=u@self.M
        entered=self.g0*(np.asarray(t)-integ[:,0])
        exited=self.gn*integ[:,-1]
        scale=max(float(np.max(np.abs(stored))),1e-20)
        return float(np.max(np.abs(stored-entered+exited))/scale)
    def forced(self,t,concentration):
        """Exact-in-time response to a piecewise-linear upstream history.

        Concentration is normalized to an arbitrary common gas reference.
        Histories are prescribed, not a two-way coupling to gas CFD.
        """
        t=np.asarray(t,float);c=np.asarray(concentration,float)
        if t.ndim!=1 or c.ndim!=1 or t.shape!=c.shape or len(t)<2 or np.any(~np.isfinite(t)) or t[0]!=0 or np.any(np.diff(t)<=0):raise ValueError('Require finite same-sized histories, t0=0, strictly increasing time')
        if np.any(~np.isfinite(c)) or np.any(c<0):raise ValueError('Concentrations must be finite and nonnegative')
        w=np.zeros(len(self.M));beta=self.V[0]*self.g0/self.root[0];out=[np.zeros(len(w))]
        for i,dt in enumerate(np.diff(t)):
            z=self.eigenvalues*dt;e=np.exp(z);phi1=np.expm1(z)/self.eigenvalues
            phi2=np.empty_like(z);small=np.abs(z)<1e-4
            phi2[small]=dt*dt*(.5+z[small]/6+z[small]**2/24+z[small]**3/120)
            phi2[~small]=(np.expm1(z[~small])-z[~small])/self.eigenvalues[~small]**2
            w=e*w+beta*(c[i]*phi1+(c[i+1]-c[i])/dt*phi2)
            out.append((self.V@w)/self.root)
        return np.array(out)

def well(thickness_um=0,Dm=1e-10,Km=100,Kl=10,Dl=1e-9,
         liquid_uL=100,Dg=1e-5,n=48,h=float('inf'),feed_Q=None):
    if thickness_um<0 or (feed_Q is not None and feed_Q<=0):raise ValueError('Film thickness must be nonnegative and finite feed flow must be positive')
    depth=liquid_uL/11.2*1e-3;gas=(12.5-liquid_uL/11.2)*1e-3
    assert 0<gas and 0<depth
    layers=[]
    if thickness_um>0:layers.append(Layer('PDMS',thickness_um*1e-6,Dm,Km,max(8,n//2)))
    layers.extend([Layer('gas',gas,Dg,1,max(4,n//8)),Layer('liquid',depth,Dl,Kl,n)])
    feed=None if feed_Q is None else {'volume_m3':854.4e-9,'well_area_m2':11.2e-6,'Q_m3_s':feed_Q*1e-6/60}
    return Diffusion(layers,interface_h_m_s=h,feed=feed)

def slab_bottom(t,L,D):
    """Exact Dirichlet top / impermeable bottom step response; t>0."""
    t=np.atleast_1d(t);k=np.arange(1000);q=2*k+1
    return 1-np.exp(-t[:,None]*D/L**2*(q*np.pi/2)**2)@(4*(-1.)**k/(np.pi*q))

def root_slab(frac):
    lo=1e-6;hi=10.
    for _ in range(70):
        mid=(lo+hi)/2
        if slab_bottom([mid],1,1)[0]<frac:lo=mid
        else:hi=mid
    return (lo+hi)/2
