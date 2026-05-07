import { Pipe, PipeTransform, inject } from '@angular/core';
import { SettingService } from '@core/services/setting.service';

@Pipe({ name: 'currencyEgp', standalone: true, pure: false })
export class CurrencyEgpPipe implements PipeTransform {
  private settingService = inject(SettingService);

  transform(value: string | number | null | undefined): string {
    if (value == null || value === '') return '—';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '—';

    const currency = this.settingService.preferredCurrency();
    const lang = this.settingService.preferredLanguage();

    if (lang === 'ar') {
      const formattedNum = new Intl.NumberFormat('ar-EG', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(num);
      return currency === 'USD' ? `${formattedNum} $` : `${formattedNum} ج.م`;
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(num);
    }
  }
}
