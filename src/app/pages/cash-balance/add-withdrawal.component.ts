import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { CashFlowService } from '../../shared/services/cash-flow.service';
import { CashBalanceService } from '../../shared/services/cash-balance.service';
import { WaterPaymentService } from '../../shared/services/water-payment.service';
import { PartnerService } from '../../shared/services/partner.service';
import { AuthService } from '../../shared/services/auth.service';
import { CashFlowInputDto, CashBalanceOutputDto, PaymentType, CashFlowType } from '../../shared/models/water-system.models';
import { map } from 'rxjs/operators';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-add-withdrawal',
  standalone: true,
  imports: [CommonModule, FormsModule, PageBreadcrumbComponent, ButtonComponent],
  templateUrl: './add-withdrawal.component.html',
  styles: ``
})
export class AddWithdrawalComponent implements OnInit {
  breadcrumbItems = [
    { label: 'Dashboard', link: '/' },
    { label: 'Balances de Caja', link: '/cash-balances' },
    { label: 'Registrar Retiro', link: '/cash-balances/withdrawal' }
  ];

  cashBalanceId = '';
  selectedCashBalance: CashBalanceOutputDto | null = null;
  cashBalanceDetails: any = null; // Para obtener el total disponible
  openCashBalances: CashBalanceOutputDto[] = [];
  amount: number | null = null;
  paymentTypeId = '';
  description = '';
  cashFlowTypeId = ''; // ID del tipo EGRESO
  cashPaymentTypes: PaymentType[] = []; // Solo tipos de pago en efectivo
  isLoadingDetails = false;

  isLoading = false;

  constructor(
    private cashFlowService: CashFlowService,
    private cashBalanceService: CashBalanceService,
    private waterPaymentService: WaterPaymentService,
    private partnerService: PartnerService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadOpenCashBalances();
    this.loadPaymentTypes();
    this.loadCashFlowTypes();
  }

  loadOpenCashBalances(): void {
    const userInfo = this.authService.getUserInfo();
    if (!userInfo || !userInfo.userId) {
      toast.error('No se pudo obtener la información del usuario');
      return;
    }

    this.cashBalanceService.getLastOpenCashBalanceByUser(userInfo.userId).subscribe({
      next: (balances) => {
        this.openCashBalances = balances;
        // Si hay un balance abierto, seleccionarlo automáticamente
        if (balances.length > 0) {
          this.cashBalanceId = balances[0].id;
          this.selectCashBalance();
        }
      },
      error: (error) => {
        console.error('Error al cargar balance de caja abierto:', error);
        toast.error('Error al cargar balances de caja abiertos');
      }
    });
  }

  loadPaymentTypes(): void {
    this.waterPaymentService.getPaymentTypes().subscribe({
      next: (types) => {
        // Filtrar solo tipos de pago en efectivo para retiros
        this.cashPaymentTypes = types.filter(type =>
          type.name.toUpperCase() === 'EFECTIVO' ||
          type.name.toUpperCase() === 'CASH'
        );

        // Si no hay tipos filtrados, usar todos (por si acaso)
        if (this.cashPaymentTypes.length === 0) {
          this.cashPaymentTypes = types;
        }

        // Seleccionar el primero por defecto si hay solo uno
        if (this.cashPaymentTypes.length === 1) {
          this.paymentTypeId = this.cashPaymentTypes[0].id;
        }
      },
      error: (error) => {
        console.error('Error al cargar tipos de pago:', error);
        toast.error('Error al cargar tipos de pago');
      }
    });
  }

  loadCashFlowTypes(): void {
    this.partnerService.getCommons().pipe(
      map(response => {
        const cashFlowTypes = response.cashFlowTypes || [];
        // Buscar el tipo EGRESO
        const egresoType = cashFlowTypes.find((cft: any) =>
          cft.name.toUpperCase() === 'EGRESO' ||
          cft.code.toUpperCase() === 'OUT' ||
          cft.code.toUpperCase() === 'EGRESO'
        );
        if (egresoType) {
          this.cashFlowTypeId = egresoType.id;
        } else {
          console.warn('No se encontró el tipo de flujo EGRESO');
        }
      })
    ).subscribe({
      error: (error) => {
        console.error('Error al cargar tipos de flujo de caja:', error);
      }
    });
  }

  selectCashBalance(): void {
    if (!this.cashBalanceId) {
      this.selectedCashBalance = null;
      this.cashBalanceDetails = null;
      return;
    }

    this.selectedCashBalance = this.openCashBalances.find(b => b.id === this.cashBalanceId) || null;

    // Cargar detalles del balance para obtener el total disponible
    if (this.selectedCashBalance) {
      this.loadCashBalanceDetails();
    }
  }

  loadCashBalanceDetails(): void {
    if (!this.cashBalanceId) return;

    this.isLoadingDetails = true;
    this.cashBalanceService.getCashBalanceDetails(this.cashBalanceId).subscribe({
      next: (details) => {
        this.cashBalanceDetails = details;
        this.isLoadingDetails = false;
      },
      error: (error) => {
        console.error('Error al cargar detalles del balance:', error);
        this.isLoadingDetails = false;
      }
    });
  }

  getMaxWithdrawalAmount(): number {
    if (!this.cashBalanceDetails) {
      // Si aún no se cargaron los detalles, retornar 0
      return 0;
    }
    // El máximo disponible es el totalCashInBox
    return this.cashBalanceDetails.cashBalanceDetails?.totalCashInBox || 0;
  }

  isFormValid(): boolean {
    if (!(
      this.cashBalanceId &&
      this.amount &&
      this.amount > 0 &&
      this.paymentTypeId &&
      this.description.trim() &&
      this.cashFlowTypeId
    )) {
      return false;
    }

    // Validar que el monto no exceda lo disponible en caja
    const maxAmount = this.getMaxWithdrawalAmount();
    if (this.amount > maxAmount) {
      return false;
    }

    return true;
  }

  onSubmit(): void {
    if (!this.isFormValid()) {
      // Validar específicamente si el monto excede lo disponible
      if (this.amount && this.amount > this.getMaxWithdrawalAmount()) {
        toast.error(`El monto del retiro (BOB ${this.amount.toFixed(2)}) no puede ser mayor al disponible en caja (BOB ${this.getMaxWithdrawalAmount().toFixed(2)})`);
      }
      return;
    }

    const userInfo = this.authService.getUserInfo();
    if (!userInfo || !userInfo.userId) {
      toast.error('No se pudo obtener la información del usuario');
      return;
    }

    // Validación adicional antes de enviar
    const maxAmount = this.getMaxWithdrawalAmount();
    if (this.amount && this.amount > maxAmount) {
      toast.error(`El monto del retiro no puede ser mayor al disponible en caja (BOB ${maxAmount.toFixed(2)})`);
      return;
    }

    this.isLoading = true;

    const withdrawal: CashFlowInputDto = {
      paymentTypeId: this.paymentTypeId,
      cashFlowTypeId: this.cashFlowTypeId,
      amount: this.amount!,
      description: this.description.trim(),
      userId: userInfo.userId
    };

    this.cashFlowService.createCashFlow(withdrawal).subscribe({
      next: (response) => {
        this.isLoading = false;
        toast.success('Retiro registrado exitosamente');
        this.router.navigate(['/cash-balances', this.cashBalanceId]);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al registrar retiro:', error);

        let errorMessage = 'Error al registrar el retiro';
        if (error.error) {
          if (typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.error.message) {
            errorMessage = error.error.message;
          }
        }

        toast.error(errorMessage);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/cash-balances']);
  }


}

