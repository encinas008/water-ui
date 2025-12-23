import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WaterBillOutputDto, PaymentReceiptFullDto, PartnerOutputDto } from '../../shared/models/water-system.models';

@Component({
  selector: 'app-payment-receipt-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6.5">
      <div class="mb-4 flex justify-between items-center">
        <h3 class="font-medium text-black dark:text-white">Vista Previa del Recibo</h3>
        <button (click)="onClose()" class="text-bodydark hover:text-black">
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div *ngIf="isLoading" class="flex justify-center py-10">
        <div class="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>

      <div *ngIf="!isLoading && receipt" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Recibo: NOTA DE PAGO -->
        <div class="bg-white border-2 border-gray-300 p-6">
          <div class="text-center mb-4">
            <h2 class="text-xl font-bold">SISTEMA DE AGUA POTABLE</h2>
            <p class="text-lg font-semibold">"{{ receipt.communityName }}"</p>
            <p class="text-lg font-bold mt-2">{{ receipt.receiptType }}</p>
          </div>

          <div class="mb-4">
            <div class="text-right mb-2">
              <span class="text-2xl font-bold">{{ receipt.partnerNumber }}</span>
            </div>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div><strong>RECLAMOS:</strong> {{ receipt.partnerIdentificationNumber }}</div>
              <div><strong>FECHA Y HORA DE PAGO:</strong> {{ receipt.paymentDate }}</div>
            </div>
            <div class="mt-2"><strong>NOMBRE:</strong> {{ receipt.partnerName }}</div>
          </div>

          <div class="mb-4 grid grid-cols-2 gap-4 text-sm">
            <div><strong>LECTURA ACT.:</strong> {{ receipt.currentReading | number:'1.2-2' }}</div>
            <div><strong>LECTURA ANT.:</strong> {{ receipt.previousReading | number:'1.2-2' }}</div>
            <div><strong>CONSUMO M3:</strong> {{ receipt.consumptionM3 | number:'1.2-2' }}</div>
            <div><strong>NRO. MEDIDOR:</strong> {{ receipt.meterNumber || '0' }}</div>
          </div>

          <div class="mb-4 border-t border-b py-2">
            <div class="grid grid-cols-3 gap-2 text-sm">
              <div><strong>MES DE PAGO:</strong> {{ receipt.paymentMonth }}</div>
              <div><strong>CÓDIGO:</strong> {{ receipt.paymentMonthCode || '' }}</div>
              <div><strong>Date:</strong> {{ receipt.paymentMonthDate }}</div>
            </div>
          </div>

          <!-- Tabla de Conceptos -->
          <div class="mb-4">
            <table class="w-full text-sm border-collapse">
              <thead>
                <tr class="border-b">
                  <th class="text-left py-2">CONCEPTO</th>
                  <th class="text-left py-2">FECHA ASIGNADA</th>
                  <th class="text-right py-2">IMPORTE (Bs.)</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let concept of receipt.concepts" class="border-b">
                  <td class="py-2">{{ concept.conceptName }}</td>
                  <td class="py-2">{{ formatDate(concept.assignedDate) }}</td>
                  <td class="py-2 text-right">{{ concept.amount | number:'1.2-2' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="text-center border-t-2 pt-4">
            <p class="text-lg font-bold">IMPORTE TOTAL: {{ receipt.totalAmount | number:'1.2-2' }} BS.</p>
            <p class="text-sm mt-1">{{ receipt.totalAmountInWords }}</p>
            <p class="text-xs mt-1">00/100</p>
          </div>
        </div>

        <!-- Recibo: COPIA ARCHIVO -->
        <div class="bg-white border-2 border-gray-300 p-6">
          <div class="text-center mb-4">
            <h2 class="text-xl font-bold">SISTEMA DE AGUA POTABLE</h2>
            <p class="text-lg font-semibold">"{{ receipt.communityName }}"</p>
            <p class="text-lg font-bold mt-2">COPIA ARCHIVO</p>
          </div>

          <div class="mb-4">
            <div class="text-right mb-2">
              <span class="text-2xl font-bold">{{ receipt.partnerNumber }}</span>
            </div>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div><strong>RECLAMOS:</strong> {{ receipt.partnerIdentificationNumber }}</div>
              <div><strong>FECHA Y HORA DE PAGO:</strong> {{ receipt.paymentDate }}</div>
            </div>
            <div class="mt-2"><strong>NOMBRE:</strong> {{ receipt.partnerName }}</div>
          </div>

          <div class="mb-4 grid grid-cols-2 gap-4 text-sm">
            <div><strong>LECTURA ACT.:</strong> {{ receipt.currentReading | number:'1.2-2' }}</div>
            <div><strong>LECTURA ANT.:</strong> {{ receipt.previousReading | number:'1.2-2' }}</div>
            <div><strong>CONSUMO M3:</strong> {{ receipt.consumptionM3 | number:'1.2-2' }}</div>
            <div><strong>NRO. MEDIDOR:</strong> {{ receipt.meterNumber || '0' }}</div>
          </div>

          <div class="mb-4 border-t border-b py-2">
            <div class="grid grid-cols-3 gap-2 text-sm">
              <div><strong>MES DE PAGO:</strong> {{ receipt.paymentMonth }}</div>
              <div><strong>CÓDIGO:</strong> {{ receipt.paymentMonthCode || '' }}</div>
              <div><strong>Date:</strong> {{ receipt.paymentMonthDate }}</div>
            </div>
          </div>

          <!-- Tabla de Conceptos -->
          <div class="mb-4">
            <table class="w-full text-sm border-collapse">
              <thead>
                <tr class="border-b">
                  <th class="text-left py-2">CONCEPTO</th>
                  <th class="text-left py-2">FECHA ASIGNA...</th>
                  <th class="text-right py-2">IMPORTE (Bs.)</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let concept of receipt.concepts" class="border-b">
                  <td class="py-2">{{ concept.conceptName }}</td>
                  <td class="py-2">{{ formatDate(concept.assignedDate) }}</td>
                  <td class="py-2 text-right">{{ concept.amount | number:'1.2-2' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="text-center border-t-2 pt-4">
            <p class="text-lg font-bold">IMPORTE TOTAL: {{ receipt.totalAmount | number:'1.2-2' }} BS.</p>
            <p class="text-sm mt-1">{{ receipt.totalAmountInWords }}</p>
            <p class="text-xs mt-1">00/100</p>
          </div>

          <div class="mt-4 text-center">
            <button (click)="onClose()" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded">
              CANCELAR
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PaymentReceiptPreviewComponent implements OnInit {
  @Input() bill!: WaterBillOutputDto;
  @Input() partner?: PartnerOutputDto | null;
  @Input() receiptType: string = 'NOTA DE PAGO';
  @Output() close = new EventEmitter<void>();

  receipt: PaymentReceiptFullDto | null = null;
  isLoading = false;

  constructor() {}

  ngOnInit(): void {
    // Por ahora, generar recibo desde la factura (sin pago aún)
    // En el futuro, esto se generará después de procesar el pago
    this.generateReceiptFromBill();
  }

  generateReceiptFromBill(): void {
    // Generar recibo desde la factura (sin pago aún)
    if (!this.bill) {
      this.isLoading = false;
      return;
    }

    // Formatear fecha de pago (usar fecha actual)
    const now = new Date();
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const paymentDate = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} ${String(now.getDate()).padStart(2, '0')}-${months[now.getMonth()]}-${now.getFullYear()}`;

    // Obtener mes de pago
    const billDate = new Date(this.bill.billingPeriodEnd);
    const paymentMonth = months[billDate.getMonth()].toUpperCase();
    const paymentMonthDate = `${String(billDate.getDate()).padStart(2, '0')}-${months[billDate.getMonth()]}-${billDate.getFullYear()}`;

    // Obtener número del socio desde waterConnectionNumber
    const partnerNumber = this.bill.waterConnectionNumber?.split('-').pop() || '';

    // Convertir total a palabras (simplificado)
    const totalInWords = this.numberToWords(this.bill.totalAmount);

    this.receipt = {
      receiptNumber: this.bill.billNumber,
      receiptType: this.receiptType,
      partnerNumber: partnerNumber,
      partnerName: this.bill.partnerName,
      partnerIdentificationNumber: this.partner?.partnerIdentificationNumber || '',
      paymentDate: paymentDate,
      currentReading: this.bill.currentReading || 0,
      previousReading: this.bill.previousReading || 0,
      consumptionM3: this.bill.consumptionM3,
      meterNumber: this.partner?.waterMeterNumber,
      paymentMonth: paymentMonth,
      paymentMonthCode: undefined,
      paymentMonthDate: paymentMonthDate,
      concepts: this.bill.concepts || [],
      totalAmount: this.bill.totalAmount,
      totalAmountInWords: totalInWords,
      communityName: 'COMUNIDAD GUADALUPE'
    };

    this.isLoading = false;
  }

  numberToWords(amount: number): string {
    const wholePart = Math.floor(amount);
    const cents = Math.round((amount - wholePart) * 100);
    
    const wholeWords = this.convertNumberToWords(wholePart);
    const centsWords = cents > 0 ? ` con ${this.convertNumberToWords(cents)} centavos` : '';
    
    return `Son ${wholeWords} Bolivianos${centsWords}.`;
  }

  convertNumberToWords(number: number): string {
    if (number === 0) return 'Cero';
    if (number < 20) {
      const words = ['', 'Uno', 'Dos', 'Tres', 'Cuatro', 'Cinco', 'Seis', 'Siete', 'Ocho', 'Nueve',
                     'Diez', 'Once', 'Doce', 'Trece', 'Catorce', 'Quince', 'Dieciséis', 'Diecisiete', 'Dieciocho', 'Diecinueve'];
      return words[number];
    }
    if (number < 100) {
      const tens = Math.floor(number / 10);
      const ones = number % 10;
      const tensWords = ['', '', 'Veinte', 'Treinta', 'Cuarenta', 'Cincuenta', 'Sesenta', 'Setenta', 'Ochenta', 'Noventa'];
      return ones > 0 ? `${tensWords[tens]} y ${this.convertNumberToWords(ones).toLowerCase()}` : tensWords[tens];
    }
    if (number < 1000) {
      const hundreds = Math.floor(number / 100);
      const remainder = number % 100;
      const hundredsWords = ['', 'Cien', 'Doscientos', 'Trescientos', 'Cuatrocientos', 'Quinientos', 
                            'Seiscientos', 'Setecientos', 'Ochocientos', 'Novecientos'];
      return remainder > 0 ? `${hundredsWords[hundreds]} ${this.convertNumberToWords(remainder).toLowerCase()}` : hundredsWords[hundreds];
    }
    return number.toString();
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

  onClose(): void {
    this.close.emit();
  }
}

