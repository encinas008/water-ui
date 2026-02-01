import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { CashBalanceService } from '../../shared/services/cash-balance.service';
import { WaterPaymentService } from '../../shared/services/water-payment.service';
import { CashBalanceDetailsOutputDto, CashBalanceMovementsOutputDto } from '../../shared/models/water-system.models';
import { toast } from 'ngx-sonner';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cash-balance-details',
  standalone: true,
  imports: [CommonModule, PageBreadcrumbComponent, ButtonComponent],
  templateUrl: './cash-balance-details.component.html',
  styles: ``
})
export class CashBalanceDetailsComponent implements OnInit {
  breadcrumbItems = [
    { label: 'Dashboard', link: '/' },
    { label: 'Balances de Caja', link: '/cash-balances' },
    { label: 'Detalles', link: '' }
  ];

  cashBalanceDetails: CashBalanceDetailsOutputDto | null = null;
  movementsData: CashBalanceMovementsOutputDto | null = null;
  isLoading = false;
  isLoadingMovements = false;
  showMovements = false;
  balanceId: string = '';

  constructor(
    private cashBalanceService: CashBalanceService,
    private waterPaymentService: WaterPaymentService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.balanceId = params['id'];
      if (this.balanceId) {
        this.loadCashBalanceDetails();
      }
    });
  }

  loadCashBalanceDetails(): void {
    this.isLoading = true;
    this.cashBalanceService.getCashBalanceDetails(this.balanceId).subscribe({
      next: (data) => {
        this.cashBalanceDetails = data;
        this.isLoading = false;
        // Cargamos movimientos por defecto si se desea o bajo demanda
        this.loadCashBalanceMovements();
      },
      error: (error) => {
        console.error('Error al cargar detalles del balance:', error);
        toast.error(error.error?.message || 'Error al cargar los detalles del balance');
        this.isLoading = false;
      }
    });
  }

  loadCashBalanceMovements(): void {
    this.isLoadingMovements = true;
    this.cashBalanceService.getCashBalanceMovements(this.balanceId).subscribe({
      next: (data) => {
        this.movementsData = data;
        this.isLoadingMovements = false;
      },
      error: (error) => {
        console.error('Error al cargar movimientos:', error);
        toast.error('Error al cargar la lista de movimientos');
        this.isLoadingMovements = false;
      }
    });
  }

  toggleMovements(): void {
    this.showMovements = !this.showMovements;
  }

  closeBalance(): void {

    Swal.fire({
      title: '¿Cerrar Balance de Caja?',
      text: 'Una vez cerrado, no podrá registrar más movimientos en este balance.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f43f5e', // rose-500
      cancelButtonColor: '#64748b', // slate-500
      confirmButtonText: 'Sí, cerrar balance',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      customClass: {
        container: 'my-swal'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.executeCloseBalance();
      }
    });
  }

  private executeCloseBalance(): void {
    this.cashBalanceService.closeCashBalance({ cashBalanceId: this.balanceId }).subscribe({
      next: (success) => {
        if (success) {
          toast.success('Balance de caja cerrado exitosamente');
          this.loadCashBalanceDetails();
        } else {
          toast.error('Error al cerrar el balance de caja');
        }
      },
      error: (error) => {
        console.error('Error al cerrar balance:', error);
        toast.error(error.error?.message || 'Error al cerrar el balance de caja');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/cash-balances']);
  }

  printMovement(movement: any): void {
    if (movement.category === 'MANUAL') {
      this.waterPaymentService.downloadCashFlowReceiptPdf(movement.id).then(() => {
        toast.success('Comprobante generado correctamente');
      }).catch(error => {
        toast.error('Error al generar el comprobante');
      });
    } else if (movement.reference) {
      // Si es cobranza, intentamos imprimir el recibo de pago normal usando la referencia (que es el nro de recibo o mejor el paymentId si lo tuviéramos)
      // Pero el DTO de movimientos no parece tener el paymentId directamente, sino el reference (recibo).
      // Habría que ver si podemos obtener el paymentId.
      toast.info('Para pagos de agua, use la sección de Registros de Cobranza para reimprimir.');
    }
  }


}

