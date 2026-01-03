import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { CashBalanceService } from '../../shared/services/cash-balance.service';
import { AuthService } from '../../shared/services/auth.service';
import { CashBalanceOutputDto, PageResponse } from '../../shared/models/water-system.models';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { toast } from 'ngx-sonner';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cash-balances-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PageBreadcrumbComponent, ButtonComponent, ScrollingModule],
  templateUrl: './cash-balances-list.component.html',
  styleUrls: ['./cash-balances-list.component.css']
})
export class CashBalancesListComponent implements OnInit {
  @ViewChild(CdkVirtualScrollViewport) viewport!: CdkVirtualScrollViewport;

  breadcrumbItems = [
    { label: 'Dashboard', link: '/' },
    { label: 'Balances de Caja', link: '/cash-balances' }
  ];

  cashBalances: CashBalanceOutputDto[] = [];
  totalElements: number = 0;

  // Búsqueda
  searchQuery: string = '';
  private searchSubject = new Subject<string>();

  // Paginación
  currentPage: number = 0; // Backend pages are 0-indexed
  pageSize: number = 20;
  totalPages: number = 0;
  isLoadingMore: boolean = false;

  // Estados
  isLoading: boolean = false;
  hasMoreData: boolean = true;
  openBalancesCount: number = 0;

  constructor(
    private cashBalanceService: CashBalanceService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.resetAndLoadCashBalances();
    });
    this.loadCashBalances();
    this.loadOpenBalancesCount();
  }

  loadOpenBalancesCount(): void {
    this.cashBalanceService.getAllOpenCashBalances().subscribe({
      next: (balances) => {
        this.openBalancesCount = balances.length;
      },
      error: (err) => console.error('Error fetching open balances count:', err)
    });
  }

  loadCashBalances(): void {
    this.isLoading = true;
    this.hasMoreData = true;
    this.currentPage = 0; // Start from the first page

    const userInfo = this.authService.getUserInfo();
    const userRole = userInfo?.role?.toUpperCase();
    const userId = userRole === 'CAJERO' ? userInfo?.userId : undefined;

    this.cashBalanceService.getCashBalancesPaginated(this.currentPage, this.pageSize, this.searchQuery, userId).subscribe({
      next: (response: PageResponse<CashBalanceOutputDto>) => {
        this.cashBalances = response.content;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.hasMoreData = !response.last;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar balances de caja:', error);
        toast.error(error.error?.message || 'Error al cargar balances de caja');
        this.isLoading = false;
      }
    });
  }

  loadMoreCashBalances(): void {
    if (this.isLoading || this.isLoadingMore || !this.hasMoreData) {
      return;
    }

    this.isLoadingMore = true;
    this.currentPage++;

    const userInfo = this.authService.getUserInfo();
    const userRole = userInfo?.role?.toUpperCase();
    const userId = userRole === 'CAJERO' ? userInfo?.userId : undefined;

    this.cashBalanceService.getCashBalancesPaginated(this.currentPage, this.pageSize, this.searchQuery, userId).subscribe({
      next: (response: PageResponse<CashBalanceOutputDto>) => {
        this.cashBalances = [...this.cashBalances, ...response.content];
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.hasMoreData = !response.last;
        this.isLoadingMore = false;
      },
      error: (error) => {
        console.error('Error al cargar más balances de caja:', error);
        this.isLoadingMore = false;
      }
    });
  }

  onSearch(): void {
    this.searchSubject.next(this.searchQuery);
  }

  resetAndLoadCashBalances(): void {
    this.cashBalances = [];
    this.currentPage = 0;
    this.totalElements = 0;
    this.totalPages = 0;
    this.hasMoreData = true;
    this.loadCashBalances();
  }

  onScrolledIndexChange(index: number): void {
    // Cargar más datos cuando el usuario se acerca al final de la lista
    if (this.viewport && index > this.cashBalances.length - this.pageSize / 2) {
      this.loadMoreCashBalances();
    }
  }

  getBalanceStatus(balance: CashBalanceOutputDto): string {
    if (balance.active && !balance.closeTime) {
      return 'ABIERTO';
    }
    return 'CERRADO';
  }

  viewDetails(id: string): void {
    this.router.navigate(['/cash-balances', id]);
  }

  closeBalance(id: string): void {
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
        this.executeCloseBalance(id);
      }
    });
  }

  private executeCloseBalance(id: string): void {
    this.cashBalanceService.closeCashBalance({ cashBalanceId: id }).subscribe({
      next: (success) => {
        if (success) {
          toast.success('Balance de caja cerrado exitosamente');
          this.resetAndLoadCashBalances();
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

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }


}

