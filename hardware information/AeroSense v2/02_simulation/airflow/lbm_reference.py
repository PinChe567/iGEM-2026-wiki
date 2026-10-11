"""D3Q19 BGK NumPy building blocks. Authoritative geometry is in run_flow.py."""
from pathlib import Path
import numpy as np
C=np.array([[0,0,0],[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1],
 [1,1,0],[-1,-1,0],[1,-1,0],[-1,1,0],[1,0,1],[-1,0,-1],[1,0,-1],[-1,0,1],
 [0,1,1],[0,-1,-1],[0,1,-1],[0,-1,1]],dtype=int)
W=np.array([1/3]+[1/18]*6+[1/36]*12)
OPP=np.array([np.where(np.all(C==-c,axis=1))[0][0] for c in C])
HERE=Path(__file__).resolve().parent
RHO=1.2; MU=1.8e-5; NU=MU/RHO; TAU=.8; NUL=(TAU-.5)/3
def macro(f):
 rho=f.sum(0);u=(C.T@f)/rho
 return rho,u

def equilibrium(rho,u):
 cu=C@u;us=(u*u).sum(0)
 return W[:,None]*rho[None,:]*(1+3*cu+4.5*cu*cu-1.5*us[None,:])

