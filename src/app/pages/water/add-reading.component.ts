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
import { toast } from 'ngx-sonner';

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
  templateUrl: './add-reading.component.html',
  styles: ``
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

      // Filtrar solo términos con al menos 1 caracter
      filter(term => term.length >= 1),

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
            toast.error('Error al buscar socios');
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
    // Si ya tiene texto con al menos 1 caracter, volver a buscar
    if (this.partnerSearch && this.partnerSearch.length >= 1) {
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

    // Si tiene menos de 1 caracter, limpiar y ocultar
    if (query.length < 1) {
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
          toast.warning(`Ya existe una lectura registrada para este socio en el mes de ${capitalizedMonth} ${date.getFullYear()}. Solo se permite una lectura por mes.`);
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
      toast.warning('Por favor complete todos los campos obligatorios');
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
          toast.error(`Ya existe una lectura registrada para este socio en el mes de ${capitalizedMonth} ${date.getFullYear()}. Solo se permite una lectura por mes.`);
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
              toast.success(`Lectura registrada exitosamente.Factura ${billForThisReading.billNumber} generada automáticamente.`);
              this.router.navigate(['/water-bills']);
            } else {
              // Si no se encuentra la factura, mostrar mensaje genérico y redirigir a lecturas
              toast.success('Lectura registrada exitosamente');
              this.router.navigate(['/water-readings']);
            }
          },
          error: (error) => {
            console.error('Error al obtener factura generada:', error);
            toast.success('Lectura registrada exitosamente');
            this.router.navigate(['/water-bills']);
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

        toast.error(errorMsg);
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
}
