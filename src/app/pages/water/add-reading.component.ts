import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, tap, filter } from 'rxjs/operators';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { DatePickerComponent } from '../../shared/components/form/date-picker/date-picker.component';
import { WaterReadingService } from '../../shared/services/water-reading.service';
import { PartnerService } from '../../shared/services/partner.service';
import { WaterBillService } from '../../shared/services/water-bill.service';
import { WaterMeterReadingInputDto, PartnerOutputDto, WaterBillOutputDto } from '../../shared/models/water-system.models';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-add-reading',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageBreadcrumbComponent,
    ButtonComponent,
    DatePickerComponent
  ],
  template: `
    <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <app-page-breadcrumb [pageTitle]="'Nueva Lectura de Medidor'" [breadcrumbItems]="breadcrumbItems"></app-page-breadcrumb>

      <!-- Alertas -->
      <div *ngIf="showAlert" [ngClass]="{
        'mb-4 rounded-lg p-4': true,
        'bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200': alertType === 'success',
        'bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200': alertType === 'error',
        'bg-yellow-50 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200': alertType === 'warning'
      }">
        <div class="flex items-center justify-between">
          <span>{{ alertMessage }}</span>
          <button (click)="showAlert = false" class="text-2xl">&times;</button>
        </div>
      </div>

      <!-- Información de Factura Generada -->
      <div *ngIf="generatedBill" class="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <h4 class="mb-2 font-semibold text-green-800 dark:text-green-200">
              <svg class="mr-2 inline h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Factura Generada Automáticamente
            </h4>
            <div class="space-y-1 text-sm text-green-700 dark:text-green-300">
              <p><strong>Número de Factura:</strong> {{ generatedBill.billNumber }}</p>
              <p><strong>Monto Total:</strong> {{ generatedBill.totalAmount | currency:'BOB':'symbol':'1.2-2' }}</p>
              <p><strong>Fecha de Vencimiento:</strong> {{ generatedBill.dueDate | date:'dd/MM/yyyy' }}</p>
              <p><strong>Estado:</strong> {{ generatedBill.statusName }}</p>
            </div>
            <div class="mt-3">
              <app-button 
                (click)="viewBill(generatedBill.id)" 
                [variant]="'primary'" 
                class="text-sm"
              >
                Ver Factura
              </app-button>
            </div>
          </div>
          <button (click)="generatedBill = null" class="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Formulario -->
      <div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div class="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
          <h3 class="font-medium text-black dark:text-white">
            Información de la Lectura
          </h3>
        </div>

        <form (ngSubmit)="onSubmit()" class="p-6.5">
          <!-- Selección de Socio -->
          <div class="mb-4.5">
            <label class="mb-2.5 block text-black dark:text-white">
              Socio <span class="text-meta-1">*</span>
            </label>
            <div class="relative partner-search-container">
              <input
                type="text"
                [(ngModel)]="partnerSearch"
                name="partnerSearch"
                (input)="onPartnerSearch()"
                (focus)="onInputFocus()"
                (keydown.escape)="showPartnerDropdown = false"
                placeholder="Buscar socio por nombre, documento o número de conexión..."
                autocomplete="off"
                class="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              />
              
              <!-- Icono de búsqueda -->
              <svg *ngIf="!selectedPartner" class="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-bodydark pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              
              <!-- Loading spinner -->
              <svg *ngIf="isSearching" class="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary animate-spin pointer-events-none" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              
              <!-- Mensaje: Escribe al menos 3 caracteres -->
              <div *ngIf="partnerSearch && partnerSearch.length > 0 && partnerSearch.length < 3 && !selectedPartner" 
                   class="absolute z-999 w-full mt-1 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg shadow-default p-4">
                <div class="flex items-center gap-3 text-bodydark">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <p class="text-sm">Escribe al menos <strong>3 caracteres</strong> para buscar</p>
                </div>
              </div>

              <!-- Mensaje: Buscando en servidor... -->
              <div *ngIf="isSearching && partnerSearch && partnerSearch.length >= 3" 
                   class="absolute z-999 w-full mt-1 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg shadow-default p-4">
                <div class="flex items-center gap-3 text-primary">
                  <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p class="text-sm font-medium">Buscando socios...</p>
                </div>
              </div>

              <!-- Dropdown de resultados (Autocomplete) -->
              <div *ngIf="showPartnerDropdown && filteredPartners.length > 0" 
                   class="absolute z-50 w-full mt-1 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg shadow-2xl max-h-64 overflow-y-auto partner-dropdown">
                <div *ngFor="let partner of filteredPartners; let i = index" 
                     (mousedown)="selectPartner(partner)"
                     class="p-3 hover:bg-primary/10 dark:hover:bg-primary/20 cursor-pointer border-b border-stroke/50 dark:border-strokedark/50 last:border-b-0 transition-colors">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <p class="font-semibold text-black dark:text-white mb-1">{{ partner.fullName }}</p>
                      <div class="flex flex-wrap gap-2 text-xs text-bodydark">
                        <span class="inline-flex items-center">
                          <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"/>
                          </svg>
                          {{ partner.partnerIdentificationNumber }}
                        </span>
                        <span *ngIf="partner.waterConnectionNumber" class="inline-flex items-center text-primary">
                          <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
                          </svg>
                          {{ partner.waterConnectionNumber }}
                        </span>
                        <span *ngIf="partner.waterMeterNumber" class="inline-flex items-center text-meta-3">
                          <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                          </svg>
                          {{ partner.waterMeterNumber }}
                        </span>
                      </div>
                    </div>
                    <svg class="w-5 h-5 text-primary flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
              </div>
              
              <!-- Mensaje cuando no hay resultados -->
              <div *ngIf="!isSearching && filteredPartners.length === 0 && partnerSearch && partnerSearch.length >= 3 && !selectedPartner && !isSelectingPartner"
                   class="absolute z-50 w-full mt-1 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg shadow-lg p-4 text-center">
                <svg class="w-12 h-12 mx-auto mb-2 text-bodydark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p class="text-sm text-bodydark">No se encontraron socios con "<strong>{{ partnerSearch }}</strong>"</p>
                <p class="text-xs text-bodydark mt-1">Intenta con otro término</p>
              </div>
            </div>
            
            <!-- Socio seleccionado -->
            <div *ngIf="selectedPartner" class="mt-3 p-3 bg-gray-2 dark:bg-meta-4 rounded-lg">
              <div class="flex justify-between items-start">
                <div>
                  <p class="font-medium text-black dark:text-white">{{ selectedPartner.fullName }}</p>
                  <p class="text-sm text-bodydark">DNI: {{ selectedPartner.partnerIdentificationNumber }}</p>
                  <p class="text-sm text-bodydark">Conexión: {{ selectedPartner.waterConnectionNumber }}</p>
                  <p class="text-sm text-bodydark">Medidor: {{ selectedPartner.waterMeterNumber }}</p>
                </div>
                <button type="button" (click)="clearPartner()" class="text-red-500 hover:text-red-700">
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Fecha de Lectura -->
          <div class="mb-4.5">
            <app-date-picker
              id="readingDate"
              label="Fecha de Lectura *"
              placeholder="Seleccione una fecha"
              [dateFormat]="'Y-m-d'"
              [defaultDate]="readingDateObject"
              [locale]="'es'"
              [firstDayOfWeek]="1"
              (dateChange)="onReadingDateChange($event)"
            ></app-date-picker>
          </div>

          <!-- Lectura Actual -->
          <div class="mb-4.5">
            <label class="mb-2.5 block text-black dark:text-white">
              Lectura Actual (m³) <span class="text-meta-1">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              [(ngModel)]="currentReading"
              name="currentReading"
              placeholder="Ej: 150.50"
              class="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            />
          </div>

          <!-- Observaciones -->
          <div class="mb-6">
            <label class="mb-2.5 block text-black dark:text-white">
              Observaciones
            </label>
            <textarea
              [(ngModel)]="observation"
              name="observation"
              rows="4"
              placeholder="Observaciones sobre la lectura..."
              class="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            ></textarea>
          </div>

          <!-- Botones -->
          <div class="flex gap-4">
            <app-button 
              type="submit" 
              [variant]="'primary'"
              [disabled]="isLoading || !isFormValid()"
            >
              <span *ngIf="!isLoading">Registrar Lectura</span>
              <span *ngIf="isLoading">Registrando...</span>
            </app-button>

            <app-button 
              type="button"
              [variant]="'secondary'"
              (click)="onCancel()"
              [disabled]="isLoading"
            >
              Cancelar
            </app-button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class AddReadingComponent implements OnInit, OnDestroy {
  breadcrumbItems = [
    { label: 'Dashboard', link: '/' },
    { label: 'Lecturas', link: '/water-readings' },
    { label: 'Nueva Lectura', link: '/water-readings/add' }
  ];

  // Búsqueda de socio con RxJS
  partnerSearch = '';
  searchTerms$ = new Subject<string>();
  filteredPartners: PartnerOutputDto[] = [];
  selectedPartner: PartnerOutputDto | null = null;
  showPartnerDropdown = false;
  isSearching = false;
  isSelectingPartner = false; // Bandera para evitar búsqueda al seleccionar

  // Campos del formulario
  readingDate = '';
  readingDateObject: Date = new Date(); // Date object para el date picker
  currentReading: number | null = null;
  observation = '';

  // Estados
  isLoading = false;
  showAlert = false;
  alertType: 'success' | 'error' | 'warning' = 'success';
  alertMessage = '';

  // Información de factura generada
  generatedBill: WaterBillOutputDto | null = null;

  constructor(
    private waterReadingService: WaterReadingService,
    private partnerService: PartnerService,
    private waterBillService: WaterBillService,
    private router: Router,
    private authService: AuthService
  ) {
    // Establecer fecha actual por defecto
    const today = new Date();
    this.readingDateObject = today;
    this.readingDate = today.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.setupAutocomplete();

    // Cerrar dropdown al hacer click fuera
    document.addEventListener('click', this.handleClickOutside.bind(this));
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.handleClickOutside.bind(this));
    this.searchTerms$.complete();
  }

  setupAutocomplete(): void {
    this.searchTerms$.pipe(
      // Debug: log cada término de búsqueda
      tap(term => console.log('🔍 Término recibido:', term)),

      // Filtrar solo términos con al menos 3 caracteres
      filter(term => term.length >= 3),

      // Esperar 400ms después de cada keystroke antes de buscar
      debounceTime(400),

      // Ignorar si el término es el mismo que el anterior
      distinctUntilChanged(),

      // Debug: log términos que pasan los filtros
      tap(term => console.log('🔎 Buscando en servidor:', term)),

      // Indicar que está buscando
      tap(() => {
        this.isSearching = true;
        this.showPartnerDropdown = true;
      }),

      // Cancelar búsquedas anteriores y hacer nueva búsqueda
      switchMap(term =>
        this.partnerService.searchPartners(term).pipe(
          // En caso de error, retornar array vacío
          catchError(error => {
            console.error('❌ Error en búsqueda:', error);
            this.showAlertMessage('Error al buscar socios', 'error');
            return of([]);
          })
        )
      ),

      // Filtrar solo socios con conexión activa
      tap(partners => console.log('✅ Resultados del servidor:', partners.length)),
      tap(partners => {
        this.filteredPartners = partners.filter(p => {
          const isActive = !p.connectionStatusCode || p.connectionStatusCode === 'ACTIVE';
          return isActive;
        });
        console.log('✅ Socios con conexión activa:', this.filteredPartners.length);
        this.isSearching = false;
      })
    ).subscribe({
      error: (error) => {
        console.error('❌ Error en el stream de búsqueda:', error);
        this.isSearching = false;
      }
    });
  }

  handleClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    // Cerrar solo si el click NO es en el contenedor de búsqueda ni en el dropdown
    if (!target.closest('.partner-search-container') && !target.closest('.partner-dropdown')) {
      this.showPartnerDropdown = false;
    }
  }


  onInputFocus(): void {
    // Si ya tiene texto con al menos 3 caracteres, volver a buscar
    if (this.partnerSearch && this.partnerSearch.length >= 3) {
      this.searchTerms$.next(this.partnerSearch);
    }
  }

  onPartnerSearch(): void {
    // Si se está seleccionando un socio, no hacer búsqueda
    if (this.isSelectingPartner) {
      return;
    }

    if (!this.partnerSearch) {
      this.filteredPartners = [];
      this.showPartnerDropdown = false;
      return;
    }

    const query = this.partnerSearch.trim();

    // Si tiene menos de 3 caracteres, limpiar y ocultar
    if (query.length < 3) {
      this.filteredPartners = [];
      this.showPartnerDropdown = false;
      return;
    }

    // Emitir el término de búsqueda al Subject
    // El observable se encargará de debounce, distinctUntilChanged y switchMap
    this.searchTerms$.next(query);
  }

  selectPartner(partner: PartnerOutputDto): void {
    console.log('👤 Socio seleccionado:', partner);

    // Activar bandera para evitar que se dispare la búsqueda
    this.isSelectingPartner = true;

    // Primero limpiar y cerrar todo
    this.showPartnerDropdown = false;
    this.filteredPartners = [];

    // Luego establecer el socio seleccionado
    this.selectedPartner = partner;

    // Finalmente actualizar el campo de búsqueda (esto puede disparar input, pero la bandera lo previene)
    this.partnerSearch = partner.fullName;

    // Verificar si ya existe una lectura para este mes
    if (this.readingDate) {
      this.checkExistingReadingForMonth();
    }

    // Desactivar bandera después de un delay para permitir que el input se actualice sin disparar búsqueda
    setTimeout(() => {
      this.isSelectingPartner = false;
    }, 300);
  }

  clearPartner(): void {
    this.selectedPartner = null;
    this.partnerSearch = '';
    this.filteredPartners = [];
  }

  isFormValid(): boolean {
    const isValid = !!(
      this.selectedPartner &&
      this.readingDate &&
      this.currentReading !== null &&
      this.currentReading > 0
    );

    console.log('🔍 Validación del formulario:', {
      isValid,
      selectedPartner: !!this.selectedPartner,
      readingDate: !!this.readingDate,
      currentReading: this.currentReading,
      currentReadingValid: this.currentReading !== null && this.currentReading > 0
    });

    return isValid;
  }

  onReadingDateChange(event: any): void {
    // El evento viene de flatpickr con dateStr en formato YYYY-MM-DD
    if (event && event.selectedDates && event.selectedDates.length > 0) {
      const selectedDate = event.selectedDates[0];
      this.readingDateObject = selectedDate;
      // Convertir a formato YYYY-MM-DD para el backend
      this.readingDate = selectedDate.toISOString().split('T')[0];
    } else if (event && event.dateStr) {
      // Fallback: si solo tenemos dateStr
      this.readingDate = event.dateStr;
      const dateObj = new Date(event.dateStr);
      if (!isNaN(dateObj.getTime())) {
        this.readingDateObject = dateObj;
      }
    }

    // Verificar si ya existe una lectura para este mes
    if (this.selectedPartner && this.readingDate) {
      this.checkExistingReadingForMonth();
    }
  }

  checkExistingReadingForMonth(): void {
    if (!this.selectedPartner || !this.readingDate) {
      return;
    }

    this.waterReadingService.checkReadingExistsForMonth(this.selectedPartner.id, this.readingDate).subscribe({
      next: (exists) => {
        if (exists) {
          const date = new Date(this.readingDate);
          const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
          const monthName = monthNames[date.getMonth()];
          const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
          this.showAlertMessage(
            `Ya existe una lectura registrada para este socio en el mes de ${capitalizedMonth} ${date.getFullYear()}. Solo se permite una lectura por mes.`,
            'warning'
          );
        }
      },
      error: (error) => {
        console.error('Error al verificar lectura existente:', error);
      }
    });
  }

  onSubmit(): void {
    console.log('📤 onSubmit llamado');
    console.log('📊 Estado del formulario:', {
      selectedPartner: this.selectedPartner,
      partnerSearch: this.partnerSearch,
      readingDate: this.readingDate,
      currentReading: this.currentReading,
      observation: this.observation
    });

    if (!this.isFormValid()) {
      console.log('❌ Formulario inválido');
      this.showAlertMessage('Por favor complete todos los campos obligatorios', 'warning');
      return;
    }

    // Verificar si ya existe una lectura para este mes antes de enviar
    this.waterReadingService.checkReadingExistsForMonth(this.selectedPartner!.id, this.readingDate).subscribe({
      next: (exists) => {
        if (exists) {
          const date = new Date(this.readingDate);
          const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
          const monthName = monthNames[date.getMonth()];
          const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
          this.showAlertMessage(
            `Ya existe una lectura registrada para este socio en el mes de ${capitalizedMonth} ${date.getFullYear()}. Solo se permite una lectura por mes.`,
            'error'
          );
          return;
        }

        // Si no existe, proceder con el envío
        this.proceedWithSubmission();
      },
      error: (error) => {
        console.error('Error al verificar lectura existente:', error);
        // En caso de error, proceder con el envío (el backend también validará)
        this.proceedWithSubmission();
      }
    });
  }

  private proceedWithSubmission(): void {
    console.log('✅ Formulario válido, enviando...');

    this.isLoading = true;

    const readingInput: WaterMeterReadingInputDto = {
      partnerId: this.selectedPartner!.id,
      userId: this.authService.getUserInfo().userId,
      readingDate: this.readingDate,
      currentReading: this.currentReading!,
      observation: this.observation || undefined
    };

    console.log('📦 DTO a enviar:', readingInput);

    this.waterReadingService.createReading(readingInput).subscribe({
      next: (response) => {
        // Obtener la factura generada automáticamente
        this.waterBillService.getBillsByPartner(this.selectedPartner!.id).subscribe({
          next: (bills) => {
            // Obtener la factura más reciente que tenga esta lectura
            const billForThisReading = bills.find(b => b.readingId === response.id);
            if (billForThisReading) {
              this.generatedBill = billForThisReading;
              this.showAlertMessage(
                `Lectura registrada exitosamente. Factura ${billForThisReading.billNumber} generada automáticamente.`,
                'success'
              );
              // Redirigir a la página de facturas después de 3 segundos
              setTimeout(() => {
                this.router.navigate(['/water-bills']);
              }, 3000);
            } else {
              // Si no se encuentra la factura, mostrar mensaje genérico y redirigir a lecturas
              this.showAlertMessage('Lectura registrada exitosamente', 'success');
              setTimeout(() => {
                this.router.navigate(['/water-readings']);
              }, 2000);
            }
          },
          error: (error) => {
            console.error('Error al obtener factura generada:', error);
            this.showAlertMessage('Lectura registrada exitosamente. Verifique si se generó la factura en la lista de facturas.', 'success');
            setTimeout(() => {
              this.router.navigate(['/water-bills']);
            }, 2000);
          }
        });
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al crear lectura:', error);

        let errorMsg = 'Error al registrar la lectura';
        if (error.status === 400) {
          errorMsg = error.error?.message || 'La lectura actual debe ser mayor a la anterior';
        } else if (error.status === 404) {
          errorMsg = 'Socio no encontrado';
        }

        this.showAlertMessage(errorMsg, 'error');
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/water-readings']);
  }

  viewBill(billId: string): void {
    // Navegar a la lista de facturas - la factura recién creada debería estar visible
    this.router.navigate(['/water-bills']);
  }

  showAlertMessage(message: string, type: 'success' | 'error' | 'warning'): void {
    this.alertMessage = message;
    this.alertType = type;
    this.showAlert = true;

    setTimeout(() => {
      this.showAlert = false;
    }, 5000);
  }
}

