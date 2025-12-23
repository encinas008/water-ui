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

// Cash Balance Components
import { CashBalancesListComponent } from './pages/cash-balance/cash-balances-list.component';
import { OpenCashBalanceComponent } from './pages/cash-balance/open-cash-balance.component';
import { CashBalanceDetailsComponent } from './pages/cash-balance/cash-balance-details.component';

export const routes: Routes = [
  {
    path:'',
    component:AppLayoutComponent,
    children:[
      {
        path: '',
        component: EcommerceComponent,
        pathMatch: 'full',
        title:
          'Angular Ecommerce Dashboard | TailAdmin - Angular Admin Dashboard Template',
      },
      {
        path:'calendar',
        component:CalenderComponent,
        title:'Angular Calender | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'profile',
        component:ProfileComponent,
        title:'Angular Profile Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'form-elements',
        component:FormElementsComponent,
        title:'Angular Form Elements Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'basic-tables',
        component:BasicTablesComponent,
        title:'Angular Basic Tables Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'blank',
        component:BlankComponent,
        title:'Angular Blank Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      // support tickets
      {
        path:'invoice',
        component:InvoicesComponent,
        title:'Angular Invoice Details Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'line-chart',
        component:LineChartComponent,
        title:'Angular Line Chart Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'bar-chart',
        component:BarChartComponent,
        title:'Angular Bar Chart Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'alerts',
        component:AlertsComponent,
        title:'Angular Alerts Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'avatars',
        component:AvatarElementComponent,
        title:'Angular Avatars Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'badge',
        component:BadgesComponent,
        title:'Angular Badges Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'buttons',
        component:ButtonsComponent,
        title:'Angular Buttons Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'images',
        component:ImagesComponent,
        title:'Angular Images Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'videos',
        component:VideosComponent,
        title:'Angular Videos Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'add-partner',
        component:AddPartnerComponent,
        title:'Crear Partner | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'partners',
        component:PartnersListComponent,
        title:'Lista de Partners | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'jobs',
        component:JobsListComponent,
        title:'Administración de Trabajos | Sistema'
      },
      {
        path:'jobs/add',
        component:AddJobComponent,
        title:'Nuevo Trabajo | Sistema'
      },
      {
        path:'jobs/edit/:id',
        component:AddJobComponent,
        title:'Editar Trabajo | Sistema'
      },
      {
        path:'jobs/:id/attendance',
        loadComponent: () => import('./pages/jobs/job-attendance.component').then(m => m.JobAttendanceComponent),
        title:'Asistencia de Socios | Sistema'
      },
      {
        path:'meetings',
        component:MeetingsListComponent,
        title:'Administración de Reuniones | Sistema'
      },
      {
        path:'meetings/add',
        component:AddMeetingComponent,
        title:'Nueva Reunión | Sistema'
      },
      {
        path:'meetings/edit/:id',
        component:AddMeetingComponent,
        title:'Editar Reunión | Sistema'
      },
      {
        path:'meetings/:id/attendance',
        loadComponent: () => import('./pages/meetings/meeting-attendance.component').then(m => m.MeetingAttendanceComponent),
        title:'Asistencia de Reunión | Sistema'
      },
      // Water System Routes
      {
        path:'water-dashboard',
        component:WaterDashboardComponent,
        title:'Dashboard de Cobranza | Sistema de Agua'
      },
      {
        path:'water-readings',
        component:ReadingsListComponent,
        title:'Lecturas de Medidor | Sistema de Agua'
      },
      {
        path:'water-readings/add',
        component:AddReadingComponent,
        title:'Nueva Lectura | Sistema de Agua'
      },
      {
        path:'water-bills',
        component:BillsListComponent,
        title:'Facturas de Agua | Sistema de Agua'
      },
      {
        path:'water-bills/generate',
        component:GenerateBillsComponent,
        title:'Generar Facturas | Sistema de Agua'
      },
      {
        path:'water-payments/add',
        component:AddPaymentComponent,
        title:'Registrar Pago | Sistema de Agua'
      },
      {
        path:'water-payments/partner',
        component:PartnerPaymentsComponent,
        title:'Cobros por Socio | Sistema de Agua'
      },
      // Cash Balance Routes
      {
        path:'cash-balances',
        component:CashBalancesListComponent,
        title:'Balances de Caja | Sistema'
      },
      {
        path:'cash-balances/open',
        component:OpenCashBalanceComponent,
        title:'Abrir Balance de Caja | Sistema'
      },
      {
        path:'cash-balances/:id',
        component:CashBalanceDetailsComponent,
        title:'Detalles del Balance | Sistema'
      },
    ]
  },
  // auth pages
  {
    path:'signin',
    component:SignInComponent,
    title:'Angular Sign In Dashboard | TailAdmin - Angular Admin Dashboard Template'
  },
  {
    path:'signup',
    component:SignUpComponent,
    title:'Angular Sign Up Dashboard | TailAdmin - Angular Admin Dashboard Template'
  },
  // error pages
  {
    path:'**',
    component:NotFoundComponent,
    title:'Angular NotFound Dashboard | TailAdmin - Angular Admin Dashboard Template'
  },
];
