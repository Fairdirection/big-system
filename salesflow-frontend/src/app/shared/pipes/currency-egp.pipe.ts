import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'currencyEgp', standalone: true, pure: true })
export class CurrencyEgpPipe implements PipeTransform {
  transform(value: string | number | null | undefined): string {
    if (value == null || value === '') return '—';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '—';

    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  }

}
