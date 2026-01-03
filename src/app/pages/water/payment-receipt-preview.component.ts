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
    }
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
