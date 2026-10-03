export type ShellBrand = {
  title: string;
  subtitle: string;
  homeHref: string;
  homeAriaLabel: string;
};

export type ShellStrings = {
  brand: ShellBrand;
  footerMark: string;
  footerTagline: string;
  langZh: string;
  langEn: string;
  langSwitchAria: string;
};

export function brandMarkup(brand: ShellBrand): string {
  return `
    <a class="brand" href="${brand.homeHref}" aria-label="${brand.homeAriaLabel}">
      <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      <span>
        <strong>${brand.title}</strong>
        <small>${brand.subtitle}</small>
      </span>
    </a>
  `;
}

export function langSwitchMarkup(active: 'zh-Hant' | 'en', labels: Pick<ShellStrings, 'langZh' | 'langEn' | 'langSwitchAria'>): string {
  return `
    <div class="lang-switch" role="group" aria-label="${labels.langSwitchAria}">
      <button type="button" data-locale="zh-Hant" aria-pressed="${active === 'zh-Hant'}">${labels.langZh}</button>
      <button type="button" data-locale="en" aria-pressed="${active === 'en'}">${labels.langEn}</button>
    </div>
  `;
}

export function footerMarkup(strings: Pick<ShellStrings, 'footerMark' | 'footerTagline'>): string {
  return `
    <footer class="page-footer">
      <span>${strings.footerMark}</span>
      <p>${strings.footerTagline}</p>
    </footer>
  `;
}
