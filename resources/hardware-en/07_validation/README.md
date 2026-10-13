

|---|---|---|


The plan and questionnaire specify a 5–10-minute trial. The developer prepares empty wells and DEMO. Tasks cover identification, connection, Start, Stop, and CSV export. Mark omitted tasks as untested or not applicable. Keep completed responses separate from the blank form.


- [quick_check.py](../../../hardware%20information/AeroSense%20v2/07_validation/quick_check.py): analyze condition-labelled physical UI session JSON. Use --self-test for synthetic software checks.
- [plot_validation.py](../../../hardware%20information/AeroSense%20v2/07_validation/plot_validation.py), [import_ui_json.py](../../../hardware%20information/AeroSense%20v2/07_validation/import_ui_json.py), and [test_analysis.py](../../../hardware%20information/AeroSense%20v2/07_validation/test_analysis.py): detailed engineering records and analysis checks.
- [templates](../../../hardware%20information/AeroSense%20v2/07_validation/templates): empty CSV files for samples, cells, electronics, optical mapping, fit, flow, reassembly, and user feedback.
- [Fluorescence_Test_References.json](../../../hardware%20information/AeroSense%20v2/07_validation/Fluorescence_Test_References.json): primary references and recipe provenance.
- [requirements.txt](../../../hardware%20information/AeroSense%20v2/07_validation/requirements.txt): analysis dependencies.

Follow the validation plan for exact commands and acceptance criteria. Detailed blank forms do not require repeating every historical test. Analysis creates results only when actual input is supplied. Label DEMO and simulation data clearly. Do not report software self-tests as measurements.


