"""Verify/rebuild the saved typical PD response from its saved manufacturer PDF.

Requires optional PyMuPDF. Default comparison never needs this dependency.
Axes and curve identity are specific to revision 1.2, 17-Mar-2025, page 3.
"""
from pathlib import Path
import argparse
import csv
import hashlib
import numpy as np
import fitz

P=Path(__file__).resolve().parent.parent/'results'


def extract(pdf):
    assert hashlib.sha256(pdf.read_bytes()).hexdigest()=='e0b196d66d096e951f371e45ac26e4fe9cbc40c9236933add2cec037c040cd28'
    document=fitz.open(pdf)
    items=document[2].get_drawings()[244]['items']
    points=[]
    for item in items:
        assert item[0]=='c'
        p0,p1,p2,p3=[np.array([v.x,v.y]) for v in item[1:]]
        for t in np.linspace(0,1,21):
            points.append((1-t)**3*p0+3*(1-t)**2*t*p1+3*(1-t)*t*t*p2+t**3*p3)
    xy=np.array(points)
    wavelength=400+(xy[:,0]-389.43)/(525.47-389.43)*700
    relative=(224.53-xy[:,1])/(224.53-113.588)
    ix=np.argsort(wavelength)
    w=np.arange(400.,1100.1,5.)
    sr=np.interp(w,wavelength[ix],relative[ix])
    R950=26e-6/(1e-3*.075)
    response=sr/np.interp(950,w,sr)*R950
    return np.column_stack([w,sr,response])


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pdf',type=Path,required=True,help='Local manufacturer PDF, revision 1.2, 17-Mar-2025. See README source URL and SHA256.')
    parser.add_argument('--write',action='store_true')
    args=parser.parse_args()
    curve=extract(args.pdf)
    output=P/'VEMD5060X01_typical_response.csv'
    if args.write:
        with output.open('w',encoding='utf-8',newline='') as f:
            w=csv.writer(f);w.writerow(['wavelength_nm','relative_spectral_sensitivity','typical_responsivity_A_W']);w.writerows(curve)
    else:
        saved=np.genfromtxt(output,delimiter=',',skip_header=1)
        error=float(np.max(abs(curve-saved)))
        assert error<1e-12,error
        print('Manufacturer vector extraction agrees with saved CSV; maximum absolute difference:',error)
