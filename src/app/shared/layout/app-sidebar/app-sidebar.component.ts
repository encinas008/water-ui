import { CommonModule } from '@angular/common';
import { Component, ElementRef, QueryList, ViewChildren, ChangeDetectorRef } from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { SafeHtmlPipe } from '../../pipe/safe-html.pipe';
import { AuthService } from '../../services/auth.service';

import { combineLatest, Subscription } from 'rxjs';

type NavItem = {
  name: string;
  icon: string;
  path?: string;
  new?: boolean;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean; roles?: string[] }[];
  roles?: string[];
};

@Component({
  selector: 'app-sidebar',
  imports: [
    CommonModule,
    RouterModule,
    SafeHtmlPipe
  ],
  templateUrl: './app-sidebar.component.html',
})
export class AppSidebarComponent {

  // Main nav items
  navItems: NavItem[] = [
    {
      name: "Sistema de Gestión de Agua",
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.5 3.25C4.25736 3.25 3.25 4.25736 3.25 5.5V8.99998C3.25 10.2426 4.25736 11.25 5.5 11.25H9C10.2426 11.25 11.25 10.2426 11.25 8.99998V5.5C11.25 4.25736 10.2426 3.25 9 3.25H5.5ZM4.75 5.5C4.75 5.08579 5.08579 4.75 5.5 4.75H9C9.41421 4.75 9.75 5.08579 9.75 5.5V8.99998C9.75 9.41419 9.41421 9.74998 9 9.74998H5.5C5.08579 9.74998 4.75 9.41419 4.75 8.99998V5.5ZM5.5 12.75C4.25736 12.75 3.25 13.7574 3.25 15V18.5C3.25 19.7426 4.25736 20.75 5.5 20.75H9C10.2426 20.75 11.25 19.7427 11.25 18.5V15C11.25 13.7574 10.2426 12.75 9 12.75H5.5ZM4.75 15C4.75 14.5858 5.08579 14.25 5.5 14.25H9C9.41421 14.25 9.75 14.5858 9.75 15V18.5C9.75 18.9142 9.41421 19.25 9 19.25H5.5C5.08579 19.25 4.75 18.9142 4.75 18.5V15ZM12.75 5.5C12.75 4.25736 13.7574 3.25 15 3.25H18.5C19.7426 3.25 20.75 4.25736 20.75 5.5V8.99998C20.75 10.2426 19.7426 11.25 18.5 11.25H15C13.7574 11.25 12.75 10.2426 12.75 8.99998V5.5ZM15 4.75C14.5858 4.75 14.25 5.08579 14.25 5.5V8.99998C14.25 9.41419 14.5858 9.74998 15 9.74998H18.5C18.9142 9.74998 19.25 9.41419 19.25 8.99998V5.5C19.25 5.08579 18.9142 4.75 18.5 4.75H15ZM15 12.75C13.7574 12.75 12.75 13.7574 12.75 15V18.5C12.75 19.7426 13.7574 20.75 15 20.75H18.5C19.7426 20.75 20.75 19.7427 20.75 18.5V15C20.75 13.7574 19.7426 12.75 18.5 12.75H15ZM14.25 15C14.25 14.5858 14.5858 14.25 15 14.25H18.5C18.9142 14.25 19.25 14.5858 19.25 15V18.5C19.25 18.9142 18.9142 19.25 18.5 19.25H15C14.5858 19.25 14.25 18.9142 14.25 18.5V15Z" fill="currentColor"></path></svg>`,
      path: "/water-dashboard",
      roles: ['ADMINISTRADOR', 'SUPER_ADMIN']
    },
    {
      name: "Usuarios",
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/></svg>`,
      subItems: [
        { name: "Lista de Usuarios", path: "/users", pro: false },
        { name: "Nuevo Usuario", path: "/users/add", pro: false }
      ],
      roles: ['ADMINISTRADOR']
    },
    {
      name: "Roles",
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="currentColor"/></svg>`,
      subItems: [
        { name: "Lista de Roles", path: "/roles", pro: false },
        { name: "Nuevo Rol", path: "/roles/add", pro: false }
      ],
      roles: ['SUPER_ADMIN']
    },
    {
      name: "Socios",
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 3.5C7.30558 3.5 3.5 7.30558 3.5 12C3.5 14.1526 4.3002 16.1184 5.61936 17.616C6.17279 15.3096 8.24852 13.5955 10.7246 13.5955H13.2746C15.7509 13.5955 17.8268 15.31 18.38 17.6167C19.6996 16.119 20.5 14.153 20.5 12C20.5 7.30558 16.6944 3.5 12 3.5ZM17.0246 18.8566V18.8455C17.0246 16.7744 15.3457 15.0955 13.2746 15.0955H10.7246C8.65354 15.0955 6.97461 16.7744 6.97461 18.8455V18.856C8.38223 19.8895 10.1198 20.5 12 20.5C13.8798 20.5 15.6171 19.8898 17.0246 18.8566ZM2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM11.9991 7.25C10.8847 7.25 9.98126 8.15342 9.98126 9.26784C9.98126 10.3823 10.8847 11.2857 11.9991 11.2857C13.1135 11.2857 14.0169 10.3823 14.0169 9.26784C14.0169 8.15342 13.1135 7.25 11.9991 7.25ZM8.48126 9.26784C8.48126 7.32499 10.0563 5.75 11.9991 5.75C13.9419 5.75 15.5169 7.32499 15.5169 9.26784C15.5169 11.2107 13.9419 12.7857 11.9991 12.7857C10.0563 12.7857 8.48126 11.2107 8.48126 9.26784Z" fill="currentColor"></path></svg>`,
      subItems: [
        { name: "Lista de Socios", path: "/partners", pro: false },
        { name: "Crear Socio", path: "/add-partner", pro: false }
      ],
      roles: ['ADMINISTRADOR', 'CAJERO']
    },
    {
      name: "Trabajos",
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M9 2C8.44772 2 8 2.44772 8 3V4H6C4.34315 4 3 5.34315 3 7V19C3 20.6569 4.34315 22 6 22H18C19.6569 22 21 20.6569 21 19V7C21 5.34315 19.6569 4 18 4H16V3C16 2.44772 15.5523 2 15 2C14.4477 2 14 2.44772 14 3V4H10V3C10 2.44772 9.55228 2 9 2ZM6 6H18C18.5523 6 19 6.44772 19 7V19C19 19.5523 18.5523 20 18 20H6C5.44772 20 5 19.5523 5 19V7C5 6.44772 5.44772 6 6 6ZM7 10C7 9.44772 7.44772 9 8 9H16C16.5523 9 17 9.44772 17 10C17 10.5523 16.5523 11 16 11H8C7.44772 11 7 10.5523 7 10ZM8 13C7.44772 13 7 13.4477 7 14C7 14.5523 7.44772 15 8 15H16C16.5523 15 17 14.5523 17 14C17 13.4477 16.5523 13 16 13H8Z" fill="currentColor"></path></svg>`,
      subItems: [
        { name: "Lista de Trabajos", path: "/jobs", pro: false },
        { name: "Nuevo Trabajo", path: "/jobs/add", pro: false }
      ],
      roles: ['ADMINISTRADOR']
    },
    {
      name: "Reuniones",
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M8 2C8.41421 2 8.75 2.33579 8.75 2.75V3.75H15.25V2.75C15.25 2.33579 15.5858 2 16 2C16.4142 2 16.75 2.33579 16.75 2.75V3.75H18.5C19.7426 3.75 20.75 4.75736 20.75 6V9V19C20.75 20.2426 19.7426 21.25 18.5 21.25H5.5C4.25736 21.25 3.25 20.2426 3.25 19V9V6C3.25 4.75736 4.25736 3.75 5.5 3.75H7.25V2.75C7.25 2.33579 7.58579 2 8 2ZM8 5.25H5.5C5.08579 5.25 4.75 5.58579 4.75 6V8.25H19.25V6C19.25 5.58579 18.9142 5.25 18.5 5.25H16H8ZM19.25 9.75H4.75V19C4.75 19.4142 5.08579 19.75 5.5 19.75H18.5C18.9142 19.75 19.25 19.4142 19.25 19V9.75Z" fill="currentColor"></path></svg>`,
      subItems: [
        { name: "Lista de Reuniones", path: "/meetings", pro: false },
        { name: "Nueva Reunión", path: "/meetings/add", pro: false }
      ],
      roles: ['ADMINISTRADOR']
    },
    {
      name: "Lecturas de Medidor",
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor"/><path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="currentColor"/></svg>`,
      subItems: [
        { name: "Lista de Lecturas", path: "/water-readings", pro: false },
        { name: "Nueva Lectura", path: "/water-readings/add", pro: false, roles: ['SUPER_ADMIN'] }
      ],
      roles: ['ADMINISTRADOR', 'LECTOR DE MEDIDORES', 'SUPER_ADMIN']
    },
    {
      name: "Efectuar Cobro",
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" fill="currentColor"/><path d="M8 16h8v2H8zm0-4h8v2H8zm0-4h5v2H8z" fill="currentColor"/></svg>`,
      subItems: [
        { name: "Lista de Facturas", path: "/water-bills", pro: false },
        { name: "Generar Facturas", path: "/water-bills/generate", pro: false, roles: ['SUPER_ADMIN', 'ADMINISTRADOR'] }
      ],
      roles: ['ADMINISTRADOR', 'CAJERO']
    },
    // {
    //   name: "Pagos",
    //   icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" fill="currentColor"/></svg>`,
    //   subItems: [
    //     { name: "Registrar Pago", path: "/water-payments/add", pro: false }
    //   ],
    // },
    {
      name: "Balances de Caja",
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8h16v10zm-5-6H9v2h6v-2z" fill="currentColor"/></svg>`,
      subItems: [
        { name: "Lista de Balances", path: "/cash-balances", pro: false },
        { name: "Abrir Balance", path: "/cash-balances/open", pro: false },
        { name: "Registrar Ingreso", path: "/cash-balances/income", pro: false },
        { name: "Registrar Retiro", path: "/cash-balances/withdrawal", pro: false }
      ],
      roles: ['ADMINISTRADOR', 'CAJERO']
    },
    {
      name: "Configuración",
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 8.25C9.92893 8.25 8.25 9.92893 8.25 12C8.25 14.0711 9.92893 15.75 12 15.75C14.0711 15.75 15.75 14.0711 15.75 12C15.75 9.92893 14.0711 8.25 12 8.25ZM9.75 12C9.75 10.7574 10.7574 9.75 12 9.75C13.2426 9.75 14.25 10.7574 14.25 12C14.25 13.2426 13.2426 14.25 12 14.25C10.7574 14.25 9.75 13.2426 9.75 12Z" fill="currentColor"/><path fill-rule="evenodd" clip-rule="evenodd" d="M11.0175 2.75C10.6072 2.75 10.2316 2.99307 10.0665 3.37091L9.12347 5.43729C8.84084 6.05382 8.1992 6.43028 7.52148 6.35618L5.32984 6.09173C4.92322 6.04277 4.52801 6.23832 4.32249 6.59467L3.34 8.40533C3.13448 8.76168 3.15785 9.20916 3.39933 9.54022L4.82738 11.4798C5.19579 11.9782 5.19579 12.6518 4.82738 13.1502L3.39933 15.0898C3.15785 15.4208 3.13448 15.8683 3.34 16.2247L4.32249 18.0353C4.52801 18.3917 4.92322 18.5872 5.32984 18.5383L7.52148 18.2738C8.1992 18.1997 8.84084 18.5762 9.12347 19.1927L10.0665 21.2591C10.2316 21.6369 10.6072 21.88 11.0175 21.88H12.9825C13.3928 21.88 13.7684 21.6369 13.9335 21.2591L14.8765 19.1927C15.1592 18.5762 15.8008 18.1997 16.4785 18.2738L18.6702 18.5383C19.0768 18.5872 19.472 18.3917 19.6775 18.0353L20.66 16.2247C20.8655 15.8683 20.8422 15.4208 20.6007 15.0898L19.1726 13.1502C18.8042 12.6518 18.8042 11.9782 19.1726 11.4798L20.6007 9.54022C20.8422 9.20916 20.8655 8.76168 20.66 8.40533L19.6775 6.59467C19.472 6.23832 19.0768 6.04277 18.6702 6.09173L16.4785 6.35618C15.8008 6.43028 15.1592 6.05382 14.8765 5.43729L13.9335 3.37091C13.7684 2.99307 13.3928 2.75 12.9825 2.75H11.0175ZM11.5665 4.25H12.4335L13.3765 6.31638C13.9418 7.54944 15.2247 8.30256 16.5798 8.15462L18.7715 7.89017L19.254 8.72483L17.826 10.6644C17.0892 11.6612 17.0892 13.0688 17.826 14.0656L19.254 16.0052L18.7715 16.8398L16.5798 16.5754C15.2247 16.4274 13.9418 17.1806 13.3765 18.4136L12.4335 20.48H11.5665L10.6235 18.4136C10.0582 17.1806 8.77534 16.4274 7.42024 16.5754L5.22851 16.8398L4.74596 16.0052L6.17401 14.0656C6.91083 13.0688 6.91083 11.6612 6.17401 10.6644L4.74596 8.72483L5.22851 7.89017L7.42024 8.15462C8.77534 8.30256 10.0582 7.54944 10.6235 6.31638L11.5665 4.25Z" fill="currentColor"/></svg>`,
      subItems: [
        { name: "Facturación", path: "/settings/billing-config", pro: false }
      ],
      roles: ['ADMINISTRADOR']
    },
    {
      name: "Reportes",
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M6 2C4.34315 2 3 3.34315 3 5V19C3 20.6569 4.34315 22 6 22H18C19.6569 22 21 20.6569 21 19V9C21 7.34315 19.6569 6 18 6H13V5C13 3.34315 11.6569 2 10 2H6ZM11 6V5C11 4.44772 10.5523 4 10 4H6C5.44772 4 5 4.44772 5 5V19C5 19.5523 5.44772 20 6 20H18C18.5523 20 19 19.5523 19 19V9C19 8.44772 18.5523 8 18 8H11V6ZM7 10C7 9.44772 7.44772 9 8 9H16C16.5523 9 17 9.44772 17 10C17 10.5523 16.5523 11 16 11H8C7.44772 11 7 10.5523 7 10ZM8 13C7.44772 13 7 13.4477 7 14C7 14.5523 7.44772 15 8 15H16C16.5523 15 17 14.5523 17 14C17 13.4477 16.5523 13 16 13H8ZM7 18C7 17.4477 7.44772 17 8 17H12C12.5523 17 13 17.4477 13 18C13 18.5523 12.5523 19 12 19H8C7.44772 19 7 18.5523 7 18Z" fill="currentColor"/></svg>`,
      subItems: [
        { name: "Reporte de Ingresos", path: "/reports/income", pro: false },
        { name: "Reporte de Egresos", path: "/reports/expenses", pro: false },
        { name: "Reporte de Condonados", path: "/reports/waived", pro: false },
        { name: "Reporte de Deudores", path: "/reports/debtors", pro: false },
        { name: "Reporte Mensual", path: "/reports/monthly-bills", pro: false },
        { name: "Cortes (4+ meses)", path: "/reports/cutoff-candidates", pro: false },
        { name: "Resumen de Movimientos", path: "/reports/movements", pro: false },
        { name: "Lecturas por Mes", path: "/reports/readings", pro: false },
        { name: "Lecturas Faltantes", path: "/reports/missing-readings", pro: false },
        { name: "Observaciones de Lecturas", path: "/reports/reading-observations", pro: false },
        { name: "Estado de Socios", path: "/reports/partners-status", pro: false },
        { name: "Exceso de Consumo", path: "/reports/excess-consumption", pro: false },
      ],
      roles: ['ADMINISTRADOR', 'CAJERO']
    },


  ];
  // Others nav items
  othersItems: NavItem[] = [];

  /**
   * Obtiene la lista de ítems de navegación filtrados según el rol del usuario.
   */
  /**
   * Obtiene la lista de ítems de navegación filtrados según el rol del usuario.
   */
  get filteredNavItems(): NavItem[] {
    const userInfo = this.authService.getUserInfo();
    const rawRole = userInfo?.role;
    const userRole = rawRole?.trim()?.toUpperCase() || '';

    // Función auxiliar para verificar si alguno de las roles permitidas coincide con el usuario
    const hasAccess = (allowedRoles?: string[]): boolean => {
      // Si no hay restricciones, el acceso es público (para usuarios logueados)
      if (!allowedRoles || allowedRoles.length === 0) return true;
      if (!userRole) return false;

      const normalizedUserRole = userRole.replace(/\s+/g, '_');

      // SUPER_ADMIN tiene acceso a TODO por defecto
      if (normalizedUserRole === 'SUPER_ADMIN' || normalizedUserRole === 'SUPER_ADMINISTRADOR') return true;

      return allowedRoles.some(role => {
        const normalizedAllowed = role.trim().toUpperCase().replace(/\s+/g, '_');

        // Coincidencia exacta (normalizada)
        if (normalizedAllowed === normalizedUserRole) return true;

        // Alias comunes
        if (normalizedAllowed === 'ADMINISTRADOR' && normalizedUserRole === 'ADMIN') return true;
        if (normalizedAllowed === 'ADMIN' && normalizedUserRole === 'ADMINISTRADOR') return true;

        return false;
      });
    };

    return this.navItems
      .filter(item => hasAccess(item.roles))
      .map(item => {
        // Clonamos para evitar mutar el array original
        const filteredItem = { ...item };

        if (filteredItem.subItems) {
          filteredItem.subItems = filteredItem.subItems.filter(sub => hasAccess(sub.roles));
        }

        return filteredItem;
      })
      .filter(item => {
        // Un ítem es válido si tiene un path (es un link directo)
        // o si tiene sub-ítems visibles (es un dropdown)
        return !!item.path || (!!item.subItems && item.subItems.length > 0);
      });
  }

  openSubmenu: string | null | number = null;
  subMenuHeights: { [key: string]: number } = {};
  @ViewChildren('subMenu') subMenuRefs!: QueryList<ElementRef>;

  readonly isExpanded$;
  readonly isMobileOpen$;
  readonly isHovered$;

  private subscription: Subscription = new Subscription();

  constructor(
    public sidebarService: SidebarService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {
    this.isExpanded$ = this.sidebarService.isExpanded$;
    this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
    this.isHovered$ = this.sidebarService.isHovered$;
  }

  ngOnInit() {
    // Subscribe to router events
    this.subscription.add(
      this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
          this.setActiveMenuFromRoute(this.router.url);
        }
      })
    );

    // Subscribe to combined observables to close submenus when all are false
    this.subscription.add(
      combineLatest([this.isExpanded$, this.isMobileOpen$, this.isHovered$]).subscribe(
        ([isExpanded, isMobileOpen, isHovered]) => {
          if (!isExpanded && !isMobileOpen && !isHovered) {
            // this.openSubmenu = null;
            // this.savedSubMenuHeights = { ...this.subMenuHeights };
            // this.subMenuHeights = {};
            this.cdr.detectChanges();
          } else {
            // Restore saved heights when reopening
            // this.subMenuHeights = { ...this.savedSubMenuHeights };
            // this.cdr.detectChanges();
          }
        }
      )
    );

    // Initial load
    this.setActiveMenuFromRoute(this.router.url);
  }

  ngOnDestroy() {
    // Clean up subscriptions
    this.subscription.unsubscribe();
  }

  isActive(path: string): boolean {
    return this.router.url === path;
  }

  toggleSubmenu(section: string, index: number) {
    const key = `${section}-${index}`;

    if (this.openSubmenu === key) {
      this.openSubmenu = null;
      this.subMenuHeights[key] = 0;
    } else {
      this.openSubmenu = key;

      setTimeout(() => {
        const el = document.getElementById(key);
        if (el) {
          this.subMenuHeights[key] = el.scrollHeight;
          this.cdr.detectChanges(); // Ensure UI updates
        }
      });
    }
  }

  onSidebarMouseEnter() {
    this.isExpanded$.subscribe(expanded => {
      if (!expanded) {
        this.sidebarService.setHovered(true);
      }
    }).unsubscribe();
  }

  private setActiveMenuFromRoute(currentUrl: string) {
    const menuGroups = [
      { items: this.navItems, prefix: 'main' },
      { items: this.othersItems, prefix: 'others' },
    ];

    menuGroups.forEach(group => {
      group.items.forEach((nav, i) => {
        if (nav.subItems) {
          nav.subItems.forEach(subItem => {
            if (currentUrl === subItem.path) {
              const key = `${group.prefix}-${i}`;
              this.openSubmenu = key;

              setTimeout(() => {
                const el = document.getElementById(key);
                if (el) {
                  this.subMenuHeights[key] = el.scrollHeight;
                  this.cdr.detectChanges(); // Ensure UI updates
                }
              });
            }
          });
        }
      });
    });
  }

  onSubmenuClick() {
    console.log('click submenu');
    this.isMobileOpen$.subscribe(isMobile => {
      if (isMobile) {
        this.sidebarService.setMobileOpen(false);
      }
    }).unsubscribe();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/signin']);
    this.isMobileOpen$.subscribe(isMobile => {
      if (isMobile) {
        this.sidebarService.setMobileOpen(false);
      }
    }).unsubscribe();
  }


}
