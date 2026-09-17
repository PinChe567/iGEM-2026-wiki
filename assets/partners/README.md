# Partner logos

Place **licensed, locally hosted** logo files in this folder.

The homepage Collaborators & Sponsors strip (`index.html` → `.home-partners__logos`) only renders an `<img>` when the file exists here. Do **not** hotlink external logos. Do **not** invent a mark.

Each real logo should be wrapped as:

```html
<a class="home-partners__logo" href="attributions.html#attr-ist-group">
  <img src="assets/partners/ist-group.png" alt="iST Group" width="180" height="72">
</a>
```

Use `alt` = organization name. Link to the attributions entry when one exists.

## Files still required

These organizations are named on the wiki. Logo files are **not** in the repository yet.

| Suggested filename | Organization | Attribution / credit |
| --- | --- | --- |
| `ist-group.svg` or `ist-group.png` | iST Group | `attributions.html#attr-ist-group` |
| `nthu.svg` or `nthu.png` | National Tsing Hua University | Institutional home of NTHU iGEM 2026 |

Optional, only after permission or a compatible license is on file:

| Suggested filename | Organization | Note |
| --- | --- | --- |
| `igem.svg` or `igem.png` | iGEM Foundation | Use only with iGEM brand permission |
| `fiti.svg` or `fiti.png` | FITI | Mentorship; confirm logo use |
| `garage-plus.svg` or `garage-plus.png` | NTHU Garage+ | Mentorship; confirm logo use |

Until a file exists, leave it out of `index.html`.
