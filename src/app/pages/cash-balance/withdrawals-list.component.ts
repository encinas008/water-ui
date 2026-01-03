import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { CashFlowService } from '../../shared/services/cash-flow.service';
import { CashBalanceService } from '../../shared/services/cash-balance.service';
import { CashFlowOutputDto, CashBalanceOutputDto } from '../../shared/models/water-system.models';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-withdrawals-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PageBreadcrumbComponent, ButtonComponent],
  templateUrl: './withdrawals-list.component.html',
  styles: ``
})
export class WithdrawalsListComponent implements OnInit {
  breadcrumbItems = [
    { label: 'Dashboard', link: '/' },
    { label: 'Balances de Caja', link: '/cash-balances' },
    { label: 'Lista de Retiros', link: '/cash-balances/withdrawals' }
  ];

  withdrawals: CashFlowOutputDto[] = [];
  cashBalances: CashBalanceOutputDto[] = [];
  selectedCashBalanceId = '';
  isLoading = false;

  constructor(
    private cashFlowService: CashFlowService,
    private cashBalanceService: CashBalanceService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadCashBalances();
    this.loadWithdrawals();
  }

  loadCashBalances(): void {
    this.cashBalanceService.getAllCashBalances().subscribe({
      next: (data) => {
        this.cashBalances = data.sort((a, b) => {
          const dateA = new Date(a.openTime).getTime();
          const dateB = new Date(b.openTime).getTime();
          return dateB - dateA;
        });
      },
      error: (error) => {
        console.error('Error al cargar balances de caja:', error);
        toast.error('Error al cargar balances de caja');
      }
    });
  }

  loadWithdrawals(): void {
    this.isLoading = true;

    if (this.selectedCashBalanceId) {
      // Cargar retiros de un balance específico
      this.cashFlowService.getWithdrawalsByCashBalance(this.selectedCashBalanceId).subscribe({
        next: (data) => {
          this.withdrawals = data;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al cargar retiros:', error);
          toast.error('Error al cargar retiros');
          this.isLoading = false;
        }
      });
    } else {
      // Cargar retiros de todos los balances
      this.loadAllWithdrawals();
    }
  }

  loadAllWithdrawals(): void {
    // Cargar retiros de todos los balances
    const allWithdrawals: CashFlowOutputDto[] = [];
    let completed = 0;
    const total = this.cashBalances.length;

    if (total === 0) {
      this.withdrawals = [];
      this.isLoading = false;
      return;
    }

    this.cashBalances.forEach(balance => {
      this.cashFlowService.getWithdrawalsByCashBalance(balance.id).subscribe({
        next: (data) => {
          allWithdrawals.push(...data);
          completed++;
          if (completed === total) {
            // Ordenar por fecha descendente
            this.withdrawals = allWithdrawals.sort((a, b) => {
              const dateA = new Date(a.createdAt).getTime();
              const dateB = new Date(b.createdAt).getTime();
              return dateB - dateA;
            });
            this.isLoading = false;
          }
        },
        error: (error) => {
          console.error(`Error al cargar retiros del balance ${balance.id}:`, error);
          completed++;
          if (completed === total) {
            this.withdrawals = allWithdrawals.sort((a, b) => {
              const dateA = new Date(a.createdAt).getTime();
              const dateB = new Date(b.createdAt).getTime();
              return dateB - dateA;
            });
            this.isLoading = false;
          }
        }
      });
    });
  }

  onCashBalanceChange(): void {
    this.loadWithdrawals();
  }

  getTotalAmount(): number {
    return this.withdrawals.reduce((total, withdrawal) => total + withdrawal.amount, 0);
  }

  getAverageAmount(): number {
    if (this.withdrawals.length === 0) return 0;
    return this.getTotalAmount() / this.withdrawals.length;
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }


}



