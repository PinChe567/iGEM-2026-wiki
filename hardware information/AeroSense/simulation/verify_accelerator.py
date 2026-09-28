"""Independent execution of the NumPy reference versus C# for the same tube grid."""
from pathlib import Path
import numpy as np,json
import airflow_lbm as lb
S=Path(__file__).resolve().parent
lb.HERE=S/'benchmark_numpy';lb.HERE.mkdir(exist_ok=True)
r=lb.solve(.3,True,True,max_steps=10000)
a=np.load(lb.HERE/'benchmark_dx0.3_drho0.001_field.npz');b=np.load(S/'flow/tube_dx0.3_field.npz');assert np.array_equal(a['xyz_mm'],b['xyz_mm'])
velocity_error=float(np.linalg.norm(a['velocity_m_s']-b['velocity_m_s'])/np.linalg.norm(a['velocity_m_s']));assert velocity_error<1e-6
report=dict(grid_mm=.3,velocity_relative_L2_Csharp_vs_numpy=velocity_error,Q_relative_difference=float(b['Q_mL_min']/a['Q_mL_min']-1),numpy_converged=r['converged_by_declared_criteria'],criteria='Identical tube geometry, initial state, boundaries and stopping rule; relative velocity error < 1e-6',scope='Verifies execution equivalence, not physical model validity or device mesh independence.')
(S/'accelerator_verification.json').write_text(json.dumps(report,indent=2));print(report)
