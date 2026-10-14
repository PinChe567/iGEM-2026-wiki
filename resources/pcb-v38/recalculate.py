"""Reproduce AeroSense v2 nominal PCB calculations using Python 3 (standard library).

Download this file and component-audit.json into the same directory, then run:
    python recalculate.py
The script writes calculations.json and component-audit.csv. The source audit
maps every reference designator back to the original 61-row BOM. Inputs are
schematic nominal values, cited manufacturer data, and firmware constants.
These calculations do not substitute for circuit measurements.
"""
from pathlib import Path
import csv
import json
import math

HERE = Path(__file__).resolve().parent
rf, cf, vref, bits, fs, n = 100e6, 2.2e-12, 2.5, 16, 4000, 8000
k, temperature = 1.380649e-23, 300.0
tau = rf * cf
pole = 1 / (2 * math.pi * tau)
lsb = vref / 2**bits

def calculate():
    channels = []
    for frequency in (41, 67, 89, 113):
        response = 1 / math.sqrt(1 + (frequency / pole)**2)
        channels.append({
            'frequency_Hz': frequency,
            'cycles_in_block': frequency * n / fs,
            'ideal_feedback_amplitude_relative_to_DC': response,
            'ideal_feedback_transimpedance_ohm': rf * response,
            'ideal_feedback_attenuation_dB': 20 * math.log10(response),
            'ideal_feedback_phase_deg': -math.degrees(math.atan(frequency / pole)),
        })
    return {
        'interpretation': 'Nominal schematic calculations and configured timing; not measured performance.',
        'inputs': {'Rf_ohm': rf, 'Cf_F': cf, 'Vref_V': vref, 'ADC_bits': bits,
                   'configured_sample_rate_Hz': fs, 'samples_per_block': n,
                   'resistor_noise_temperature_assumption_K': temperature},
        'feedback': {'tau_s': tau, 'pole_Hz': pole, 'DC_gain_V_per_nA': rf * 1e-9,
                     'photodiode_capacitance_zero_bias_typical_F': 80e-12,
                     'amplifier_input_capacitance_approx_F': 11e-12,
                     'starting_Cin_excluding_layout_F': 91e-12,
                     'asymptotic_noise_gain_ideal_feedback_only': 1 + 91e-12 / cf,
                     'phase_margin_deg': None,
                     'channels': channels},
        'rf_noise_only': {'input_A_per_sqrt_Hz': math.sqrt(4 * k * temperature / rf),
                          'output_V_per_sqrt_Hz_at_low_frequency': math.sqrt(4 * k * temperature * rf),
                          'ideal_one_pole_ENBW_Hz': math.pi * pole / 2,
                          'ideal_one_pole_output_V_RMS': math.sqrt(k * temperature / cf),
                          'scope': 'R27 thermal noise only; excludes other circuit noise and I/Q estimator response.'},
        'adc': {'ideal_code_V': lsb, 'ideal_DC_current_A_per_code': lsb / rf,
                'reference_span_current_A': vref / rf,
                'usable_current_span_A': None,
                'manufacturer_max_sample_rate_Hz': 100000,
                'max_conversion_time_s': 8.8e-6,
                'input_R_positive_ohm': 100, 'input_R_negative_ohm': 100,
                'input_C_differential_F': 1e-9,
                'unloaded_differential_input_tau_s': 200e-9,
                'unloaded_differential_input_pole_Hz': 1 / (2 * math.pi * 200 * 1e-9)},
        'firmware': {'configured_sample_period_s': 1 / fs, 'nominal_block_duration_s': n / fs,
                     'frequency_bin_Hz': fs / n, 'Nyquist_Hz': fs / 2,
                     'conversion_wait_s': 10e-6, 'conversion_wait_margin_s': 10e-6 - 8.8e-6,
                     'SPI_clock_Hz': 2e6, 'SPI_16bit_transfer_s': 16 / 2e6,
                     'wait_plus_transfer_s_excluding_overhead': 10e-6 + 16 / 2e6,
                     'default_LED_duty_fraction': .25,
                     'accepted_LED_duty_percent': [1, 50],
                     'max_interval_error_limit_us': 50,
                     'onboard_current_calibration': None},
        'LED_nominal_estimate': {'rail_assumption_V': 5, 'Vf_assumption_V': 3.4,
                                 'Vf_test_current_A': .020, 'VDS_neglected': True,
                                 'resistor_ohm': 100, 'on_current_A': (5 - 3.4) / 100,
                                 'average_current_A_at_default_duty': .25 * (5 - 3.4) / 100,
                                 'resistor_on_power_W': ((5 - 3.4) / 100)**2 * 100,
                                 'resistor_average_power_W': .25 * ((5 - 3.4) / 100)**2 * 100,
                                 'worst_case_current_A': None},
        'gate': {'ideal_high_gate_V': 3.3 * 100000 / 100220,
                 'pulldown_current_A': 3.3 / 100220,
                 'ideal_initial_gate_current_upper_A': 3.3 / 220,
                 'small_signal_220ohm_630pF_tau_s': 220 * 630e-12,
                 'measured_switching_time_s': None},
        'reservoir_example': {'C12_F': 47e-6, 'assumed_no_replenishment_s': 100e-6,
                              'assumed_four_channel_current_A': .064,
                              'estimated_droop_V': .064 * 100e-6 / 47e-6},
        'supplies': {'TIA_filter_tau_s': 100 * 100.1e-6,
                     'TIA_supply_filter_pole_Hz': 1 / (2 * math.pi * 100 * 100.1e-6),
                     'TIA_supply_drop_V_at_1p1mA': 100 * .0011,
                     'reset_tau_s': 10000 * 10.1e-6,
                     'reference_initial_B_grade_error_V': 2.5 * .00025,
                     'reference_initial_B_grade_error_ideal_codes': 2.5 * .00025 / lsb,
                     'reference_shunt_branch_R_equals_Xc_Hz': 1 / (2 * math.pi * .1 * 10e-6),
                     'reference_feed_lowpass_Hz': None,
                     'LDO_example_load_A': .20,
                     'LDO_example_dissipation_W_excluding_ground_current': (5 - 3.3) * .20,
                     'required_boost_divider_ratio_R6_over_R8_at_typical_PWM_VFB': 5 / .595 - 1,
                     'actual_boost_divider_ratio': None},
        'uncertainties': ['Source schematic/BOM omit C1–C11, R1–R14, L1 values and U3 identity.',
                          'Passives lack complete MPNs, tolerance, voltage/power rating, dielectric/ESR.',
                          'PCB parasitics, settling, complete noise and optical calibration are not measured by this calculation.']
    }

def main():
    audit_path = HERE / 'component-audit.json'
    if not (HERE / 'source-inventory.json').exists() and audit_path.exists():
        audit = json.loads(audit_path.read_text(encoding='utf-8'))
        inventory, groups = audit['source_inventory'], audit['functional_groups']
    else:
        inventory = json.loads((HERE / 'source-inventory.json').read_text(encoding='utf-8'))
        groups = json.loads((HERE / 'component-selections.json').read_text(encoding='utf-8'))
    expected = {ref: row for row in inventory for ref in row['references']}
    actual = [ref for group in groups for ref in group['references']]
    assert len(inventory) == 61
    assert len(actual) == len(set(actual)) == len(expected) == 104
    assert set(actual) == set(expected), 'Every original reference must be mapped exactly once'
    calc = calculate()
    assert math.isclose(calc['feedback']['pole_Hz'], 723.4315595086153, rel_tol=1e-12)
    assert math.isclose(calc['adc']['unloaded_differential_input_pole_Hz'], 795774.7154594767, rel_tol=1e-12)
    fields = ['bom_row','reference','source_row_quantity','source_nominal','functional_group',
              'role_en','role_zh','calculation_en','calculation_zh','basis_en','basis_zh','source']
    rows=[]
    for group in groups:
        for ref in group['references']:
            record = expected[ref]
            rows.append(dict(bom_row=record['bom_row'],reference=ref,
                             source_row_quantity=record['quantity'],source_nominal=record['nominal'] or '',
                             functional_group=group['key'],**{key:group[key] for key in fields[5:]}))
    rows.sort(key=lambda row:(row['bom_row'], row['reference']))
    with (HERE/'component-audit.csv').open('w',encoding='utf-8-sig',newline='') as stream:
        writer=csv.DictWriter(stream,fieldnames=fields);writer.writeheader();writer.writerows(rows)
    payload={'version':'AeroSense-v2-PCB-audit-2026-10-14',
             'coverage':{'BOM_rows':61,'reference_designators':104,'functional_groups':len(groups)},
             'source_inventory':inventory,'functional_groups':groups,'calculations':calc}
    (HERE/'component-audit.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (HERE/'calculations.json').write_text(json.dumps(calc,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'Validated 61 BOM rows and {len(actual)} references; wrote CSV and JSON.')

if __name__=='__main__':
    main()
