import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { CashBalanceService } from '../../shared/services/cash-balance.service';
import { AuthService } from '../../shared/services/auth.service';
import { CashBalanceInputDto } from '../../shared/models/water-system.models';
import { NumberLimitDirective } from '../../shared/directives/number-limit.directive';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-open-cash-balance',
  standalone: true,
  imports: [CommonModule, FormsModule, PageBreadcrumbComponent, ButtonComponent, NumberLimitDirective],
  templateUrl: './open-cash-balance.component.html',
  styles: ``
})
export class OpenCashBalanceComponent implements OnInit {
  breadcrumbItems = [
    { label: 'Dashboard', link: '/' },
    { label: 'Balances de Caja', link: '/cash-balances' },
    { label: 'Abrir Balance', link: '/cash-balances/open' }
  ];

  moneyToOpenCashBalance: number | null = null;
  userInfo: any = null;
  isLoading = false;

  constructor(
    private cashBalanceService: CashBalanceService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.userInfo = this.authService.getUserInfo();
    if (!this.userInfo || !this.userInfo.userId) {
      toast.error('No se pudo obtener la información del usuario');
      this.router.navigate(['/cash-balances']);
    }
  }

  isFormValid(): boolean {
    return (this.moneyToOpenCashBalance !== null && this.moneyToOpenCashBalance >= 0 && !!this.userInfo?.userId);
  }

  onSubmit(): void {
    this.isLoading = true;
    if (!this.isFormValid()) {
      this.isLoading = false;
      return;
    }

    const cashBalanceInput: CashBalanceInputDto = {
      moneyToOpenCashBalance: this.moneyToOpenCashBalance!,
      userId: this.userInfo.userId
    };

    this.cashBalanceService.createCashBalance(cashBalanceInput).subscribe({
      next: (response) => {
        this.isLoading = false;
        toast.success('Balance de caja abierto exitosamente');
        this.router.navigate(['/cash-balances', response.id]);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al abrir balance de caja:', error);

        // El backend devuelve el mensaje directamente en error.error para BadRequestException
        let errorMessage = 'Error al abrir el balance de caja';
        if (error.error) {
          // Si error.error es un string, usarlo directamente
          if (typeof error.error === 'string') {
            errorMessage = error.error;
          }
          // Si error.error es un objeto con message, usar message
          else if (error.error.message) {
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

