# Partner logos

Place **licensed, locally hosted** logo files in this folder.

Collaborators & Sponsors appear as reserved logo slots in the footer and on the homepage. Do **not** hotlink external logos. Do **not** invent a mark. Do **not** link the slots to Attributions.

When a licensed file exists, put it inside the matching slot:

```html
<figure class="footer-partners__slot">
  <img src="assets/partners/ist-group.png" alt="iST Group" width="180" height="72">
  <figcaption>iST Group</figcaption>
</figure>
```

Use `alt` = organization name. The hatched placeholder hides automatically when an `<img>` is present.

## Files still required

These organizations are named on the wiki. Logo files are **not** in the repository yet.

| Suggested filename | Organization |
| --- | --- |
| `ist-group.svg` or `ist-group.png` | iST Group |
| `nthu.svg` or `nthu.png` | National Tsing Hua University |

Optional, only after permission or a compatible license is on file:

| Suggested filename | Organization | Note |
| --- | --- | --- |
| `igem.svg` or `igem.png` | iGEM Foundation | Use only with iGEM brand permission |
| `fiti.svg` or `fiti.png` | FITI | Mentorship; confirm logo use |
| `garage-plus.svg` or `garage-plus.png` | NTHU Garage+ | Mentorship; confirm logo use |

Until a file exists, leave the reserved slot empty. Do not add a fake logo.
