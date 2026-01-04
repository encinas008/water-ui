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
import { CashFlowInputDto, CashBalanceOutputDto, PaymentType } from '../../shared/models/water-system.models';
import { map } from 'rxjs/operators';
import { NumberLimitDirective } from '../../shared/directives/number-limit.directive';
import { toast } from 'ngx-sonner';

@Component({
    selector: 'app-add-income',
    standalone: true,
    imports: [CommonModule, FormsModule, PageBreadcrumbComponent, ButtonComponent, NumberLimitDirective],
    templateUrl: './add-income.component.html',
    styles: ``
})
export class AddIncomeComponent implements OnInit {
    breadcrumbItems = [
        { label: 'Dashboard', link: '/' },
        { label: 'Balances de Caja', link: '/cash-balances' },
        { label: 'Registrar Ingreso', link: '/cash-balances/income' }
    ];

    cashBalanceId = '';
    selectedCashBalance: CashBalanceOutputDto | null = null;
    cashBalanceDetails: any = null;
    openCashBalances: CashBalanceOutputDto[] = [];
    amount: number | null = null;
    paymentTypeId = '';
    description = '';
    cashFlowTypeId = ''; // ID del tipo INGRESO
    cashPaymentTypes: PaymentType[] = []; // Solo tipos de pago en efectivo
    isLoadingDetails = false;
    isLoading = false;
    isAdmin = false;

    constructor(
        private cashFlowService: CashFlowService,
        private cashBalanceService: CashBalanceService,
        private waterPaymentService: WaterPaymentService,
        private partnerService: PartnerService,
        private authService: AuthService,
        private router: Router
    ) { }

    ngOnInit(): void {
        const userInfo = this.authService.getUserInfo();
        this.isAdmin = userInfo?.role?.toUpperCase() === 'ADMINISTRADOR';

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

        const obs = this.isAdmin
            ? this.cashBalanceService.getAllOpenCashBalances()
            : this.cashBalanceService.getLastOpenCashBalanceByUser(userInfo.userId);

        obs.subscribe({
            next: (balances) => {
                this.openCashBalances = balances;
                // Si hay un solo balance, seleccionarlo automáticamente
                if (balances.length === 1) {
                    this.cashBalanceId = balances[0].id;
                    this.selectCashBalance();
                }
            },
            error: (error) => {
                console.error('Error al cargar balances de caja abiertos:', error);
                toast.error('Error al cargar balances de caja abiertos');
            }
        });
    }

    loadPaymentTypes(): void {
        this.waterPaymentService.getPaymentTypes().subscribe({
            next: (types) => {
                this.cashPaymentTypes = types;

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
                // Buscar el tipo INGRESO
                const ingresoType = cashFlowTypes.find((cft: any) =>
                    cft.name.toUpperCase() === 'INGRESO' ||
                    cft.code.toUpperCase() === 'IN' ||
                    cft.code.toUpperCase() === 'INGRESO'
                );
                if (ingresoType) {
                    this.cashFlowTypeId = ingresoType.id;
                } else {
                    console.warn('No se encontró el tipo de flujo INGRESO');
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

    isFormValid(): boolean {
        return !!(
            this.cashBalanceId &&
            this.amount &&
            this.amount > 0 &&
            this.paymentTypeId &&
            this.description.trim() &&
            this.cashFlowTypeId
        );
    }

    onSubmit(): void {
        if (!this.isFormValid()) {
            return;
        }

        const userInfo = this.authService.getUserInfo();
        if (!userInfo || !userInfo.userId) {
            toast.error('No se pudo obtener la información del usuario');
            return;
        }

        this.isLoading = true;

        const income: CashFlowInputDto = {
            paymentTypeId: this.paymentTypeId,
            cashFlowTypeId: this.cashFlowTypeId,
            amount: this.amount!,
            description: this.description.trim(),
            userId: userInfo.userId,
            cashBalanceId: this.cashBalanceId
        };

        this.cashFlowService.createCashFlow(income).subscribe({
            next: (response) => {
                this.isLoading = false;
                toast.success('Ingreso registrado exitosamente');
                this.router.navigate(['/cash-balances', this.cashBalanceId]);
            },
            error: (error) => {
                this.isLoading = false;
                console.error('Error al registrar ingreso:', error);

                let errorMessage = 'Error al registrar el ingreso';
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
