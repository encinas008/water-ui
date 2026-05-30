import { Routes } from '@angular/router';
import { EcommerceComponent } from './pages/dashboard/ecommerce/ecommerce.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { FormElementsComponent } from './pages/forms/form-elements/form-elements.component';
import { BasicTablesComponent } from './pages/tables/basic-tables/basic-tables.component';
import { BlankComponent } from './pages/blank/blank.component';
import { NotFoundComponent } from './pages/other-page/not-found/not-found.component';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';
import { InvoicesComponent } from './pages/invoices/invoices.component';
import { LineChartComponent } from './pages/charts/line-chart/line-chart.component';
import { BarChartComponent } from './pages/charts/bar-chart/bar-chart.component';
import { AlertsComponent } from './pages/ui-elements/alerts/alerts.component';
import { AvatarElementComponent } from './pages/ui-elements/avatar-element/avatar-element.component';
import { BadgesComponent } from './pages/ui-elements/badges/badges.component';
import { ButtonsComponent } from './pages/ui-elements/buttons/buttons.component';
import { ImagesComponent } from './pages/ui-elements/images/images.component';
import { VideosComponent } from './pages/ui-elements/videos/videos.component';
import { SignInComponent } from './pages/auth-pages/sign-in/sign-in.component';
import { SignUpComponent } from './pages/auth-pages/sign-up/sign-up.component';
import { CalenderComponent } from './pages/calender/calender.component';
import { AddPartnerComponent } from './pages/partners/add-partner.component';
import { PartnersListComponent } from './pages/partners/partners-list.component';
import { PartnerDetailComponent } from './pages/partners/partner-detail.component';
import { JobsListComponent } from './pages/jobs/jobs-list.component';
import { AddJobComponent } from './pages/jobs/add-job.component';
import { MeetingsListComponent } from './pages/meetings/meetings-list.component';
import { AddMeetingComponent } from './pages/meetings/add-meeting.component';

// Water System Components
import { WaterDashboardComponent } from './pages/water/water-dashboard.component';
import { ReadingsListComponent } from './pages/water/readings-list.component';
import { AddReadingComponent } from './pages/water/add-reading.component';
import { BillsListComponent } from './pages/water/bills-list.component';
import { GenerateBillsComponent } from './pages/water/generate-bills.component';
import { AddPaymentComponent } from './pages/water/add-payment.component';
import { PartnerPaymentsComponent } from './pages/water/partner-payments.component';
import { DebtorsReportComponent } from './pages/water/debtors-report.component';

// Cash Balance Components
import { CashBalancesListComponent } from './pages/cash-balance/cash-balances-list.component';
import { OpenCashBalanceComponent } from './pages/cash-balance/open-cash-balance.component';
import { CashBalanceDetailsComponent } from './pages/cash-balance/cash-balance-details.component';
import { AddWithdrawalComponent } from './pages/cash-balance/add-withdrawal.component';
import { AddIncomeComponent } from './pages/cash-balance/add-income.component';
import { WithdrawalsListComponent } from './pages/cash-balance/withdrawals-list.component';

export const routes: Routes = [
  {
    path: '',
    component: AppLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: '/signin',
        pathMatch: 'full'
      },
      {
        path: 'calendar',
        component: CalenderComponent,
        title: 'Angular Calender | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'profile',
        component: ProfileComponent,
        title: 'Angular Profile Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'form-elements',
        component: FormElementsComponent,
        title: 'Angular Form Elements Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'basic-tables',
        component: BasicTablesComponent,
        title: 'Angular Basic Tables Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'blank',
        component: BlankComponent,
        title: 'Angular Blank Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      // support tickets
      {
        path: 'invoice',
        component: InvoicesComponent,
        title: 'Angular Invoice Details Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'line-chart',
        component: LineChartComponent,
        title: 'Angular Line Chart Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'bar-chart',
        component: BarChartComponent,
        title: 'Angular Bar Chart Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'alerts',
        component: AlertsComponent,
        title: 'Angular Alerts Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'avatars',
        component: AvatarElementComponent,
        title: 'Angular Avatars Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'badge',
        component: BadgesComponent,
        title: 'Angular Badges Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'buttons',
        component: ButtonsComponent,
        title: 'Angular Buttons Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'images',
        component: ImagesComponent,
        title: 'Angular Images Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'videos',
        component: VideosComponent,
        title: 'Angular Videos Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'add-partner',
        component: AddPartnerComponent,
        title: 'Crear Partner | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'partners',
        component: PartnersListComponent,
        title: 'Lista de Socios | Sistema'
      },
      {
        path: 'partners/:id',
        component: PartnerDetailComponent,
        title: 'Detalles del Socio | Sistema'
      },
      {
        path: 'partners/edit/:id',
        component: AddPartnerComponent,
        title: 'Editar Socio | Sistema'
      },
      {
        path: 'jobs',
        component: JobsListComponent,
        title: 'Administración de Trabajos | Sistema'
      },
      {
        path: 'jobs/add',
        component: AddJobComponent,
        title: 'Nuevo Trabajo | Sistema'
      },
      {
        path: 'jobs/edit/:id',
        component: AddJobComponent,
        title: 'Editar Trabajo | Sistema'
      },
      {
        path: 'jobs/:id/attendance',
        loadComponent: () => import('./pages/jobs/job-attendance.component').then(m => m.JobAttendanceComponent),
        title: 'Asistencia de Socios | Sistema'
      },
      {
        path: 'meetings',
        component: MeetingsListComponent,
        title: 'Administración de Reuniones | Sistema'
      },
      {
        path: 'meetings/add',
        component: AddMeetingComponent,
        title: 'Nueva Reunión | Sistema'
      },
      {
        path: 'meetings/edit/:id',
        component: AddMeetingComponent,
        title: 'Editar Reunión | Sistema'
      },
      {
        path: 'meetings/:id/attendance',
        loadComponent: () => import('./pages/meetings/meeting-attendance.component').then(m => m.MeetingAttendanceComponent),
        title: 'Asistencia de Reunión | Sistema'
      },
      // Water System Routes
      {
        path: 'water-dashboard',
        component: WaterDashboardComponent,
        title: 'Dashboard de Cobranza | Sistema de Agua'
      },
      {
        path: 'water-readings',
        component: ReadingsListComponent,
        title: 'Lecturas de Medidor | Sistema de Agua'
      },
      {
        path: 'water-readings/add',
        component: AddReadingComponent,
        title: 'Nueva Lectura | Sistema de Agua'
      },
      {
        path: 'water-bills',
        component: BillsListComponent,
        title: 'Efectuar Cobro | Sistema de Agua'
      },
      {
        path: 'water-bills/generate',
        component: GenerateBillsComponent,
        title: 'Generar Facturas | Sistema de Agua'
      },
      {
        path: 'water-payments/add',
        component: AddPaymentComponent,
        title: 'Registrar Pago | Sistema de Agua'
      },
      {
        path: 'water-payments/partner',
        component: PartnerPaymentsComponent,
        title: 'Cobros por Socio | Sistema de Agua'
      },
      {
        path: 'reports/debtors',
        component: DebtorsReportComponent,
        title: 'Reporte de Deudores | Sistema de Agua'
      },
      {
        path: 'reports/monthly-bills',
        loadComponent: () => import('./pages/water/monthly-bills-report.component').then(m => m.MonthlyBillsReportComponent),
        title: 'Reporte Mensual de Facturas | Sistema de Agua'
      },
      {
        path: 'reports/cutoff-candidates',
        loadComponent: () => import('./pages/water/cutoff-report.component').then(m => m.CutoffReportComponent),
        title: 'Candidatos a Corte | Sistema de Agua'
      },
      {
        path: 'reports/movements',
        loadComponent: () => import('./pages/water/daily-movements-report.component').then(m => m.DailyMovementReportComponent),
        title: 'Movimientos por Fecha | Sistema de Agua'
      },
      {
        path: 'reports/readings',
        loadComponent: () => import('./pages/water/monthly-readings-report.component').then(m => m.MonthlyReadingsReportComponent),
        title: 'Lecturas por Mes | Sistema de Agua'
      },
      {
        path: 'reports/missing-readings',
        loadComponent: () => import('./pages/water/missing-readings-report.component').then(m => m.MissingReadingsReportComponent),
        title: 'Lecturas Faltantes | Sistema de Agua'
      },
      {
        path: 'reports/reading-observations',
        loadComponent: () => import('./pages/water/reading-observations-report.component').then(m => m.ReadingObservationsReportComponent),
        title: 'Observaciones de Lecturas | Sistema de Agua'
      },
      {
        path: 'reports/partners-status',
        loadComponent: () => import('./pages/water/partner-status-report.component').then(m => m.PartnerStatusReportComponent),
        title: 'Estado de Socios | Sistema de Agua'
      },
      {
        path: 'reports/excess-consumption',
        loadComponent: () => import('./pages/water/excess-consumption-report.component').then(m => m.ExcessConsumptionReportComponent),
        title: 'Exceso de Consumo | Sistema de Agua'
      },
      // Cash Balance Routes
      {
        path: 'cash-balances',
        component: CashBalancesListComponent,
        title: 'Balances de Caja | Sistema'
      },
      {
        path: 'cash-balances/open',
        component: OpenCashBalanceComponent,
        title: 'Abrir Balance de Caja | Sistema'
      },
      {
        path: 'cash-balances/withdrawal',
        component: AddWithdrawalComponent,
        title: 'Registrar Retiro | Sistema'
      },
      {
        path: 'cash-balances/income',
        component: AddIncomeComponent,
        title: 'Registrar Ingreso | Sistema'
      },
      {
        path: 'cash-balances/withdrawals',
        component: WithdrawalsListComponent,
        title: 'Lista de Retiros | Sistema'
      },
      {
        path: 'cash-balances/:id',
        component: CashBalanceDetailsComponent,
        title: 'Detalles del Balance | Sistema'
      },
      // Users
      {
        path: 'users',
        loadComponent: () => import('./pages/users/users-list.component').then(m => m.UsersListComponent),
        title: 'Usuarios | Sistema'
      },
      {
        path: 'users/add',
        loadComponent: () => import('./pages/users/add-user.component').then(m => m.AddUserComponent),
        title: 'Nuevo Usuario | Sistema'
      },
      {
        path: 'users/edit/:id',
        loadComponent: () => import('./pages/users/add-user.component').then(m => m.AddUserComponent),
        title: 'Editar Usuario | Sistema'
      },
      // Roles
      {
        path: 'roles',
        loadComponent: () => import('./pages/roles/role-list/role-list.component').then(m => m.RoleListComponent),
        title: 'Lista de Roles | Sistema'
      },
      {
        path: 'roles/add',
        loadComponent: () => import('./pages/roles/role-form/role-form.component').then(m => m.RoleFormComponent),
        title: 'Nuevo Rol | Sistema'
      },
      {
        path: 'roles/edit/:id',
        loadComponent: () => import('./pages/roles/role-form/role-form.component').then(m => m.RoleFormComponent),
        title: 'Editar Rol | Sistema'
      },
      // Settings
      {
        path: 'settings/billing-config',
        loadComponent: () => import('./pages/settings/billing-config.component').then(m => m.BillingConfigComponent),
        title: 'Configuración de Facturación | Sistema'
      },
    ]
  },
  // auth pages
  {
    path: 'signin',
    component: SignInComponent,
    title: 'Angular Sign In Dashboard | TailAdmin - Angular Admin Dashboard Template'
  },
  {
    path: 'signup',
    component: SignUpComponent,
    title: 'Angular Sign Up Dashboard | TailAdmin - Angular Admin Dashboard Template'
  },
  // error pages
  {
    path: '**',
    component: NotFoundComponent,
    title: 'Angular NotFound Dashboard | TailAdmin - Angular Admin Dashboard Template'
  },
];
