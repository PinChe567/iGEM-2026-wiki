

|---|---|---|


The developer manual includes assembly illustrations, design limits, and the supplier checklist. No separate legacy Word or duplicate assembly report is required. Preserve accepted changes in Markdown before rebuilding.


Run from the package root:

```text
python 04_manuals/build_pdfs.py
```

This builds the four main manuals and six experiment/questionnaire PDFs. Use --roles for the four main manuals. Use --validation-only for the six supporting PDFs. Use --files followed by specific Markdown paths for selected documents. No simulation is rerun.

After rebuilding, render the changed PDFs with verify_pdf_layout.py. Review every page. The renderer writes contact sheets and a pending review record to the operating-system temporary folder. Rendering alone does not establish visual review.
