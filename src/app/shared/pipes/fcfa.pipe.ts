import { Pipe, PipeTransform } from '@angular/core';

export function formatFCFA(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '0 FCFA';
  }
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) {
    return '0 FCFA';
  }
  // Formater avec espace pour les milliers (Standard Mali / UEMOA)
  const formatted = Math.round(num)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} FCFA`;
}

@Pipe({
  name: 'fcfa',
  standalone: true
})
export class FcfaPipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    return formatFCFA(value);
  }
}
