import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { CashBalanceService } from '../../shared/services/cash-balance.service';
import { CashBalanceDetailsOutputDto } from '../../shared/models/water-system.models';
import { toast } from 'ngx-sonner';

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
  isLoading = false;
  balanceId: string = '';

  constructor(
    private cashBalanceService: CashBalanceService,
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
      },
      error: (error) => {
        console.error('Error al cargar detalles del balance:', error);
        toast.error(error.error?.message || 'Error al cargar los detalles del balance');
        this.isLoading = false;
      }
    });
  }

  closeBalance(): void {
    if (!confirm('¿Está seguro de que desea cerrar este balance de caja?')) {
      return;
    }

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


}

