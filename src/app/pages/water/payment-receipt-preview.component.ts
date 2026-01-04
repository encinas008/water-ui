import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WaterBillOutputDto, PaymentReceiptFullDto, PartnerOutputDto } from '../../shared/models/water-system.models';

@Component({
  selector: 'app-payment-receipt-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-receipt-preview.component.html',
  styleUrls: ['./payment-receipt-preview.component.css']
})
export class PaymentReceiptPreviewComponent implements OnInit {
  @Input() receipt: PaymentReceiptFullDto | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() printReceipt = new EventEmitter<void>();

  isLoading = false;

  constructor() { }

  ngOnInit(): void {
    // Receipt data comes from parent component
    if (!this.receipt) {
      this.isLoading = false;
    } else {
      this.sortConcepts();
    }
  }

  ngOnChanges(): void {
    if (this.receipt) {
      this.sortConcepts();
    }
  }

  private sortConcepts(): void {
    if (this.receipt && this.receipt.concepts) {
      this.receipt.concepts.sort((a, b) => {
        const p1 = this.getConceptPriority(a.conceptName);
        const p2 = this.getConceptPriority(b.conceptName);
        return p1 - p2;
      });
    }
  }

  private getConceptPriority(conceptName: string): number {
    const name = conceptName.toUpperCase();
    if (name.includes('TARIFA BÁSICA') || name.includes('TARIFA BASICA')) return 1;
    if (name.includes('APORTE A LA OTB')) return 2;
    if (name.includes('APORTE AL DEPORTE')) return 3;
    if (name.includes('EXCESO') || name.includes('CONSUMO')) return 4;
    if (name.includes('MEETING') || name.includes('REUNIÓN') || name.includes('MULTA: REUNIÓN') || name.includes('MULTA: REUNION')) return 5;
    if (name.includes('JOB') || name.includes('TRABAJO') || name.includes('MULTA: TRABAJO')) return 6;
    if (name.includes('OTROS INGRESOS')) return 7;
    return 99;
  }

  onPrintReceipt(): void {
    this.printReceipt.emit();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${day}-${months[month - 1]}-${year}`;
  }
}
